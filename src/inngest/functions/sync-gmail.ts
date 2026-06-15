import { inngest } from "@/lib/inngest";
import { syncIncrementalEmails } from "@/lib/sync/gmail";
import { prisma } from "@/lib/prisma";

export const syncGmailJob = inngest.createFunction(
  {
    id: "sync-gmail",
    triggers: [{ cron: "*/5 * * * *" }],
    retries: 1,
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

        await step.sendEvent(`dispatch-classify-${tenantId}`, {
          name: "email/batch-classify",
          data: { userId: tenantId },
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[sync-gmail] Failed for tenant ${tenantId}:`, msg);
        errors.push(`${tenantId}: ${msg}`);
      }
    }

    return { totalSynced, errors };
  },
);
