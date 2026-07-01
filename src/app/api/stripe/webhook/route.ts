import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { stripe, stripeConfigured } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * Stripe webhook. Keeps Business subscription state in sync with Stripe:
 * subscription created/updated (trial, active, past_due, canceled), payment
 * succeeded/failed.
 */
export async function POST(req: Request) {
  if (!stripeConfigured()) {
    return new NextResponse("Stripe not configured", { status: 503 });
  }
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const body = await req.text();

  let event: Stripe.Event;
  try {
    if (secret && sig) {
      event = stripe().webhooks.constructEvent(body, sig, secret);
    } else {
      // No signing secret configured (dev) — parse without verification.
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err) {
    console.error("Stripe signature verification failed:", err);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await syncSubscription(sub);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const affected = await prisma.business.findMany({
          where: { stripeSubId: sub.id },
          include: { locations: true },
        });
        await prisma.business.updateMany({
          where: { stripeSubId: sub.id },
          data: {
            subscriptionStatus: "canceled",
            canceledAt: new Date(),
            cancelReason:
              (sub.cancellation_details?.reason as string | undefined) ?? null,
          },
        });
        // Release the provisioned Twilio number(s) so we stop paying for them.
        const { releaseNumber } = await import("@/lib/twilio");
        for (const b of affected) {
          const numbers = [b.twilioNumber, ...b.locations.map((l) => l.twilioNumber)];
          for (const num of numbers) {
            if (num && !num.startsWith("pending-")) {
              try {
                await releaseNumber(num);
              } catch (err) {
                console.error("Failed to release number on cancel:", num, err);
              }
            }
          }
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        if (customerId) {
          await prisma.business.updateMany({
            where: { stripeCustomerId: customerId },
            data: { subscriptionStatus: "past_due" },
          });
        }
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        if (customerId) {
          await prisma.business.updateMany({
            where: { stripeCustomerId: customerId },
            data: { subscriptionStatus: "active" },
          });
        }
        break;
      }
    }
  } catch (err) {
    console.error("Stripe webhook handler error:", err);
    return new NextResponse("handler error", { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function syncSubscription(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000) : null;
  await prisma.business.updateMany({
    where: { stripeCustomerId: customerId },
    data: {
      stripeSubId: sub.id,
      subscriptionStatus: sub.status, // trialing | active | past_due | canceled | ...
      trialEndsAt: trialEnd,
    },
  });
}
