import { inngest } from "@/lib/inngest";
import { syncIncrementalEmails } from "@/lib/sync/gmail";
import { prisma } from "@/lib/prisma";
import { upsertSyncState } from "@/lib/sync-status";

export const syncGmailJob = inngest.createFunction(
  {
    id: "sync-gmail",
    triggers: [{ cron: "*/5 * * * *" }],
    retries: 3,
    timeout: "3m",
  },
  async ({ step }) => {
    const users = await step.run("fetch-users", async () => {
      return prisma.corsairAccount.findMany({
        select: { tenantId: true },
        distinct: ["tenantId"],
      });
    });

    let totalSynced = 0;
    const errors: string[] = [];

    for (const user of users) {
      const tenantId = user.tenantId;
      if (!tenantId) continue;

      try {
        const canSync = await step.run(`check-active-${tenantId}`, async () => {
          const state = await prisma.syncState.findUnique({
            where: { userId: tenantId },
          });
          return (
            !state ||
            (state.phase !== "syncing" && state.phase !== "classifying")
          );
        });

        if (!canSync) continue;

        const existingCount = await step.run(
          `count-emails-${tenantId}`,
          async () => {
            return prisma.email.count({ where: { userId: tenantId } });
          },
        );

        await step.run(`init-sync-${tenantId}`, async () => {
          await upsertSyncState(tenantId, {
            phase: "syncing",
            isInitialSync: false,
            syncStartedAt: new Date(),
            totalEmails: existingCount,
            syncedEmails: 0,
            classifiedEmails: 0,
            totalToClassify: 0,
            lastError: null,
          });
        });

        const result = await step.run(`sync-${tenantId}`, async () => {
          const latest = await prisma.email.findFirst({
            where: { userId: tenantId },
            orderBy: { timestamp: "desc" },
            select: { timestamp: true },
          });

          return syncIncrementalEmails(
            tenantId,
            latest?.timestamp ?? undefined,
            200,
          );
        });

        totalSynced += result.syncCount;

        await step.run(`set-classifying-${tenantId}`, async () => {
          const totalUnclassified = await prisma.email.count({
            where: { userId: tenantId, aiClassified: false },
          });
          const totalInDb = await prisma.email.count({
            where: { userId: tenantId },
          });
          await upsertSyncState(tenantId, {
            phase: totalUnclassified > 0 ? "classifying" : "complete",
            syncedEmails: result.syncCount,
            totalEmails: totalInDb,
            totalToClassify: totalUnclassified,
            classifiedEmails: 0,
            syncCompletedAt: totalUnclassified === 0 ? new Date() : undefined,
            lastSyncAt: totalUnclassified === 0 ? new Date() : undefined,
          });
        });

        const shouldClassify = await step.run(
          `check-need-classify-${tenantId}`,
          async () => {
            const count = await prisma.email.count({
              where: { userId: tenantId, aiClassified: false },
            });
            return count > 0;
          },
        );

        if (shouldClassify) {
          await step.sendEvent(`dispatch-classify-${tenantId}`, {
            name: "email/batch-classify",
            data: { userId: tenantId },
          });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[sync-gmail] Failed for tenant ${tenantId}:`, msg);
        errors.push(`${tenantId}: ${msg}`);

        await upsertSyncState(tenantId, {
          phase: "idle",
          lastError: msg,
        }).catch(() => {});
      }
    }

    return { totalSynced, errors };
  },
);
