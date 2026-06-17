import { inngest } from "@/lib/inngest";
import { syncIncrementalEmails } from "@/lib/sync/gmail";
import { prisma } from "@/lib/prisma";
import { upsertSyncState } from "@/lib/sync-status";

export const triggerSyncJob = inngest.createFunction(
  {
    id: "trigger-sync",
    triggers: [{ event: "email/trigger-sync" }],
    retries: 2,
  },
  async ({ event, step }) => {
    const { userId } = event.data as { userId: string };

    try {
      await step.run("init-sync-status", async () => {
        const existingCount = await prisma.email.count({
          where: { userId },
        });
        await upsertSyncState(userId, {
          phase: "syncing",
          isInitialSync: true,
          syncStartedAt: new Date(),
          syncedEmails: 0,
          classifiedEmails: 0,
          totalToClassify: 0,
          totalEmails: existingCount,
          lastError: null,
        });
      });

      const result = await step.run("sync-emails", async () => {
        return syncIncrementalEmails(userId, undefined, 500);
      });

      // Mark emails that disappeared from Gmail as TRASH
      await step.run("mark-deleted", async () => {
        if (result.syncedGmailIds.length === 0) return;

        await prisma.email.updateMany({
          where: {
            userId,
            gmailId: { notIn: result.syncedGmailIds },
            isSent: false,
            NOT: { labels: { has: "TRASH" } },
          },
          data: {
            labels: { push: "TRASH" },
          },
        });
      });

      await step.run("set-classifying-phase", async () => {
        const totalUnclassified = await prisma.email.count({
          where: { userId, aiClassified: false },
        });
        const totalInDb = await prisma.email.count({
          where: { userId },
        });
        await upsertSyncState(userId, {
          phase: totalUnclassified > 0 ? "classifying" : "complete",
          syncedEmails: result.syncCount,
          classifiedEmails: 0,
          totalEmails: totalInDb,
          totalToClassify: totalUnclassified,
          syncCompletedAt: totalUnclassified === 0 ? new Date() : undefined,
          lastSyncAt: totalUnclassified === 0 ? new Date() : undefined,
        });
      });

      const shouldClassify = await step.run("check-need-classify", async () => {
        const count = await prisma.email.count({
          where: { userId, aiClassified: false },
        });
        return count > 0;
      });

      if (shouldClassify) {
        await step.sendEvent("dispatch-classify", {
          name: "email/batch-classify",
          data: { userId },
        });
      }

      return { synced: result.syncCount };
    } catch (err) {
      console.error(`[trigger-sync] Failed for user ${userId}:`, err);
      const msg = err instanceof Error ? err.message : "Sync failed";
      await upsertSyncState(userId, {
        phase: "idle",
        lastError: msg,
      }).catch(() => {});
      throw err;
    }
  },
);
