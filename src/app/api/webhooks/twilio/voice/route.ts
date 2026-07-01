import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateTwilioSignature, sendSms } from "@/lib/twilio";
import { initialGreeting } from "@/lib/conversation";
import { recordNewConversation } from "@/lib/usage";
import { resolveByDialedNumber } from "@/lib/locations";
import { isOptedOut } from "@/lib/optout";

export const runtime = "nodejs";

/**
 * Twilio Voice webhook — fires when a call to a business's forwarded line goes
 * unanswered (no-answer / busy) and reaches the Edison-provisioned number.
 *
 * We kick off a rescue: create a Conversation, send the initial AI auto-text,
 * and return TwiML that ends the call cleanly.
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

  const customerPhone = params.From; // the caller we want to rescue
  const edisonNumber = params.To; // the Edison-provisioned number that was dialed

  if (!customerPhone || !edisonNumber) {
    return twiml("<Response><Hangup/></Response>");
  }

  const resolved = await resolveByDialedNumber(edisonNumber);

  // Unknown number — nothing to do, just end the call.
  if (!resolved) {
    return twiml("<Response><Hangup/></Response>");
  }
  const { business, locationId } = resolved;

  // Respect SMS opt-out: never auto-text a caller who replied STOP.
  if (await isOptedOut(business.id, customerPhone)) {
    return twiml("<Response><Hangup/></Response>");
  }

  // A missed call reaching us proves call-forwarding is wired up correctly, so
  // the setup wizard's live test passes the first time Edison receives one.
  if (!business.setupCompleted) {
    await prisma.business.update({
      where: { id: business.id },
      data: { setupCompleted: true },
    });
  }

  // Reuse an open conversation for this caller if one exists, else create one.
  let conversation = await prisma.conversation.findFirst({
    where: {
      businessId: business.id,
      customerPhone,
      status: { in: ["new", "needs_followup"] },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        businessId: business.id,
        locationId,
        customerPhone,
        status: "new",
      },
    });
    await recordNewConversation(business.id, business.conversationLimit);
  }

  // Send the opening auto-text and log it.
  const greeting = initialGreeting(business);
  const outbound = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      direction: "outbound",
      body: greeting,
    },
  });

  try {
    const msg = await sendSms({
      to: customerPhone,
      from: edisonNumber, // reply from the number that was actually dialed (location-aware)
      body: greeting,
    });
    await prisma.message.update({
      where: { id: outbound.id },
      data: { twilioSid: msg.sid },
    });
  } catch (err) {
    console.error("Failed to send greeting SMS:", err);
  }

  // End the voice call — the conversation continues over SMS.
  return twiml("<Response><Hangup/></Response>");
}

function twiml(body: string) {
  return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?>${body}`, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}
