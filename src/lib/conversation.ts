import type Anthropic from "@anthropic-ai/sdk";
import type { Business, Worker, Message } from "@prisma/client";
import { anthropic, EDISON_MODEL } from "./anthropic";
import { prisma } from "./prisma";
import { sendSms } from "./twilio";
import { pickWorker } from "./routing";
import { findOpenSlots, createBooking, type Slot } from "./google";

// After this many customer messages without a booking, Edison stops trying to
// resolve over text and hands off to a human.
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
  selectedSlotIso: string | null;
  usage: { inputTokens: number; outputTokens: number };
  model: string;
}

interface ToneSettings {
  greeting?: string;
  voice?: string;
}

const DEFAULT_GREETING_TEMPLATE =
  "Hi, this is Edison with {business} 👋 Sorry we missed your call! What can we help with?";

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

function buildSystemPrompt(
  business: Business,
  workers: Worker[],
  slots: Slot[],
): string {
  const tone = (business.aiToneSettings as ToneSettings | null) ?? {};
  const voice = tone.voice || "friendly but professional";
  const available = workers.filter((w) => w.isAvailable);

  const slotLines = slots.length
    ? slots.map((s) => `- ${s.label} (slot id: ${s.iso})`).join("\n")
    : "(no live calendar connected — collect the customer's preferred time and a human will confirm)";

  return [
    `You are Edison, an SMS assistant answering on behalf of ${business.name}, a ${business.businessType.replace(/_/g, " ")} business.`,
    `A customer called, the business could not pick up, and you are texting them back to capture the job before they call a competitor.`,
    ``,
    `Goals, in order:`,
    `1. Understand the need (problem, urgency, property type and address if relevant).`,
    `2. Book a visit. ${available.length ? `${available.length} worker(s) are available.` : `Staffing is limited right now.`}`,
    `3. If you can't resolve it over text in a couple of messages, hand off to a human.`,
    ``,
    `Business hours: ${formatBusinessHours(business.businessHours)}.`,
    `Average job value: $${Number(business.avgTicketPrice).toFixed(0)}.`,
    ``,
    `Open appointment slots you may offer:`,
    slotLines,
    `When the customer agrees to one of these slots, set ready_to_book=true and selected_slot_iso to that slot's exact slot id. Only offer slots from the list above; never invent times.`,
    ``,
    `Style: ${voice}. Sound like a real person at a local shop, not a robot. Keep each text to 1–2 sentences, under ~300 characters. No corporate filler. Never invent prices, availability, or guarantees.`,
    ``,
    `You MUST reply by calling the respond_to_customer tool every turn.`,
  ].join("\n");
}

const RESPOND_TOOL: Anthropic.Tool = {
  name: "respond_to_customer",
  description:
    "Reply to the customer over SMS and record structured triage data.",
  // @ts-expect-error strict is a valid top-level tool field
  strict: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      reply: {
        type: "string",
        description: "The SMS to send back. 1–2 sentences, under ~300 chars.",
      },
      intent: {
        type: "string",
        enum: ["booking_request", "urgent", "needs_human", "general_inquiry"],
        description: "Best classification of what the customer wants.",
      },
      customer_need: {
        type: "string",
        description: "Short phrase summarizing the need.",
      },
      customer_name: {
        type: ["string", "null"],
        description: "Customer's name if shared, else null.",
      },
      ready_to_book: {
        type: "boolean",
        description: "True only if the customer agreed to a specific offered slot.",
      },
      selected_slot_iso: {
        type: ["string", "null"],
        description: "The exact slot id (ISO) the customer agreed to, or null.",
      },
    },
    required: [
      "reply",
      "intent",
      "customer_need",
      "customer_name",
      "ready_to_book",
      "selected_slot_iso",
    ],
  },
};

