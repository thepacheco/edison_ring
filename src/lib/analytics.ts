import { prisma } from "./prisma";
import { currentMonth } from "./usage";
import { subscriptionCost as planSubscriptionCost, COGS } from "./pricing";

export interface WeekPoint {
  label: string; // "Jun 2"
  leads: number;
  booked: number;
  recovered: number;
}
export interface TopicRow {
  label: string;
  count: number;
}
export interface WorkerRow {
  name: string;
  booked: number;
  recovered: number;
}
export interface ActivityItem {
  id: string;
  name: string;
  text: string;
  status: string;
  when: string; // relative, e.g. "2h ago"
  value: number | null;
}

export interface AnalyticsData {
  recoveredThisMonth: number;
  recoveredLastMonth: number;
  subscriptionCost: number;
  roiMultiple: number;
  leads: number;
  booked: number;
  needsFollowup: number;
  conversionRate: number; // booked / leads
  avgReplySeconds: number;
  weeks: WeekPoint[];
  hourHistogram: number[]; // 24 buckets — when leads come in
  weekdayHistogram: number[]; // 7 buckets Sun..Sat
  topics: TopicRow[];
  intents: TopicRow[];
  workers: WorkerRow[];
  activity: ActivityItem[];
  demo: boolean;
}

const TOPIC_RULES: [string, RegExp][] = [
  ["AC / cooling", /\b(ac|a\/c|air ?condition|cooling|not cool)/i],
  ["Heating / furnace", /\b(furnace|heat|heater|no heat)/i],
  ["Water heater", /\bwater heater/i],
  ["Leak / plumbing", /\b(leak|drain|clog|pipe|sink|toilet|backed up)/i],
  ["Electrical", /\b(outlet|spark|breaker|panel|wiring|power)/i],
  ["Brakes", /\bbrake/i],
  ["Engine / check light", /\b(engine|check light|misfire)/i],
  ["Oil / tires", /\b(oil change|tire|rotation)/i],
  ["Booking / scheduling", /\b(appointment|schedule|book|today|tomorrow|available)/i],
];

