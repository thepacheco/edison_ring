import twilio from "twilio";

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
