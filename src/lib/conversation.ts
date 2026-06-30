import type Anthropic from "@anthropic-ai/sdk";
import type { Business, Worker, Message } from "@prisma/client";
import { anthropic, EDISON_MODEL } from "./anthropic";
import { prisma } from "./prisma";
import { sendSms } from "./twilio";
import { pickWorker } from "./routing";

// After this many customer messages without a booking, Edison stops trying to
// resolve over text and hands off to a human ("Let me have someone call you
// back directly").
const MAX_AI_EXCHANGES = 2;

export type AiIntent =
  | "booking_request"
  | "urgent"
  | "needs_human"
  | "general_inquiry";

export interface AiResult {
  reply: string;
  intent: AiIntent;
  customerNeed: string;
  customerName: string | null;
  readyToBook: boolean;
  proposedTime: string | null;
}

interface ToneSettings {
  greeting?: string;
  voice?: string; // e.g. "friendly", "professional", "brief"
}

const DEFAULT_GREETING_TEMPLATE =
  "Hi, this is Edison with {business} 👋 Sorry we missed your call! What can we help with?";

/** The very first auto-text Edison sends after a missed call. */
export function initialGreeting(business: Business): string {
  const tone = (business.aiToneSettings as ToneSettings | null) ?? {};
  const template = tone.greeting?.trim() || DEFAULT_GREETING_TEMPLATE;
  return template.replace(/\{business\}/g, business.name);
}

function formatBusinessHours(hours: unknown): string {
  if (!hours || typeof hours !== "object") return "Not specified.";
  const days = hours as Record<string, { open?: string; close?: string } | null>;
  const lines: string[] = [];
  for (const [day, v] of Object.entries(days)) {
    if (!v || (!v.open && !v.close)) lines.push(`${day}: closed`);
    else lines.push(`${day}: ${v.open}–${v.close}`);
  }
  return lines.length ? lines.join(", ") : "Not specified.";
}

function buildSystemPrompt(business: Business, workers: Worker[]): string {
  const tone = (business.aiToneSettings as ToneSettings | null) ?? {};
  const voice = tone.voice || "friendly but professional";
  const available = workers.filter((w) => w.isAvailable);

  return [
    `You are Edison, an SMS assistant that answers on behalf of ${business.name}, a ${business.businessType.replace(/_/g, " ")} business.`,
    `A customer called and the business could not pick up, so you are texting them back to capture the job before they call a competitor.`,
    ``,
    `Your goals, in order:`,
    `1. Understand what the customer needs (the problem, whether it's urgent, the property type and address if relevant).`,
    `2. Move toward booking a visit. ${available.length ? `The team has ${available.length} worker(s) available.` : `Staffing is limited right now.`}`,
    `3. If you can't resolve it over text in a couple of messages, hand off to a human.`,
    ``,
    `Business hours: ${formatBusinessHours(business.businessHours)}.`,
    `Average job value: $${Number(business.avgTicketPrice).toFixed(0)}.`,
    ``,
    `Style: ${voice}. Sound like a real person at a local shop, not a robot. Keep each text short (1–2 sentences, under ~300 characters). No corporate filler. Never invent prices, availability, or guarantees you weren't told.`,
    ``,
    `You MUST respond by calling the respond_to_customer tool every turn. Put the exact SMS to send in "reply".`,
  ].join("\n");
}

const RESPOND_TOOL: Anthropic.Tool = {
  name: "respond_to_customer",
  description:
    "Reply to the customer over SMS and record structured triage data about the conversation.",
  // strict mode guarantees the input validates exactly against this schema.
  // (cast keeps TS happy since `strict` is a newer field.)
  // @ts-expect-error strict is a valid top-level tool field
  strict: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      reply: {
        type: "string",
        description:
          "The SMS message to send back to the customer. 1–2 sentences, under ~300 characters.",
      },
      intent: {
        type: "string",
        enum: ["booking_request", "urgent", "needs_human", "general_inquiry"],
        description:
          "Best classification of what the customer wants right now.",
      },
      customer_need: {
        type: "string",
        description:
          "One short phrase summarizing what the customer needs (e.g. 'AC not cooling, upstairs unit').",
      },
      customer_name: {
        type: ["string", "null"],
        description: "The customer's name if they've shared it, otherwise null.",
      },
      ready_to_book: {
        type: "boolean",
        description:
          "True only if the customer has agreed to a specific appointment/time.",
      },
      proposed_time: {
        type: ["string", "null"],
        description:
          "The agreed or proposed appointment time as plain text, or null.",
      },
    },
    required: [
      "reply",
      "intent",
      "customer_need",
      "customer_name",
      "ready_to_book",
      "proposed_time",
    ],
  },
};

