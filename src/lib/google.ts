import { google } from "googleapis";
import type { Business } from "@prisma/client";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
];

function redirectUri(): string {
  const base = process.env.APP_BASE_URL || "http://localhost:3000";
  return `${base}/api/google/callback`;
}

export function googleConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );
}

function oauthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri(),
  );
}

/** Consent URL for connecting a Google Calendar. `state` carries the business id. */
export function getAuthUrl(state: string): string {
  return oauthClient().generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // force refresh_token issuance
    scope: SCOPES,
    state,
  });
}

/** Exchange an OAuth code for tokens; returns the refresh token to persist. */
export async function exchangeCode(
  code: string,
): Promise<{ refreshToken: string | null }> {
  const client = oauthClient();
  const { tokens } = await client.getToken(code);
  return { refreshToken: tokens.refresh_token ?? null };
}

function calendarFor(business: Business) {
  const client = oauthClient();
  client.setCredentials({ refresh_token: business.googleRefreshToken! });
  return google.calendar({ version: "v3", auth: client });
}

export interface Slot {
  iso: string; // start time ISO
  label: string; // human label, e.g. "Tue 2:00–4:00 PM"
}

/**
 * Find open appointment slots over the next `days` days within rough business
 * hours (8am–6pm), using Google free/busy. Returns up to `max` slots.
 */
export async function findOpenSlots(
  business: Business,
  opts: { days?: number; durationMin?: number; max?: number } = {},
): Promise<Slot[]> {
  if (!business.googleRefreshToken || !googleConfigured()) return [];
  const days = opts.days ?? 3;
  const durationMin = opts.durationMin ?? 120;
  const max = opts.max ?? 3;

  const cal = calendarFor(business);
  const calendarId = business.googleCalendarId || "primary";
  const now = new Date();
  const timeMin = new Date(now.getTime() + 60 * 60 * 1000); // 1h from now
  const timeMax = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const fb = await cal.freebusy.query({
    requestBody: {
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      items: [{ id: calendarId }],
    },
  });
  const busy = fb.data.calendars?.[calendarId]?.busy ?? [];

  const slots: Slot[] = [];
  const cursor = new Date(timeMin);
  cursor.setMinutes(0, 0, 0);

  while (cursor < timeMax && slots.length < max) {
    const hour = cursor.getHours();
    // Candidate windows at 8/10/12/14/16 within business hours.
    if (hour >= 8 && hour <= 16 && [8, 10, 12, 14, 16].includes(hour)) {
      const start = new Date(cursor);
      const end = new Date(start.getTime() + durationMin * 60 * 1000);
      const overlaps = busy.some((b) => {
        const bs = new Date(b.start!).getTime();
        const be = new Date(b.end!).getTime();
        return start.getTime() < be && end.getTime() > bs;
      });
      if (!overlaps) {
        slots.push({ iso: start.toISOString(), label: labelSlot(start, end) });
      }
    }
    cursor.setHours(cursor.getHours() + 2);
  }
  return slots;
}

function labelSlot(start: Date, end: Date): string {
  const day = start.toLocaleDateString("en-US", { weekday: "short" });
  const fmt = (d: Date) =>
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${day} ${fmt(start)}–${fmt(end)}`;
}

/** Create a calendar event for a booked job. */
export async function createBooking(
  business: Business,
  opts: {
    startISO: string;
    durationMin?: number;
    summary: string;
    description?: string;
  },
): Promise<{ eventId: string | null; htmlLink: string | null }> {
  if (!business.googleRefreshToken || !googleConfigured()) {
    return { eventId: null, htmlLink: null };
  }
  const cal = calendarFor(business);
  const start = new Date(opts.startISO);
  const end = new Date(start.getTime() + (opts.durationMin ?? 120) * 60 * 1000);
  const res = await cal.events.insert({
    calendarId: business.googleCalendarId || "primary",
    requestBody: {
      summary: opts.summary,
      description: opts.description,
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
    },
  });
  return { eventId: res.data.id ?? null, htmlLink: res.data.htmlLink ?? null };
}
