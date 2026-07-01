import { prisma } from "./prisma";
import { currentMonth } from "./usage";
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
    const business = await prisma.business.findFirst();
    if (!business) return DEMO;
    const locations = await prisma.location.findMany({
      where: { businessId: business.id },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    });
    if (locations.length === 0) return { locations: [], combined: { leads: 0, booked: 0, recovered: 0 }, demo: false };

    const month = currentMonth();
    const monthStart = new Date(`${month}-01T00:00:00`);
    const avgTicket = Number(business.avgTicketPrice) || 0;

    const metrics: LocationMetric[] = [];
    const combined = { leads: 0, booked: 0, recovered: 0 };
    for (const loc of locations) {
      const convs = await prisma.conversation.findMany({
        where: { businessId: business.id, locationId: loc.id, createdAt: { gte: monthStart } },
        select: { status: true, estimatedValue: true },
      });
      const booked = convs.filter((c) => c.status === "booked");
      const recovered = booked.reduce((s, c) => s + (c.estimatedValue ? Number(c.estimatedValue) : avgTicket), 0);
      const needsFollowup = convs.filter((c) => c.status === "needs_followup").length;
      combined.leads += convs.length;
      combined.booked += booked.length;
      combined.recovered += recovered;
      metrics.push({
        id: loc.id,
        name: loc.name,
        address: loc.address,
        twilioNumber: loc.twilioNumber,
        provisioned: !loc.twilioNumber.startsWith("pending-"),
        active: loc.active,
        latitude: loc.latitude,
        longitude: loc.longitude,
        leads: convs.length,
        booked: booked.length,
        recovered,
        needsFollowup,
        isPrimary: loc.isPrimary,
      });
    }
    return { locations: metrics, combined, demo: false };
  } catch {
    return DEMO;
  }
}
