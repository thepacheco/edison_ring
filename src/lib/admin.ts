import { prisma } from "./prisma";
import { currentMonth } from "./usage";
import { subscriptionCost, planFor, COGS, OVERAGE_RATE } from "./pricing";

export interface GrowthPoint {
  label: string; // month, e.g. "Jul"
  subscribers: number; // cumulative
  mrr: number; // cumulative
  newSignups: number;
}

export interface CustomerRow {
  name: string;
  email: string;
  plan: string;
  status: string; // none | trialing | active | past_due | canceled
  used: number; // conversations this month
  limit: number;
  locations: number;
  monthly: number; // what they pay
  flagged: boolean; // hard-cap review flag
}

export interface AdminMetrics {
  mrr: number;
  activeSubscribers: number;
  byPlan: { plan: string; count: number }[];
  trials: { name: string; daysLeft: number }[];
  conversionRate: number; // 0..1
  churnThisMonth: number;
  conversationsThisMonth: number;
  estCogs: number;
  margin: number; // mrr - estCogs
  growth: GrowthPoint[]; // last 6 months
  customers: CustomerRow[]; // every business, sorted riskiest first
  nearLimit: { name: string; used: number; limit: number }[];
  failedPayments: { name: string; email: string }[];
  demo: boolean;
}

const DEMO: AdminMetrics = {
  mrr: 1342,
  activeSubscribers: 17,
  byPlan: [
    { plan: "founding", count: 6 },
    { plan: "standard", count: 8 },
    { plan: "high_volume", count: 3 },
  ],
  trials: [
    { name: "Northgate Plumbing", daysLeft: 9 },
    { name: "Vela Auto", daysLeft: 3 },
  ],
  conversionRate: 0.42,
  churnThisMonth: 1,
  conversationsThisMonth: 3120,
  estCogs: 168.4,
  margin: 1173.6,
  growth: [
    { label: "Feb", subscribers: 3, mrr: 197, newSignups: 3 },
    { label: "Mar", subscribers: 6, mrr: 434, newSignups: 3 },
    { label: "Apr", subscribers: 9, mrr: 711, newSignups: 3 },
    { label: "May", subscribers: 12, mrr: 948, newSignups: 3 },
    { label: "Jun", subscribers: 15, mrr: 1185, newSignups: 3 },
    { label: "Jul", subscribers: 17, mrr: 1342, newSignups: 2 },
  ],
  customers: [
    { name: "Rivera Comfort HVAC", email: "owner@rivera.test", plan: "standard", status: "active", used: 247, limit: 300, locations: 1, monthly: 79, flagged: false },
    { name: "Northgate Plumbing", email: "np@demo.test", plan: "founding", status: "trialing", used: 41, limit: 300, locations: 1, monthly: 49, flagged: false },
    { name: "Vela Auto", email: "owner@vela.test", plan: "standard", status: "past_due", used: 120, limit: 300, locations: 2, monthly: 138, flagged: false },
  ],
  nearLimit: [{ name: "Rivera Comfort HVAC", used: 247, limit: 300 }],
  failedPayments: [{ name: "Vela Auto", email: "owner@vela.test" }],
  demo: true,
};

