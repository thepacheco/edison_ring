import { prisma } from "./prisma";
import type { Business } from "@prisma/client";

/**
 * Edison's built-in calendar — no Google/Outlook required. Availability comes
 * from the business's hours; appointments are conversations with a bookedSlot.
 * This lets Edison offer real open times and lets the owner see their schedule
 * in-app, working for every business (including pen-and-paper shops).
 */

export interface Slot {
  iso: string;
  label: string;
}

export interface Appointment {
  id: string;
  startAt: Date;
  customerName: string;
  customerPhone: string;
  summary: string;
  status: string;
  workerName: string | null;
  value: number | null;
}

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

type Hours = Record<string, { open?: string; close?: string } | null>;

/** Parse "7:00 AM" / "6:30 PM" → minutes from midnight, or null. */
function parseTime(s: string | undefined): number | null {
  if (!s) return null;
  const m = s.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const ap = m[3]?.toLowerCase();
  if (ap === "pm" && h < 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  return h * 60 + min;
}

const DEFAULT_HOURS: Hours = {
  mon: { open: "8:00 AM", close: "5:00 PM" },
  tue: { open: "8:00 AM", close: "5:00 PM" },
  wed: { open: "8:00 AM", close: "5:00 PM" },
  thu: { open: "8:00 AM", close: "5:00 PM" },
  fri: { open: "8:00 AM", close: "5:00 PM" },
  sat: null,
  sun: null,
};

function label(d: Date): string {
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Generate the next open appointment slots from the business's hours, skipping
 * times already booked. Used by the conversation engine when no external
 * calendar is connected.
 */
export async function localOpenSlots(
  business: Business,
  opts: { days?: number; max?: number; slotMinutes?: number } = {},
): Promise<Slot[]> {
  const days = opts.days ?? 14;
  const max = opts.max ?? 3;
  const slotMinutes = opts.slotMinutes ?? 60;
  const hours = ((business.businessHours as Hours) ?? DEFAULT_HOURS) || DEFAULT_HOURS;

  const now = new Date();
  const horizon = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  // Times already taken.
  const taken = await prisma.conversation.findMany({
    where: { businessId: business.id, bookedSlot: { gte: now, lt: horizon } },
    select: { bookedSlot: true },
  });
  const takenSet = new Set(taken.map((t) => t.bookedSlot!.getTime()));

  const slots: Slot[] = [];
  for (let dayOffset = 0; dayOffset < days && slots.length < max; dayOffset++) {
    const day = new Date(now);
    day.setDate(now.getDate() + dayOffset);
    const key = DAY_KEYS[day.getDay()];
    const h = hours[key];
    const open = parseTime(h?.open);
    const close = parseTime(h?.close);
    if (open == null || close == null) continue;

    for (let mins = open; mins + slotMinutes <= close && slots.length < max; mins += slotMinutes) {
      const start = new Date(day);
      start.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
      if (start <= now) continue; // no past slots (incl. earlier today)
      if (takenSet.has(start.getTime())) continue;
      slots.push({ iso: start.toISOString(), label: label(start) });
    }
  }
  return slots;
}

export interface CalendarData {
  appointments: Appointment[];
  summary: { booked: number; needsFollowup: number; recovered: number };
  demo: boolean;
}

/** Appointments (booked conversations) in a date range, for the calendar view. */
export async function getCalendarData(
  business: Business,
  rangeStart: Date,
  rangeEnd: Date,
  filter: string,
): Promise<CalendarData> {
  const avgTicket = Number(business.avgTicketPrice) || 0;
  const where: {
    businessId: string;
    bookedSlot: { gte: Date; lt: Date };
    status?: string;
  } = {
    businessId: business.id,
    bookedSlot: { gte: rangeStart, lt: rangeEnd },
  };
  if (filter && filter !== "all") where.status = filter;

  const convs = await prisma.conversation.findMany({
    where,
    include: { assignedWorker: true },
    orderBy: { bookedSlot: "asc" },
  });

  const appointments: Appointment[] = convs.map((c) => ({
    id: c.id,
    startAt: c.bookedSlot!,
    customerName: c.customerName || c.customerPhone,
    customerPhone: c.customerPhone,
    summary: c.summary || "Appointment",
    status: c.status,
    workerName: c.assignedWorker?.name ?? null,
    value: c.estimatedValue ? Number(c.estimatedValue) : null,
  }));

  const summary = {
    booked: appointments.filter((a) => a.status === "booked").length,
    needsFollowup: appointments.filter((a) => a.status === "needs_followup").length,
    recovered: appointments
      .filter((a) => a.status === "booked")
      .reduce((s, a) => s + (a.value ?? avgTicket), 0),
  };

  return { appointments, summary, demo: false };
}
