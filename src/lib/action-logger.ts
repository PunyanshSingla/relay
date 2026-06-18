import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export interface LogActionOptions {
  userId: string;
  actionType: string;
  target: string;
  sender?: string | null;
  subject?: string | null;
  category?: string | null;
  threadId?: string | null;
  contactId?: string | null;
  duration?: number | null;
  metadata?: Record<string, unknown> | null;
}

export async function logAction(options: LogActionOptions): Promise<void> {
  const {
    userId,
    actionType,
    target,
    sender,
    subject,
    category,
    threadId,
    contactId,
    duration,
    metadata,
  } = options;

  try {
    await prisma.userAction.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        actionType,
        target,
        sender: sender ?? undefined,
        subject: subject ?? undefined,
        category: category ?? undefined,
        threadId: threadId ?? undefined,
        contactId: contactId ?? undefined,
        duration: duration ?? undefined,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
      },
    });
  } catch (error) {
    console.error("[action-logger] Failed to log action:", error);
  }
}