function daysBetween(a: Date, b: Date): number {
  return Math.ceil((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

export async function getAdminMetrics(): Promise<AdminMetrics> {
  try {
    const month = currentMonth();
    const monthStart = new Date(`${month}-01T00:00:00`);
    const now = new Date();

    const businesses = await prisma.business.findMany({
      include: { _count: { select: { locations: true } } },
    });
    if (businesses.length === 0) return DEMO;

    let mrr = 0;
    const planCounts: Record<string, number> = {};
    const trials: { name: string; daysLeft: number }[] = [];
    const failedPayments: { name: string; email: string }[] = [];
    let activeSubscribers = 0;

    for (const b of businesses) {
      const locs = Math.max(1, b._count.locations);
      const cost = subscriptionCost(b.plan, locs);
      if (b.subscriptionStatus === "active" || b.subscriptionStatus === "past_due") {
        mrr += cost;
        activeSubscribers += 1;
        planCounts[b.plan] = (planCounts[b.plan] ?? 0) + 1;
      }
      if (b.subscriptionStatus === "trialing" && b.trialEndsAt) {
        trials.push({ name: b.name, daysLeft: Math.max(0, daysBetween(b.trialEndsAt, now)) });
      }
      if (b.subscriptionStatus === "past_due") {
        failedPayments.push({ name: b.name, email: b.ownerEmail });
      }
    }

    // conversion: of accounts that have ever subscribed, how many are active.
    const everSubscribed = businesses.filter((b) => b.subscriptionStatus !== "none").length;
    const conversionRate = everSubscribed > 0 ? activeSubscribers / everSubscribed : 0;

    const churnThisMonth = businesses.filter(
      (b) => b.subscriptionStatus === "canceled" && b.canceledAt && b.canceledAt >= monthStart,
    ).length;

    // usage + COGS this month, platform-wide
    const usage = await prisma.usageRecord.aggregate({
      where: { month },
      _sum: { conversationCount: true },
    });
    const conversationsThisMonth = usage._sum.conversationCount ?? 0;

    const tokenAgg = await prisma.message.aggregate({
      where: { direction: "outbound", createdAt: { gte: monthStart } },
      _sum: { inputTokens: true, outputTokens: true },
    });
    const inTok = tokenAgg._sum.inputTokens ?? 0;
    const outTok = tokenAgg._sum.outputTokens ?? 0;
    const anthropicCost =
      (inTok / 1_000_000) * COGS.anthropicInputPerMTok +
      (outTok / 1_000_000) * COGS.anthropicOutputPerMTok;
    const twilioCost = conversationsThisMonth * COGS.twilioPerConversation;
    const estCogs = Math.round((anthropicCost + twilioCost) * 100) / 100;

    // Growth over the last 6 months (approximated from signup dates + current
    // plan cost — good enough for a trend without historical snapshots).
    const costOf = (b: (typeof businesses)[number]) =>
      subscriptionCost(b.plan, Math.max(1, b._count.locations));
    const isPaying = (b: (typeof businesses)[number]) =>
      b.subscriptionStatus === "active" ||
      b.subscriptionStatus === "past_due" ||
      b.subscriptionStatus === "trialing";
    const growth: GrowthPoint[] = [];
    for (let i = 5; i >= 0; i--) {
      const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const existing = businesses.filter((b) => b.createdAt < mEnd && isPaying(b));
      growth.push({
        label: mStart.toLocaleString("en-US", { month: "short" }),
        subscribers: existing.length,
        mrr: Math.round(existing.reduce((s, b) => s + costOf(b), 0)),
        newSignups: businesses.filter((b) => b.createdAt >= mStart && b.createdAt < mEnd).length,
      });
    }

    // near/over limit
    const usageRecords = await prisma.usageRecord.findMany({ where: { month } });
    const byBusiness = new Map(usageRecords.map((u) => [u.businessId, u]));
    const nearLimit = businesses
      .map((b) => {
        const used = byBusiness.get(b.id)?.conversationCount ?? 0;
        return { name: b.name, used, limit: b.conversationLimit };
      })
      .filter((x) => x.used >= x.limit * 0.8)
      .sort((a, b) => b.used / b.limit - a.used / a.limit);

    // Every customer, riskiest first: flagged > past_due > highest usage %.
    const statusRank = (s: string) =>
      s === "past_due" ? 0 : s === "trialing" ? 1 : s === "active" ? 2 : 3;
    const customers: CustomerRow[] = businesses
      .map((b) => ({
        name: b.name,
        email: b.ownerEmail,
        plan: b.plan,
        status: b.subscriptionStatus,
        used: byBusiness.get(b.id)?.conversationCount ?? 0,
        limit: b.conversationLimit,
        locations: Math.max(1, b._count.locations),
        monthly: costOf(b),
        flagged: b.flaggedForReview,
      }))
      .sort((a, b) => {
        if (a.flagged !== b.flagged) return a.flagged ? -1 : 1;
        if (statusRank(a.status) !== statusRank(b.status))
          return statusRank(a.status) - statusRank(b.status);
        return b.used / b.limit - a.used / a.limit;
      });

    return {
      mrr,
      activeSubscribers,
      byPlan: Object.entries(planCounts).map(([plan, count]) => ({ plan, count })),
      trials,
      conversionRate,
      churnThisMonth,
      conversationsThisMonth,
      estCogs,
      margin: Math.round((mrr - estCogs) * 100) / 100,
      growth,
      customers,
      nearLimit,
      failedPayments,
      demo: false,
    };
  } catch {
    return DEMO;
  }
}

export function planLabel(plan: string): string {
  return planFor(plan).name;
}

export { OVERAGE_RATE };
