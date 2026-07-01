import { prisma } from "./prisma";
import { currentMonth } from "./usage";
import { subscriptionCost as planSubscriptionCost } from "./pricing";
import { getCurrentBusiness } from "./auth";

export interface RecentLead {
  id: string;
  name: string;
  initials: string;
  summary: string;
  status: string; // new | booked | needs_followup | closed
  value: number | null;
}

export interface DashboardData {
  businessName: string;
  recoveredThisMonth: number;
  subscriptionCost: number;
  jobsBooked: number;
  avgTicket: number;
  conversationsUsed: number;
  conversationLimit: number;
  needsFollowup: number;
  recentLeads: RecentLead[];
  paidForItself: boolean;
  returnMultiple: number;
  demo: boolean; // true when the DB is unavailable and we're showing sample data
}

function initialsOf(nameOrPhone: string): string {
  const parts = nameOrPhone.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  const digits = nameOrPhone.replace(/\D/g, "");
  return digits.slice(-2) || nameOrPhone.slice(0, 2).toUpperCase();
}

const DEMO: DashboardData = {
  businessName: "Rivera Comfort HVAC",
  recoveredThisMonth: 4200,
  subscriptionCost: 79,
  jobsBooked: 14,
  avgTicket: 300,
  conversationsUsed: 247,
  conversationLimit: 300,
  needsFollowup: 4,
  paidForItself: true,
  returnMultiple: 53.2,
  demo: true,
  recentLeads: [
    {
      id: "demo-1",
      name: "Marcus Reyes",
      initials: "MR",
      summary: "AC not cooling upstairs — booked for today 4–6pm",
      status: "booked",
      value: 420,
    },
    {
      id: "demo-2",
      name: "Dana Whitfield",
      initials: "DW",
      summary: "Water heater leaking — wants a callback to confirm time",
      status: "needs_followup",
      value: 650,
    },
    {
      id: "demo-3",
      name: "Luis Garrido",
      initials: "LG",
      summary: "Brake grinding — Edison is asking which day works",
      status: "new",
      value: 310,
    },
  ],
};

/**
 * Load dashboard metrics for the (first) business. Falls back to sample data
 * when the database isn't reachable, so the UI still renders during setup.
 */
export async function getDashboardData(): Promise<DashboardData> {
  try {
    const current = await getCurrentBusiness();
    if (!current) return DEMO;
    const business = await prisma.business.findUnique({
      where: { id: current.id },
      include: { locations: true },
    });
    if (!business) return DEMO;

    const month = currentMonth();
    const monthStart = new Date(`${month}-01T00:00:00`);

    const [bookedThisMonth, usage, needsFollowup, recent] = await Promise.all([
      prisma.conversation.findMany({
        where: {
          businessId: business.id,
          status: "booked",
          createdAt: { gte: monthStart },
        },
        select: { estimatedValue: true },
      }),
      prisma.usageRecord.findUnique({
        where: { businessId_month: { businessId: business.id, month } },
      }),
      prisma.conversation.count({
        where: { businessId: business.id, status: "needs_followup" },
      }),
      prisma.conversation.findMany({
        where: { businessId: business.id },
        orderBy: { updatedAt: "desc" },
        take: 6,
        select: {
          id: true,
          customerName: true,
          customerPhone: true,
          summary: true,
          status: true,
          estimatedValue: true,
        },
      }),
    ]);

    const avgTicket = Number(business.avgTicketPrice) || 0;
    const recovered = bookedThisMonth.reduce(
      (sum, c) => sum + (c.estimatedValue ? Number(c.estimatedValue) : avgTicket),
      0,
    );
    const subscriptionCost = planSubscriptionCost(
      business.plan,
      business.locations.length,
    );

    return {
      businessName: business.name,
      recoveredThisMonth: recovered,
      subscriptionCost,
      jobsBooked: bookedThisMonth.length,
      avgTicket,
      conversationsUsed: usage?.conversationCount ?? 0,
      conversationLimit: business.conversationLimit,
      needsFollowup,
      paidForItself: recovered >= subscriptionCost,
      returnMultiple:
        subscriptionCost > 0
          ? Math.round((recovered / subscriptionCost) * 10) / 10
          : 0,
      demo: false,
      recentLeads: recent.map((c) => {
        const name = c.customerName || c.customerPhone;
        return {
          id: c.id,
          name,
          initials: initialsOf(name),
          summary: c.summary || "New lead — Edison is gathering details",
          status: c.status,
          value: c.estimatedValue ? Number(c.estimatedValue) : null,
        };
      }),
    };
  } catch {
    // DB not configured/reachable yet — show the sample dashboard.
    return DEMO;
  }
}
