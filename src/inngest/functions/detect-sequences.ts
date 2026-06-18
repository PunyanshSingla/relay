import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import {
  calculateConfidence,
  calculateConsistency,
  calculateRecency,
  estimateTimeSavedPerOccurrence,
} from "@/lib/workflow-scoring";

const SEQUENCE_WINDOW_MINUTES = 30;
const MIN_SEQUENCE_LENGTH = 2;
const MAX_SEQUENCE_LENGTH = 4;
const MIN_OCCURRENCES = 3;

export const detectSequencesJob = inngest.createFunction(
  {
    id: "detect-workflow-sequences",
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

    let totalSequences = 0;

    for (const { userId } of users) {
      const sequences = await step.run(`detect-sequences-${userId}`, async () => {
        return detectUserSequences(userId);
      });

      for (const seq of sequences) {
        await step.run(`upsert-sequence-${seq.hash}`, async () => {
          await prisma.workflowSequence.upsert({
            where: { userId_patternHash: { userId, patternHash: seq.hash } },
            create: {
              userId,
              sequence: seq.actions,
              patternHash: seq.hash,
              count: seq.count,
              confidence: seq.confidence,
              lastSeenAt: seq.lastSeenAt,
            },
            update: {
              count: seq.count,
              confidence: seq.confidence,
              lastSeenAt: seq.lastSeenAt,
            },
          });
        });
        totalSequences++;
      }
    }

    return { totalSequences };
  },
);

async function detectUserSequences(userId: string) {
  const actions = await prisma.userAction.findMany({
    where: {
      userId,
      createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
    orderBy: { createdAt: "asc" },
  });

  const sequences: Map<string, { actions: string[]; timestamps: Date[]; count: number }> = new Map();

  for (let i = 0; i < actions.length; i++) {
    for (let len = MIN_SEQUENCE_LENGTH; len <= MAX_SEQUENCE_LENGTH; len++) {
      if (i + len > actions.length) break;

      const window = actions.slice(i, i + len);
      const timeSpan = window[len - 1].createdAt.getTime() - window[0].createdAt.getTime();

      if (timeSpan <= SEQUENCE_WINDOW_MINUTES * 60 * 1000) {
        const seqActions = window.map((a) => a.actionType);
        const hash = crypto.createHash("md5").update(seqActions.join("->")).digest("hex");

        if (!sequences.has(hash)) {
          sequences.set(hash, {
            actions: seqActions,
            timestamps: [],
            count: 0,
          });
        }
        const seq = sequences.get(hash)!;
        seq.timestamps.push(window[0].createdAt);
        seq.count++;
      }
    }
  }

  const results = [];
  for (const [hash, seq] of sequences) {
    if (seq.count >= MIN_OCCURRENCES) {
      const consistency = calculateConsistency(
        [seq.count],
        actions.filter((a) => seq.actions.includes(a.actionType)).length,
      );
      const recency = calculateRecency(seq.timestamps);
      const avgTimeSaved = seq.actions.reduce(
        (sum, action) => sum + estimateTimeSavedPerOccurrence(action),
        0,
      );

      const confidence = calculateConfidence({
        frequency: seq.count,
        consistency,
        recency,
        timeSavedPerOccurrence: avgTimeSaved,
      });

      results.push({
        hash,
        actions: seq.actions,
        count: seq.count,
        confidence,
        lastSeenAt: new Date(Math.max(...seq.timestamps.map((t) => t.getTime()))),
      });
    }
  }

  return results;
}
