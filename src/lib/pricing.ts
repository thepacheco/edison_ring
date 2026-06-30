// Central pricing + plan definitions (from the build spec).

export type PlanId = "founding" | "standard" | "high_volume";

export interface Plan {
  id: PlanId;
  name: string;
  monthly: number; // base price, single location
  includedConversations: number;
}

export const PLANS: Record<PlanId, Plan> = {
  founding: {
    id: "founding",
    name: "Founding",
    monthly: 49,
    includedConversations: 300,
  },
  standard: {
    id: "standard",
    name: "Standard",
    monthly: 79,
    includedConversations: 300,
  },
  high_volume: {
    id: "high_volume",
    name: "High-volume",
    monthly: 99,
    includedConversations: 600,
  },
};

export const OVERAGE_RATE = 0.15; // $ per conversation past the included limit
export const HARD_CAP = 1000; // conversations/mo; beyond this, block + flag
export const TRIAL_DAYS = 14;
export const FOUNDING_WINDOW_DAYS = 90; // founding price available in first 90 days

export function planFor(planId: string): Plan {
  return PLANS[(planId as PlanId)] ?? PLANS.standard;
}

/**
 * Per-location monthly price (volume discount tiers from the spec).
 * 1: $79, 2–4: $69/ea, 5–9: $59/ea, 10+: custom (approx $59/ea here).
 */
export function perLocationPrice(locationCount: number): number {
  const n = Math.max(1, locationCount);
  if (n === 1) return 79;
  if (n <= 4) return 69;
  return 59;
}

/**
 * Total monthly subscription cost. Single-location uses the plan price;
 * multi-location uses the per-location tier × count.
 */
export function subscriptionCost(planId: string, locationCount: number): number {
  if (locationCount <= 1) return planFor(planId).monthly;
  return perLocationPrice(locationCount) * locationCount;
}

/** Approximate per-conversation COGS for margin math (Twilio + Anthropic). */
export const COGS = {
  // ~2 inbound + 2 outbound SMS segments per conversation at ~$0.0079/segment.
  twilioPerConversation: 0.032,
  // Haiku 4.5 token rates (per the model catalog): $1/MTok in, $5/MTok out.
  anthropicInputPerMTok: 1.0,
  anthropicOutputPerMTok: 5.0,
};
