import { prisma } from "./prisma";
import { currentMonth } from "./usage";
import { getCurrentBusiness } from "./auth";
import type { Business } from "@prisma/client";

/**
 * Resolve which business (and which location, if any) a dialed Edison number
 * belongs to. Location numbers take precedence over the primary business number.
 */
export async function resolveByDialedNumber(
  number: string,
): Promise<{ business: Business; locationId: string | null } | null> {
  const loc = await prisma.location.findUnique({
    where: { twilioNumber: number },
    include: { business: true },
  });
  if (loc) return { business: loc.business, locationId: loc.id };
  const business = await prisma.business.findUnique({ where: { twilioNumber: number } });
  if (business) return { business, locationId: null };
  return null;
}

export interface LocationMetric {
  id: string;
  name: string;
  address: string | null;
  twilioNumber: string;
  provisioned: boolean; // false when the number is still a placeholder
  active: boolean;
  latitude: number | null;
  longitude: number | null;
  leads: number;
  booked: number;
  recovered: number;
  needsFollowup: number;
  isPrimary: boolean;
}

export interface LocationsData {
  locations: LocationMetric[];
  combined: { leads: number; booked: number; recovered: number };
  demo: boolean;
}

const DEMO: LocationsData = {
  locations: [
    { id: "d1", name: "Northgate", address: "1420 Maple Ave, Seattle WA", twilioNumber: "+12065550110", provisioned: true, active: true, latitude: 47.7, longitude: -122.33, leads: 34, booked: 22, recovered: 2640, needsFollowup: 2, isPrimary: true },
    { id: "d2", name: "Eastside", address: "88 Bellevue Way, Bellevue WA", twilioNumber: "+14255550120", provisioned: true, active: true, latitude: 47.61, longitude: -122.2, leads: 21, booked: 13, recovered: 1560, needsFollowup: 1, isPrimary: false },
    { id: "d3", name: "Tacoma", address: "601 Pacific Ave, Tacoma WA", twilioNumber: "+12535550130", provisioned: true, active: true, latitude: 47.25, longitude: -122.44, leads: 12, booked: 7, recovered: 840, needsFollowup: 1, isPrimary: false },
  ],
  combined: { leads: 67, booked: 42, recovered: 5040 },
  demo: true,
};

export async function getLocationsData(): Promise<LocationsData> {
  try {
    const business = await getCurrentBusiness();
    if (!business) return DEMO;
    let locations = await prisma.location.findMany({
      where: { businessId: business.id },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    });

    // Legacy businesses created before primary-location auto-creation have no
    // primary row — synthesize one from the business's own number so the page
    // isn't empty and main-line conversations are still attributed.
    if (!locations.some((l) => l.isPrimary)) {
      locations = [
        {
          id: "__primary__",
          businessId: business.id,
          name: business.name,
          phoneNumber: business.phoneNumber,
          twilioNumber: business.twilioNumber,
          isPrimary: true,
          address: null,
          latitude: null,
          longitude: null,
          active: true,
          createdAt: business.createdAt,
        },
        ...locations,
      ];
    }

    const month = currentMonth();
    const monthStart = new Date(`${month}-01T00:00:00`);
    const avgTicket = Number(business.avgTicketPrice) || 0;
    const primaryId = locations.find((l) => l.isPrimary)?.id ?? null;

    // One query for the month's conversations, aggregated in memory — avoids an
    // N+1 query per location.
    const convs = await prisma.conversation.findMany({
      where: { businessId: business.id, createdAt: { gte: monthStart } },
      select: { locationId: true, status: true, estimatedValue: true },
    });

    type Acc = { leads: number; booked: number; recovered: number; needsFollowup: number };
    const acc = new Map<string, Acc>();
    for (const l of locations) acc.set(l.id, { leads: 0, booked: 0, recovered: 0, needsFollowup: 0 });

    for (const c of convs) {
      // Conversations with no location (main-line calls) roll up to the primary.
      const key = c.locationId && acc.has(c.locationId) ? c.locationId : primaryId;
      if (!key) continue;
      const a = acc.get(key)!;
      a.leads++;
      if (c.status === "booked") {
        a.booked++;
        a.recovered += c.estimatedValue ? Number(c.estimatedValue) : avgTicket;
      } else if (c.status === "needs_followup") {
        a.needsFollowup++;
      }
    }

    const metrics: LocationMetric[] = [];
    const combined = { leads: 0, booked: 0, recovered: 0 };
    for (const loc of locations) {
      const a = acc.get(loc.id)!;
      combined.leads += a.leads;
      combined.booked += a.booked;
      combined.recovered += a.recovered;
      metrics.push({
        id: loc.id,
        name: loc.name,
        address: loc.address,
        twilioNumber: loc.twilioNumber,
        provisioned: !loc.twilioNumber.startsWith("pending-"),
        active: loc.active,
        latitude: loc.latitude,
        longitude: loc.longitude,
        leads: a.leads,
        booked: a.booked,
        recovered: a.recovered,
        needsFollowup: a.needsFollowup,
        isPrimary: loc.isPrimary,
      });
    }
    return { locations: metrics, combined, demo: false };
  } catch {
    return DEMO;
  }
}
