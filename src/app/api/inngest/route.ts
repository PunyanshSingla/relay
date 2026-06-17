import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import { syncGmailJob } from "@/inngest/functions/sync-gmail";
import { classifyBatchJob } from "@/inngest/functions/classify-batch";
import { triggerSyncJob } from "@/inngest/functions/trigger-sync";
import { syncCalendarJob } from "@/inngest/functions/sync-calendar";
import { triggerCalendarSyncJob } from "@/inngest/functions/trigger-calendar-sync";
import { generateReplyJob } from "@/inngest/functions/generate-reply";
import { checkFollowUpsJob } from "@/inngest/functions/check-follow-ups";
import { generateDailyBriefJob } from "@/inngest/functions/generate-daily-brief";
import { detectWorkflowPatternsJob } from "@/inngest/functions/detect-workflow-patterns";
import { runAutomationsJob } from "@/inngest/functions/run-automations";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [syncGmailJob, classifyBatchJob, triggerSyncJob, syncCalendarJob, triggerCalendarSyncJob, generateReplyJob, checkFollowUpsJob, generateDailyBriefJob, detectWorkflowPatternsJob, runAutomationsJob],
});