import twilio from "twilio";
import crypto from "crypto";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

// Lazily construct the REST client so the app can boot (and serve the
// dashboard) even if Twilio creds aren't set yet.
let _client: ReturnType<typeof twilio> | null = null;

export function twilioClient() {
  if (!accountSid || !authToken) {
    throw new Error(
      "Twilio is not configured: set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.",
    );
  }
  if (!_client) {
    _client = twilio(accountSid, authToken);
  }
  return _client;
}

/** Send an SMS from one of our Twilio numbers to a customer. */
export async function sendSms(opts: {
  to: string;
  from: string;
  body: string;
}) {
  const message = await twilioClient().messages.create({
    to: opts.to,
    from: opts.from,
    body: opts.body,
  });
  return message;
}

export function twilioConfigured(): boolean {
  return Boolean(accountSid && authToken);
}

/**
 * Provision a new Twilio phone number for a location and point its Voice + SMS
 * webhooks at this app. Degrades gracefully to a placeholder if Twilio isn't
 * configured, so multi-location works in dev/testing.
 */
export async function provisionNumber(opts: {
  areaCode?: string;
} = {}): Promise<{ number: string; provisioned: boolean }> {
  if (!twilioConfigured()) {
    return { number: `pending-${crypto.randomUUID()}`, provisioned: false };
  }
  const base = process.env.APP_BASE_URL || "http://localhost:3000";
  const client = twilioClient();
  const available = await client
    .availablePhoneNumbers("US")
    .local.list({
      areaCode: opts.areaCode ? Number(opts.areaCode) : undefined,
      smsEnabled: true,
      voiceEnabled: true,
      limit: 1,
    });
  if (available.length === 0) {
    throw new Error("No available numbers for that area code");
  }
  const bought = await client.incomingPhoneNumbers.create({
    phoneNumber: available[0].phoneNumber,
    voiceUrl: `${base}/api/webhooks/twilio/voice`,
    smsUrl: `${base}/api/webhooks/twilio/sms`,
  });
  return { number: bought.phoneNumber, provisioned: true };
}

/**
 * Validate that an inbound webhook request genuinely came from Twilio.
 * Set TWILIO_SKIP_SIGNATURE_VALIDATION=true in local dev (no public URL).
 */
export function validateTwilioSignature(opts: {
  signature: string | null;
  url: string;
  params: Record<string, string>;
}): boolean {
  if (process.env.TWILIO_SKIP_SIGNATURE_VALIDATION === "true") return true;
  if (!authToken || !opts.signature) return false;
  return twilio.validateRequest(
    authToken,
    opts.signature,
    opts.url,
    opts.params,
  );
}
