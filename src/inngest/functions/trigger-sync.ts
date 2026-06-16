import { inngest } from "@/lib/inngest";
import { syncIncrementalEmails } from "@/lib/sync/gmail";
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
        const existingCount = await import("@/lib/prisma").then(m =>
          m.prisma.email.count({ where: { userId } })
        );
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

      await step.run("set-classifying-phase", async () => {
        const totalUnclassified = await import("@/lib/prisma").then(m =>
          m.prisma.email.count({ where: { userId, aiClassified: false } })
        );
        const totalInDb = await import("@/lib/prisma").then(m =>
          m.prisma.email.count({ where: { userId } })
        );
        await upsertSyncState(userId, {
          phase: "classifying",
          syncedEmails: result.syncCount,
          classifiedEmails: 0,
          totalEmails: totalInDb,
          totalToClassify: totalUnclassified,
        });
      });

      await step.sendEvent("dispatch-classify", {
        name: "email/batch-classify",
        data: { userId },
      });

      return { synced: result.syncCount };
    } catch (err) {
      console.error(`[trigger-sync] Failed for user ${userId}:`, err);
      await upsertSyncState(userId, {
        lastError: err instanceof Error ? err.message : "Sync failed",
      }).catch(() => {});
      throw err;
    }
  },
);
