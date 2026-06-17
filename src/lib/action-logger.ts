import { prisma } from "@/lib/prisma";
import type { ActionType } from "@/types/automation";

export async function logAction(
  userId: string,
  actionType: ActionType,
  target: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    await prisma.userAction.create({
      data: {
        userId,
        actionType,
        target,
        metadata: metadata ?? undefined,
      },
    });
  } catch (error) {
    console.error("[action-logger] Failed to log action:", error);
  }
}