function relTime(d: Date): string {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const DEMO: AnalyticsData = {
  recoveredThisMonth: 4200,
  recoveredLastMonth: 3100,
  subscriptionCost: 79,
  roiMultiple: 53.2,
  leads: 61,
  booked: 38,
  needsFollowup: 4,
  conversionRate: 0.62,
  avgReplySeconds: 8,
  weeks: [
    { label: "May 5", leads: 6, booked: 3, recovered: 900 },
    { label: "May 12", leads: 8, booked: 5, recovered: 1500 },
    { label: "May 19", leads: 7, booked: 4, recovered: 1200 },
    { label: "May 26", leads: 9, booked: 6, recovered: 1800 },
    { label: "Jun 2", leads: 11, booked: 7, recovered: 2100 },
    { label: "Jun 9", leads: 10, booked: 6, recovered: 1800 },
    { label: "Jun 16", leads: 13, booked: 9, recovered: 2700 },
    { label: "Jun 23", leads: 14, booked: 9, recovered: 2700 },
  ],
  hourHistogram: [0, 0, 0, 0, 0, 1, 2, 4, 7, 9, 8, 6, 7, 6, 5, 6, 8, 9, 6, 4, 3, 2, 1, 0],
  weekdayHistogram: [3, 12, 11, 10, 13, 9, 3],
  topics: [
    { label: "AC / cooling", count: 18 },
    { label: "Water heater", count: 11 },
    { label: "Leak / plumbing", count: 9 },
    { label: "Brakes", count: 7 },
    { label: "Booking / scheduling", count: 6 },
  ],
  intents: [
    { label: "booking_request", count: 34 },
    { label: "urgent", count: 12 },
    { label: "general_inquiry", count: 9 },
    { label: "needs_human", count: 6 },
  ],
  workers: [
    { name: "Theo Alvarez", booked: 21, recovered: 2340 },
    { name: "Sam Okafor", booked: 17, recovered: 1860 },
  ],
  activity: [
    { id: "d1", name: "Marcus Reyes", text: "Booked — AC not cooling upstairs", status: "booked", when: "2h ago", value: 420 },
    { id: "d2", name: "Dana Whitfield", text: "Needs follow-up — water heater leak", status: "needs_followup", when: "4h ago", value: 650 },
    { id: "d3", name: "Luis Garrido", text: "New lead — brake service", status: "new", when: "6h ago", value: 310 },
  ],
  demo: true,
};

export async function getAnalytics(): Promise<AnalyticsData> {
  try {
    const business = await prisma.business.findFirst({ include: { locations: true } });
    if (!business) return DEMO;

    const now = new Date();
    const month = currentMonth();
    const monthStart = new Date(`${month}-01T00:00:00`);
    const prevMonthStart = new Date(monthStart);
    prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);

    const [all, workers] = await Promise.all([
      prisma.conversation.findMany({
        where: { businessId: business.id },
        include: { messages: { orderBy: { createdAt: "asc" }, take: 4 } },
        orderBy: { createdAt: "desc" },
        take: 1000,
      }),
      prisma.worker.findMany({ where: { businessId: business.id } }),
    ]);

    if (all.length === 0) return DEMO;

    const avgTicket = Number(business.avgTicketPrice) || 0;
    const valueOf = (c: (typeof all)[number]) =>
      c.estimatedValue ? Number(c.estimatedValue) : avgTicket;

    const inMonth = (d: Date, start: Date, end: Date) => d >= start && d < end;
    const recoveredThisMonth = all
      .filter((c) => c.status === "booked" && c.createdAt >= monthStart)
      .reduce((s, c) => s + valueOf(c), 0);
    const recoveredLastMonth = all
      .filter((c) => c.status === "booked" && inMonth(c.createdAt, prevMonthStart, monthStart))
      .reduce((s, c) => s + valueOf(c), 0);

    const subscriptionCost = planSubscriptionCost(business.plan, business.locations.length);
    const booked = all.filter((c) => c.status === "booked").length;
    const needsFollowup = all.filter((c) => c.status === "needs_followup").length;

    // 8-week series
    const weeks: WeekPoint[] = [];
    for (let i = 7; i >= 0; i--) {
      const start = new Date(now);
      start.setDate(start.getDate() - i * 7);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      const wk = all.filter((c) => c.createdAt >= start && c.createdAt < end);
      const wkBooked = wk.filter((c) => c.status === "booked");
      weeks.push({
        label: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        leads: wk.length,
        booked: wkBooked.length,
        recovered: wkBooked.reduce((s, c) => s + valueOf(c), 0),
      });
    }

    // histograms
    const hourHistogram = new Array(24).fill(0);
    const weekdayHistogram = new Array(7).fill(0);
    for (const c of all) {
      hourHistogram[c.createdAt.getHours()]++;
      weekdayHistogram[c.createdAt.getDay()]++;
    }

    // topics from first inbound message + summary
    const topicCounts = new Map<string, number>();
    const intentCounts = new Map<string, number>();
    let replySum = 0;
    let replyN = 0;
    for (const c of all) {
      const firstIn = c.messages.find((m) => m.direction === "inbound");
      const text = `${firstIn?.body ?? ""} ${c.summary ?? ""}`;
      for (const [label, re] of TOPIC_RULES) {
        if (re.test(text)) topicCounts.set(label, (topicCounts.get(label) ?? 0) + 1);
      }
      if (c.intent) intentCounts.set(c.intent, (intentCounts.get(c.intent) ?? 0) + 1);
      // reply latency: first inbound → next outbound
      if (firstIn) {
        const reply = c.messages.find(
          (m) => m.direction === "outbound" && m.createdAt > firstIn.createdAt,
        );
        if (reply) {
          replySum += (reply.createdAt.getTime() - firstIn.createdAt.getTime()) / 1000;
          replyN++;
        }
      }
    }
    const sortDesc = (m: Map<string, number>) =>
      [...m.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);

    // per-worker
    const workerById = new Map(workers.map((w) => [w.id, w.name]));
    const wStats = new Map<string, { booked: number; recovered: number }>();
    for (const c of all) {
      if (c.status === "booked" && c.assignedWorkerId) {
        const cur = wStats.get(c.assignedWorkerId) ?? { booked: 0, recovered: 0 };
        cur.booked++;
        cur.recovered += valueOf(c);
        wStats.set(c.assignedWorkerId, cur);
      }
    }
    const workerRows: WorkerRow[] = [...wStats.entries()]
      .map(([id, s]) => ({ name: workerById.get(id) ?? "Unassigned", ...s }))
      .sort((a, b) => b.recovered - a.recovered);

    const activity: ActivityItem[] = all.slice(0, 12).map((c) => ({
      id: c.id,
      name: c.customerName || c.customerPhone,
      text:
        (c.status === "booked" ? "Booked" : c.status === "needs_followup" ? "Needs follow-up" : "New lead") +
        (c.summary ? ` — ${c.summary}` : ""),
      status: c.status,
      when: relTime(c.updatedAt),
      value: c.estimatedValue ? Number(c.estimatedValue) : null,
    }));

    return {
      recoveredThisMonth,
      recoveredLastMonth,
      subscriptionCost,
      roiMultiple: subscriptionCost > 0 ? Math.round((recoveredThisMonth / subscriptionCost) * 10) / 10 : 0,
      leads: all.length,
      booked,
      needsFollowup,
      conversionRate: all.length ? booked / all.length : 0,
      avgReplySeconds: replyN ? Math.round(replySum / replyN) : 0,
      weeks,
      hourHistogram,
      weekdayHistogram,
      topics: sortDesc(topicCounts).slice(0, 6),
      intents: sortDesc(intentCounts),
      workers: workerRows,
      activity,
      demo: false,
    };
  } catch {
    return DEMO;
  }
}
