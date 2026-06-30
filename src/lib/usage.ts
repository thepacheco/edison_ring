import { prisma } from "./prisma";

/** Current billing month key, e.g. "2026-06". */
export function currentMonth(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Increment a business's conversation count for the current month, tracking
 * overage past its plan limit. Called once per new conversation.
 */
export async function recordNewConversation(
  businessId: string,
  conversationLimit: number,
): Promise<void> {
  const month = currentMonth();
  const record = await prisma.usageRecord.upsert({
    where: { businessId_month: { businessId, month } },
    create: { businessId, month, conversationCount: 1, overageCount: 0 },
    update: { conversationCount: { increment: 1 } },
  });

  if (record.conversationCount > conversationLimit) {
    await prisma.usageRecord.update({
      where: { businessId_month: { businessId, month } },
      data: { overageCount: { increment: 1 } },
    });
  }
}
