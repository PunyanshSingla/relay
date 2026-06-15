import { prisma } from "./prisma";

export type SyncPhase = "idle" | "syncing" | "classifying" | "complete";

export interface SyncState {
  id: string;
  userId: string;
  phase: SyncPhase;
  isInitialSync: boolean;
  syncStartedAt: Date | null;
  syncCompletedAt: Date | null;
  totalEmails: number;
  syncedEmails: number;
  classifiedEmails: number;
  totalToClassify: number;
  lastSyncAt: Date | null;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function getSyncState(userId: string): Promise<SyncState | null> {
  return prisma.syncState.findUnique({
    where: { userId },
  }) as Promise<SyncState | null>;
}

export async function upsertSyncState(
  userId: string,
  data: Partial<Omit<SyncState, "id" | "userId" | "createdAt" | "updatedAt">>
): Promise<SyncState> {
  return prisma.syncState.upsert({
    where: { userId },
    create: {
      userId,
      ...data,
    },
    update: data,
  }) as Promise<SyncState>;
}

export async function resetSyncState(userId: string): Promise<void> {
  await prisma.syncState.upsert({
    where: { userId },
    create: {
      userId,
      phase: "idle",
      isInitialSync: false,
    },
    update: {
      phase: "idle",
      isInitialSync: false,
      syncStartedAt: null,
      syncCompletedAt: null,
      totalEmails: 0,
      syncedEmails: 0,
      classifiedEmails: 0,
      totalToClassify: 0,
      lastError: null,
    },
  });
}

export async function markSyncComplete(userId: string): Promise<void> {
  const now = new Date();
  await prisma.syncState.upsert({
    where: { userId },
    create: {
      userId,
      phase: "complete",
      syncCompletedAt: now,
      lastSyncAt: now,
    },
    update: {
      phase: "complete",
      syncCompletedAt: now,
      lastSyncAt: now,
    },
  });
}

export async function incrementSyncedCount(
  userId: string,
  count: number
): Promise<void> {
  await prisma.syncState.update({
    where: { userId },
    data: {
      syncedEmails: { increment: count },
    },
  });
}

export async function incrementClassifiedCount(
  userId: string,
  count: number
): Promise<void> {
  await prisma.syncState.update({
    where: { userId },
    data: {
      classifiedEmails: { increment: count },
    },
  });
}