export async function generateAiReply(
  business: Business,
  workers: Worker[],
  messages: Pick<Message, "direction" | "body">[],
  slots: Slot[] = [],
): Promise<AiResult> {
  const history: Anthropic.MessageParam[] = messages.map((m) => ({
    role: m.direction === "inbound" ? "user" : "assistant",
    content: m.body,
  }));
  if (history.length === 0 || history[0].role !== "user") {
    history.unshift({ role: "user", content: "(customer replied)" });
  }

  const response = await anthropic.messages.create({
    model: EDISON_MODEL,
    max_tokens: 1024,
    system: buildSystemPrompt(business, workers, slots),
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
    selected_slot_iso: string | null;
  };

  return {
    reply: input.reply,
    intent: input.intent,
    customerNeed: input.customer_need,
    customerName: input.customer_name,
    readyToBook: input.ready_to_book,
    selectedSlotIso: input.selected_slot_iso,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
    model: response.model,
  };
}

function resolveStatus(
  ai: AiResult,
  exchangeCount: number,
  booked: boolean,
): { status: string; escalate: boolean } {
  if (booked) return { status: "booked", escalate: false };
  if (ai.intent === "needs_human" || ai.intent === "urgent")
    return { status: "needs_followup", escalate: true };
  if (exchangeCount >= MAX_AI_EXCHANGES)
    return { status: "needs_followup", escalate: true };
  return { status: "new", escalate: false };
}

const HANDOFF_MESSAGE =
  "Got it — let me have someone from the team call you back directly so we can get this sorted. Talk soon!";

/**
 * Handle a freshly received inbound SMS for an existing conversation: run the
 * AI turn (with live calendar slots), book if confirmed, persist, send reply.
 * The inbound Message row must already exist.
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

  let assignedWorkerId = conversation.assignedWorkerId;
  if (!assignedWorkerId) {
    const firstInbound =
      conversation.messages.find((m) => m.direction === "inbound")?.body ?? "";
    assignedWorkerId = pickWorker(business, workers, firstInbound)?.id ?? null;
  }

  // Pull live calendar slots so Edison can offer real times.
  let slots: Slot[] = [];
  try {
    slots = await findOpenSlots(business, { max: 3 });
  } catch (err) {
    console.error("findOpenSlots failed:", err);
  }

  const ai = await generateAiReply(business, workers, conversation.messages, slots);

  // Create the calendar event if the customer confirmed a real slot.
  let bookedSlot: Date | null = conversation.bookedSlot;
  let booked = false;
  if (ai.readyToBook && ai.selectedSlotIso) {
    const slot =
      slots.find((s) => s.iso === ai.selectedSlotIso) ?? {
        iso: ai.selectedSlotIso,
        label: ai.selectedSlotIso,
      };
    try {
      await createBooking(business, {
        startISO: slot.iso,
        summary: `${ai.customerName ?? "New customer"} — ${ai.customerNeed}`,
        description: `Booked by Edison from ${conversation.customerPhone}.`,
      });
      bookedSlot = new Date(slot.iso);
      booked = true;
    } catch (err) {
      console.error("createBooking failed:", err);
      // Still mark booked from the conversation's perspective; a human can
      // reconcile the calendar.
      bookedSlot = new Date(slot.iso);
      booked = true;
    }
  } else if (ai.readyToBook) {
    booked = true; // agreed to a time, no live calendar to write to
  }

  const { status, escalate } = resolveStatus(ai, exchangeCount, booked);
  const replyText = escalate ? HANDOFF_MESSAGE : ai.reply;
  const estimatedValue =
    status === "booked" ? business.avgTicketPrice : conversation.estimatedValue;

  const outbound = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      direction: "outbound",
      body: replyText,
      inputTokens: ai.usage.inputTokens,
      outputTokens: ai.usage.outputTokens,
      modelUsed: ai.model,
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
      bookedSlot,
    },
  });

  try {
    const msg = await sendSms({
      to: conversation.customerPhone,
      from: business.twilioNumber,
      body: replyText,
    });
    await prisma.message.update({
      where: { id: outbound.id },
      data: { twilioSid: msg.sid },
    });
  } catch (err) {
    console.error("Failed to send SMS reply:", err);
  }
}
