import { prisma } from "./prisma";

/**
 * SMS opt-out handling (TCPA / A2P 10DLC compliance). Carriers require that
 * STOP silences a sender, START re-subscribes, and HELP returns help text.
 * We manage this ourselves because we send via the Twilio REST API.
 */

const STOP_WORDS = new Set([
  "STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT", "OPTOUT", "OPT-OUT", "REVOKE",
]);
const START_WORDS = new Set(["START", "YES", "UNSTOP", "OPTIN", "OPT-IN"]);
const HELP_WORDS = new Set(["HELP", "INFO"]);

export type OptOutKeyword = "stop" | "start" | "help" | null;

/** Classify an inbound SMS body as a compliance keyword (or null). */
export function classifyKeyword(body: string): OptOutKeyword {
  const word = body.trim().toUpperCase().replace(/[.!]+$/, "");
  if (STOP_WORDS.has(word)) return "stop";
  if (START_WORDS.has(word)) return "start";
  if (HELP_WORDS.has(word)) return "help";
  return null;
}

export async function isOptedOut(businessId: string, phone: string): Promise<boolean> {
  const rec = await prisma.optOut.findUnique({
    where: { businessId_phone: { businessId, phone } },
  });
  return Boolean(rec);
}

export async function optOut(businessId: string, phone: string): Promise<void> {
  await prisma.optOut.upsert({
    where: { businessId_phone: { businessId, phone } },
    create: { businessId, phone },
    update: {},
  });
}

export async function optIn(businessId: string, phone: string): Promise<void> {
  await prisma.optOut.deleteMany({ where: { businessId, phone } });
}

/** Standard confirmation replies. Kept short (single SMS segment). */
export function stopReply(businessName: string): string {
  return `You've been unsubscribed from ${businessName} and won't receive more texts. Reply START to opt back in.`;
}

export function helpReply(businessName: string): string {
  return `${businessName} scheduling assistant. Reply STOP to unsubscribe. Msg & data rates may apply.`;
}

export function startReply(businessName: string): string {
  return `You're re-subscribed to ${businessName}. Reply STOP to unsubscribe at any time.`;
}
