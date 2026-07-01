import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeCron } from "@/lib/cron";
import { sendEmail, weeklyReportHtml } from "@/lib/email";

export const runtime = "nodejs";

/**
 * Weekly value report — run by a scheduler (e.g. Vercel Cron, weekly).
 * Aggregates the last 7 days per business and emails a screenshot-friendly
 * summary. Returns the computed numbers for in-dashboard reuse/observability.
 */
export async function POST(req: Request) {
  if (!authorizeCron(req)) return new NextResponse("Unauthorized", { status: 401 });
  return run();
}

export async function GET(req: Request) {
  if (!authorizeCron(req)) return new NextResponse("Unauthorized", { status: 401 });
  return run();
}

async function run() {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const businesses = await prisma.business.findMany();
  const results: unknown[] = [];

  for (const business of businesses) {
    const conversations = await prisma.conversation.findMany({
      where: { businessId: business.id, createdAt: { gte: since } },
      orderBy: { estimatedValue: "desc" },
    });

    const booked = conversations.filter((c) => c.status === "booked");
    const needsFollowup = conversations.filter((c) => c.status === "needs_followup").length;
    const estimatedValue = booked.reduce(
      (sum, c) => sum + (c.estimatedValue ? Number(c.estimatedValue) : 0),
      0,
    );
    const topJobs = booked.slice(0, 3).map((c) => ({
      name: c.customerName || c.customerPhone,
      need: c.summary || "service",
      value: c.estimatedValue ? Number(c.estimatedValue) : 0,
    }));

    const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const rangeLabel = `${fmt(since)} – ${fmt(new Date())}`;

    const data = {
      businessName: business.name,
      rangeLabel,
      leadsCaptured: conversations.length,
      jobsBooked: booked.length,
      needsFollowup,
      estimatedValue,
      topJobs,
    };

    try {
      await sendEmail({
        to: business.ownerEmail,
        subject: `Edison captured ${conversations.length} leads this week — est. $${estimatedValue.toLocaleString()}`,
        html: weeklyReportHtml(data),
      });
    } catch (err) {
      console.error(`weekly report email failed for ${business.id}:`, err);
    }

    results.push({ businessId: business.id, ...data });
  }

  return NextResponse.json({ ran: results.length, results });
}
