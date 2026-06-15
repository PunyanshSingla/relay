import { inngest } from "@/lib/inngest";
import { syncCalendarEvents } from "@/lib/sync/calendar";

export const triggerCalendarSyncJob = inngest.createFunction(
  {
    id: "trigger-calendar-sync",
    triggers: [{ event: "calendar/trigger-sync" }],
    retries: 2,
  },
  async ({ event, step }) => {
    const { userId } = event.data as { userId: string };

    try {
      const result = await step.run("sync-calendar-events", async () => {
        return syncCalendarEvents(userId);
      });

      return { synced: result.syncCount };
    } catch (err) {
      console.error(`[trigger-calendar-sync] Failed for user ${userId}:`, err);
      throw err;
    }
  },
);
