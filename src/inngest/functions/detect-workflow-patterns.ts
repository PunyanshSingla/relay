import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/prisma";

const PATTERN_THRESHOLD = 5;
const SUPPRESS_DAYS = 30;

export const detectWorkflowPatternsJob = inngest.createFunction(
  {
    id: "detect-workflow-patterns",
    triggers: [{ cron: "0 */6 * * *" }],
    retries: 1,
  },
  async ({ step }) => {
    const users = await step.run("fetch-users", async () => {
      return prisma.userAction.findMany({
        distinct: ["userId"],
        select: { userId: true },
      });
    });

    let totalSuggestions = 0;
    const errors: string[] = [];

    for (const { userId } of users) {
      try {
        const patterns = await step.run(`detect-patterns-${userId}`, async () => {
          return prisma.userAction.groupBy({
            by: ["actionType", "target"],
            where: {
              userId,
              createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            },
            having: {
              id: { _count: { gte: PATTERN_THRESHOLD } },
            },
            _count: { id: true },
          });
        });

        for (const pattern of patterns) {
          const count = (pattern._count as { id: number }).id;
          if (count < PATTERN_THRESHOLD) continue;

          await step.run(`create-suggestion-${userId}-${pattern.actionType}-${pattern.target}`, async () => {
            const existing = await prisma.automationRule.findUnique({
              where: { userId_actionType_target: { userId, actionType: pattern.actionType, target: pattern.target } },
            });

            if (existing) {
              if (existing.status === "dismissed" && existing.suppressedUntil && existing.suppressedUntil > new Date()) {
                return;
              }
              await prisma.workflowPattern.update({
                where: { id: existing.id },
                data: { count, status: "suggested", suppressedUntil: null },
              });
            } else {
              const description = buildDescription(pattern.actionType, pattern.target, count);
              await prisma.automationRule.create({
                data: {
                  userId,
                  actionType: pattern.actionType,
                  target: pattern.target,
                  description,
                  count,
                  status: "suggested",
                },
              });
              totalSuggestions++;
            }
          });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[detect-patterns] Failed for ${userId}:`, msg);
        errors.push(`${userId}: ${msg}`);
      }
    }

    return { totalSuggestions, errors };
  },
);

function buildDescription(actionType: string, target: string, count: number): string {
  const actionLabels: Record<string, string> = {
    send_email: `You've sent ${count} emails to ${target}. Create an automation to auto-send?`,
    star_email: `You've starred ${count} emails from ${target}. Create an automation to auto-star?`,
    archive_email: `You've archived ${count} emails from ${target}. Create an automation to auto-archive?`,
    trash_email: `You've deleted ${count} emails from ${target}. Create an automation to auto-delete?`,
    ai_reply: `You've used AI reply ${count} times on the same thread. Create an automation?`,
    dismiss_followup: `You've dismissed ${count} follow-ups from ${target}. Suppress future follow-ups?`,
  };
  return actionLabels[actionType] ?? `Repeated action "${actionType}" on "${target}" ${count} times.`;
}
