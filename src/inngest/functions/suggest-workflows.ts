import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/prisma";

const CANDIDATE_THRESHOLD = 80;

export const suggestWorkflowsJob = inngest.createFunction(
  {
    id: "suggest-workflows",
    triggers: [{ cron: "0 */6 * * *" }],
    retries: 1,
  },
  async ({ step }) => {
    const users = await step.run("fetch-users", async () => {
      return prisma.workflowSequence.findMany({
        distinct: ["userId"],
        select: { userId: true },
      });
    });

    let totalSuggestions = 0;

    for (const { userId } of users) {
      const sequences = await step.run(`fetch-sequences-${userId}`, async () => {
        return prisma.workflowSequence.findMany({
          where: {
            userId,
            confidence: { gte: CANDIDATE_THRESHOLD },
          },
          orderBy: { confidence: "desc" },
          take: 10,
        });
      });

      for (const seq of sequences) {
        const candidate = buildCandidateFromSequence(seq);

        await step.run(`upsert-candidate-${seq.patternHash}`, async () => {
          await prisma.workflowCandidate.upsert({
            where: { userId_name: { userId, name: candidate.name } },
            create: {
              userId,
              name: candidate.name,
              description: candidate.description,
              category: candidate.category,
              confidence: seq.confidence,
              frequency: seq.count,
              consistency: candidate.consistency,
              recency: candidate.recency,
              timeSavedPerWeek: candidate.timeSavedPerWeek,
              triggerActions: candidate.triggerActions,
              suggestedActions: candidate.suggestedActions,
              status: "suggested",
            },
            update: {
              confidence: seq.confidence,
              frequency: seq.count,
            },
          });
        });
        totalSuggestions++;
      }
    }

    return { totalSuggestions };
  },
);

function buildCandidateFromSequence(seq: {
  sequence: string[];
  count: number;
  confidence: number;
}) {
  const actions = seq.sequence;
  const primaryAction = actions[actions.length - 1];
  const triggerAction = actions[0];

  const category = categorizeSequence(actions);
  const name = generateName(actions);
  const description = generateDescription(actions, seq.count);
  const timeSavedPerWeek = calculateTimeSavedPerWeek(actions, seq.count);

  return {
    name,
    description,
    category,
    consistency: 0.8,
    recency: 0.9,
    timeSavedPerWeek,
    triggerActions: { action: triggerAction },
    suggestedActions: { action: primaryAction },
  };
}

function categorizeSequence(actions: string[]): string {
  const allActions = actions.join(" ");
  if (allActions.includes("forward") || allActions.includes("archive")) return "email_triage";
  if (allActions.includes("reply") && allActions.includes("create_event")) return "scheduling";
  if (allActions.includes("reply") && allActions.includes("create_task")) return "task_management";
  if (allActions.includes("ai_reply")) return "ai_assisted";
  return "general";
}

function generateName(actions: string[]): string {
  const labels: Record<string, string> = {
    star_email: "Starring",
    archive_email: "Archiving",
    trash_email: "Deleting",
    send_email: "Sending",
    forward_email: "Forwarding",
    ai_reply: "AI Replying",
    create_event: "Event Creation",
    create_task: "Task Creation",
    dismiss_followup: "Follow-up Dismissal",
  };
  const actionName = labels[actions[actions.length - 1]] || actions[actions.length - 1];
  return `${actionName} Workflow`;
}

function generateDescription(actions: string[], count: number): string {
  return `You've performed this sequence of ${actions.length} actions ${count} times in the last 30 days.`;
}

function calculateTimeSavedPerWeek(actions: string[], count: number): number {
  const estimates: Record<string, number> = {
    star_email: 0.1,
    archive_email: 0.2,
    trash_email: 0.2,
    send_email: 5.0,
    forward_email: 2.0,
    ai_reply: 3.0,
    create_event: 3.0,
    create_task: 2.0,
  };
  const totalPerOccurrence = actions.reduce(
    (sum, action) => sum + (estimates[action] || 1),
    0,
  );
  return (totalPerOccurrence * count) / 4;
}
