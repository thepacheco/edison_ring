import type { Business, Worker } from "@prisma/client";

/**
 * Pick the worker a new conversation should be assigned to, based on the
 * business's routing mode. Returns null when it should route to the owner.
 *
 * - always_to_owner: no worker assignment (owner handles everything)
 * - keyword:         first worker whose keyword appears in the customer's
 *                    opening message; falls back to round_robin
 * - round_robin:     next available worker by routingOrder, rotating
 *
 * If the chosen worker is marked unavailable ("I'm out today"), we reassign to
 * their backupWorkerId, then fall back to the owner.
 */
export function pickWorker(
  business: Pick<Business, "routingMode">,
  workers: Worker[],
  firstCustomerMessage: string,
): Worker | null {
  const available = workers.filter((w) => w.isAvailable);

  let chosen: Worker | null = null;

  if (business.routingMode === "keyword") {
    const text = firstCustomerMessage.toLowerCase();
    chosen =
      workers.find((w) =>
        w.keywords.some((k) => k && text.includes(k.toLowerCase())),
      ) ?? null;
  }

  if (!chosen && business.routingMode !== "always_to_owner") {
    // round_robin (also the keyword fallback)
    const ordered = available
      .slice()
      .sort((a, b) => (a.routingOrder ?? 0) - (b.routingOrder ?? 0));
    chosen = ordered[0] ?? null;
  }

  if (!chosen) return null;

  // Honor call-out / backup mode.
  if (!chosen.isAvailable) {
    const backup = chosen.backupWorkerId
      ? (workers.find((w) => w.id === chosen!.backupWorkerId) ?? null)
      : null;
    return backup && backup.isAvailable ? backup : null;
  }

  return chosen;
}
