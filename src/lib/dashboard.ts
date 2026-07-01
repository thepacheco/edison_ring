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
  contacted: boolean; // owner/worker marked "reached out"
}

export interface TrendPoint {
  label: string; // week start, e.g. "6/3"
  leads: number;
  booked: number;
  recovered: number;
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
  trend: TrendPoint[]; // last 8 weeks
  funnel: { leads: number; engaged: number; booked: number }; // this month
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
  trend: [
    { label: "5/6", leads: 18, booked: 9, recovered: 2700 },
    { label: "5/13", leads: 22, booked: 12, recovered: 3600 },
    { label: "5/20", leads: 19, booked: 10, recovered: 3000 },
    { label: "5/27", leads: 26, booked: 15, recovered: 4500 },
    { label: "6/3", leads: 24, booked: 13, recovered: 3900 },
    { label: "6/10", leads: 29, booked: 17, recovered: 5100 },
    { label: "6/17", leads: 31, booked: 18, recovered: 5400 },
    { label: "6/24", leads: 27, booked: 14, recovered: 4200 },
  ],
  funnel: { leads: 62, engaged: 41, booked: 14 },
  recentLeads: [
    {
      id: "demo-1",
      name: "Marcus Reyes",
      initials: "MR",
      summary: "AC not cooling upstairs — booked for today 4–6pm",
      status: "booked",
      value: 420,
      contacted: true,
    },
    {
      id: "demo-2",
      name: "Dana Whitfield",
      initials: "DW",
      summary: "Water heater leaking — wants a callback to confirm time",
      status: "needs_followup",
      value: 650,
      contacted: false,
    },
    {
      id: "demo-3",
      name: "Luis Garrido",
      initials: "LG",
      summary: "Brake grinding — Edison is asking which day works",
      status: "new",
      value: 310,
      contacted: false,
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
    const now = new Date();
    const WEEKS = 8;
    const MS_WEEK = 7 * 24 * 60 * 60 * 1000;
    const windowStart = new Date(now.getTime() - WEEKS * MS_WEEK);
    const avgTicket = Number(business.avgTicketPrice) || 0;

    const [bookedThisMonth, usage, needsFollowup, recent, windowConvos] =
      await Promise.all([
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
            contactedAt: true,
          },
        }),
        prisma.conversation.findMany({
          where: { businessId: business.id, createdAt: { gte: windowStart } },
          select: { createdAt: true, status: true, estimatedValue: true, exchangeCount: true },
        }),
      ]);

    // Weekly trend (oldest → newest) from the 8-week window.
    const trend: TrendPoint[] = Array.from({ length: WEEKS }, (_, i) => {
      const weeksAgo = WEEKS - 1 - i;
      const d = new Date(now.getTime() - weeksAgo * MS_WEEK);
      return { label: `${d.getMonth() + 1}/${d.getDate()}`, leads: 0, booked: 0, recovered: 0 };
    });
    for (const c of windowConvos) {
      const weeksAgo = Math.floor((now.getTime() - new Date(c.createdAt).getTime()) / MS_WEEK);
      if (weeksAgo < 0 || weeksAgo >= WEEKS) continue;
      const idx = WEEKS - 1 - weeksAgo;
      trend[idx].leads++;
      if (c.status === "booked") {
        trend[idx].booked++;
        trend[idx].recovered += c.estimatedValue ? Number(c.estimatedValue) : avgTicket;
      }
    }

    // This-month funnel: leads → engaged (customer replied) → booked.
    const monthConvos = windowConvos.filter((c) => new Date(c.createdAt) >= monthStart);
    const funnel = {
      leads: monthConvos.length,
      engaged: monthConvos.filter((c) => (c.exchangeCount ?? 0) >= 1).length,
      booked: monthConvos.filter((c) => c.status === "booked").length,
    };

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
      trend,
      funnel,
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
          contacted: c.contactedAt != null,
        };
      }),
    };
  } catch {
    // DB not configured/reachable yet — show the sample dashboard.
    return DEMO;
  }
}
