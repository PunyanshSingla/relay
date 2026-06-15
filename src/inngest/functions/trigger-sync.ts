import { inngest } from "@/lib/inngest";
import { syncIncrementalEmails } from "@/lib/sync/gmail";

export const triggerSyncJob = inngest.createFunction(
  {
    id: "trigger-sync",
    triggers: [{ event: "email/trigger-sync" }],
    retries: 2,
  },
  async ({ event, step }) => {
    const { userId } = event.data as { userId: string };

    try {
      const result = await step.run("sync-emails", async () => {
        return syncIncrementalEmails(userId, undefined, 500);
      });

      await step.sendEvent("dispatch-classify", {
        name: "email/batch-classify",
        data: { userId },
      });

      return { synced: result.syncCount };
    } catch (err) {
      console.error(`[trigger-sync] Failed for user ${userId}:`, err);
      throw err;
    }
  },
);