/**
 * Run one AI turn: send the full thread to Claude and get back the reply text
 * plus structured triage fields via a forced tool call.
 */
export async function generateAiReply(
  business: Business,
  workers: Worker[],
  messages: Pick<Message, "direction" | "body">[],
): Promise<AiResult> {
  const history: Anthropic.MessageParam[] = messages.map((m) => ({
    role: m.direction === "inbound" ? "user" : "assistant",
    content: m.body,
  }));

  // The API requires the first message to be from the user.
  if (history.length === 0 || history[0].role !== "user") {
    history.unshift({ role: "user", content: "(customer replied)" });
  }

  const response = await anthropic.messages.create({
    model: EDISON_MODEL,
    max_tokens: 1024,
    system: buildSystemPrompt(business, workers),
    tools: [RESPOND_TOOL],
    tool_choice: { type: "tool", name: "respond_to_customer" },
    messages: history,
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude did not return a respond_to_customer tool call");
  }

  const input = toolUse.input as {
    reply: string;
    intent: AiIntent;
    customer_need: string;
    customer_name: string | null;
    ready_to_book: boolean;
    proposed_time: string | null;
  };

  return {
    reply: input.reply,
    intent: input.intent,
    customerNeed: input.customer_need,
    customerName: input.customer_name,
    readyToBook: input.ready_to_book,
    proposedTime: input.proposed_time,
  };
}

/** Map AI result + exchange count to a conversation status. */
function resolveStatus(ai: AiResult, exchangeCount: number): {
  status: string;
  escalate: boolean;
} {
  if (ai.readyToBook) return { status: "booked", escalate: false };
  if (ai.intent === "needs_human" || ai.intent === "urgent")
    return { status: "needs_followup", escalate: true };
  if (exchangeCount >= MAX_AI_EXCHANGES)
    return { status: "needs_followup", escalate: true };
  return { status: "new", escalate: false };
}

const HANDOFF_MESSAGE =
  "Got it — let me have someone from the team call you back directly so we can get this sorted. Talk soon!";

/**
 * Handle a freshly received inbound SMS for an existing conversation:
 * log it, run the AI turn, apply escalation, persist, and send the reply.
 *
 * The inbound Message row must already be created by the caller (the webhook),
 * so this is idempotent-friendly and keeps Twilio parsing out of the engine.
 */
export async function advanceConversation(conversationId: string): Promise<void> {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      business: { include: { workers: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!conversation) throw new Error(`Conversation ${conversationId} not found`);

  const business = conversation.business;
  const workers = business.workers;
  const exchangeCount = conversation.messages.filter(
    (m) => m.direction === "inbound",
  ).length;

  // Assign a worker on the first inbound message if not already assigned.
  let assignedWorkerId = conversation.assignedWorkerId;
  if (!assignedWorkerId) {
    const firstInbound =
      conversation.messages.find((m) => m.direction === "inbound")?.body ?? "";
    assignedWorkerId = pickWorker(business, workers, firstInbound)?.id ?? null;
  }

  const ai = await generateAiReply(business, workers, conversation.messages);
  const { status, escalate } = resolveStatus(ai, exchangeCount);
  const replyText = escalate ? HANDOFF_MESSAGE : ai.reply;

  // Estimate recovered value once a job is booked.
  const estimatedValue =
    status === "booked" ? business.avgTicketPrice : conversation.estimatedValue;

  // Persist the outbound message + updated conversation, then send the SMS.
  const outbound = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      direction: "outbound",
      body: replyText,
    },
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      status,
      intent: ai.intent,
      summary: ai.customerNeed,
      customerName: ai.customerName ?? conversation.customerName,
      assignedWorkerId,
      estimatedValue,
      exchangeCount,
    },
  });

  try {
    // Day 1 is single-number; multi-location per-number routing lands on Day 3.
    const from = business.twilioNumber;
    const msg = await sendSms({
      to: conversation.customerPhone,
      from,
      body: replyText,
    });
    await prisma.message.update({
      where: { id: outbound.id },
      data: { twilioSid: msg.sid },
    });
  } catch (err) {
    // Keep the logged message; surface the send failure for observability.
    console.error("Failed to send SMS reply:", err);
  }
}
