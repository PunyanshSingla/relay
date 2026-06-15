import { inngest } from "@/lib/inngest";
import { syncCalendarEvents } from "@/lib/sync/calendar";
import { prisma } from "@/lib/prisma";

export const syncCalendarJob = inngest.createFunction(
  {
    id: "sync-calendar",
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
          return syncCalendarEvents(tenantId);
        });

        totalSynced += result.syncCount;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[sync-calendar] Failed for tenant ${tenantId}:`, msg);
        errors.push(`${tenantId}: ${msg}`);
      }
    }

    return { totalSynced, errors };
  },
);
