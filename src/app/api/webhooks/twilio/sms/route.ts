import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateTwilioSignature } from "@/lib/twilio";
import { advanceConversation } from "@/lib/conversation";
import { recordNewConversation } from "@/lib/usage";
import { resolveByDialedNumber } from "@/lib/locations";

export const runtime = "nodejs";

/**
 * Twilio SMS webhook — fires when a customer texts an Edison number (either in
 * reply to the missed-call auto-text, or cold). We log the inbound message and
 * let the Claude conversation engine produce + send the next reply.
 */
export async function POST(req: Request) {
  const url = req.url;
  const form = await req.formData();
  const params: Record<string, string> = {};
  for (const [k, v] of form.entries()) params[k] = String(v);

  if (
    !validateTwilioSignature({
      signature: req.headers.get("x-twilio-signature"),
      url,
      params,
    })
  ) {
    return new NextResponse("Invalid signature", { status: 403 });
  }

  const customerPhone = params.From;
  const edisonNumber = params.To;
  const body = (params.Body ?? "").trim();
  const messageSid = params.MessageSid;

  if (!customerPhone || !edisonNumber || !body) {
    return emptyTwiml();
  }

  const resolved = await resolveByDialedNumber(edisonNumber);
  if (!resolved) return emptyTwiml();
  const { business, locationId } = resolved;

  // Find an open conversation for this caller, or open a new one (cold inbound).
  let conversation = await prisma.conversation.findFirst({
    where: {
      businessId: business.id,
      customerPhone,
      status: { in: ["new", "needs_followup", "booked"] },
    },
    orderBy: { createdAt: "desc" },
  });

  let isNew = false;
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { businessId: business.id, locationId, customerPhone, status: "new" },
    });
    isNew = true;
  }

  // Log the inbound message.
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      direction: "inbound",
      body,
      twilioSid: messageSid || null,
    },
  });

  if (isNew) {
    await recordNewConversation(business.id, business.conversationLimit);
  }

  // Run the AI turn (generates + sends the reply, updates triage fields).
  try {
    await advanceConversation(conversation.id);
  } catch (err) {
    console.error("advanceConversation failed:", err);
  }

  // We send the reply ourselves via the REST API (above), so return empty TwiML.
  return emptyTwiml();
}

function emptyTwiml() {
  return new NextResponse(
    '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
    { status: 200, headers: { "Content-Type": "text/xml" } },
  );
}
