import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeCron } from "@/lib/cron";
import { stripe, stripeConfigured, overagePriceId } from "@/lib/stripe";
import { currentMonth } from "@/lib/usage";
import { HARD_CAP } from "@/lib/pricing";

export const runtime = "nodejs";

/**
 * End-of-cycle overage billing. For each business over its included limit this
 * month, push the overage count to Stripe metered billing. Past the hard cap
 * (1,000/mo) we block auto-billing and flag the account for manual review.
 *
 * Intended to run on a monthly schedule (or daily, idempotent enough for a demo).
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
  const month = currentMonth();
  const records = await prisma.usageRecord.findMany({ where: { month } });
  const out: unknown[] = [];

  for (const rec of records) {
    const business = await prisma.business.findUnique({ where: { id: rec.businessId } });
    if (!business) continue;

    const overage = Math.max(0, rec.conversationCount - business.conversationLimit);

    // Hard cap → block + flag for manual review.
    if (rec.conversationCount >= HARD_CAP) {
      await prisma.business.update({
        where: { id: business.id },
        data: { flaggedForReview: true },
      });
      out.push({ businessId: business.id, action: "flagged_hard_cap", count: rec.conversationCount });
      continue;
    }

    if (overage <= 0) continue;

    // Keep the overageCount in sync with the computed overage.
    if (rec.overageCount !== overage) {
      await prisma.usageRecord.update({
        where: { businessId_month: { businessId: business.id, month } },
        data: { overageCount: overage },
      });
    }

    const priceId = overagePriceId();
    if (stripeConfigured() && priceId && business.stripeSubId) {
      try {
        // Find the metered subscription item for the overage price.
        const sub = await stripe().subscriptions.retrieve(business.stripeSubId);
        const item = sub.items.data.find((i) => i.price.id === priceId);
        if (item) {
          // Report usage for the metered item (Stripe usage records API).
          await stripe().subscriptionItems.createUsageRecord(item.id, {
            quantity: overage,
            timestamp: Math.floor(Date.now() / 1000),
            action: "set",
          });
          out.push({ businessId: business.id, action: "usage_reported", overage });
          continue;
        }
      } catch (err) {
        console.error(`overage push failed for ${business.id}:`, err);
      }
    }

    out.push({ businessId: business.id, action: "overage_recorded_no_stripe", overage });
  }

  return NextResponse.json({ processed: out.length, results: out });
}
