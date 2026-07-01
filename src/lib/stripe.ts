import Stripe from "stripe";
import type { PlanId } from "./pricing";

let _stripe: Stripe | null = null;

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function stripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe is not configured: set STRIPE_SECRET_KEY.");
  }
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return _stripe;
}

/**
 * Stripe Price IDs per plan, supplied via env (created once in the Stripe
 * dashboard). Without these, checkout falls back to inline price_data.
 */
export function priceIdFor(plan: PlanId): string | undefined {
  const map: Record<PlanId, string | undefined> = {
    founding: process.env.STRIPE_PRICE_FOUNDING,
    standard: process.env.STRIPE_PRICE_STANDARD,
    high_volume: process.env.STRIPE_PRICE_HIGH_VOLUME,
  };
  return map[plan];
}

/** Metered price used to push per-conversation overage at end of cycle. */
export function overagePriceId(): string | undefined {
  return process.env.STRIPE_PRICE_OVERAGE;
}
