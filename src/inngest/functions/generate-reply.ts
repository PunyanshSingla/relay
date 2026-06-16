import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/prisma";
import { generateReply } from "@/lib/ai/reply-generator";
import { checkNeedsReply } from "@/lib/ai/reply-heuristics";
import type { ReplyEmailInput, ReplyMode } from "@/lib/ai/reply-generator.types";

const VALID_MODES: ReplyMode[] = ["short", "professional", "friendly", "generate"];

export const generateReplyJob = inngest.createFunction(
  {
    id: "generate-reply",
    triggers: [{ event: "email/generate-reply" }],
    retries: 2,
  },
  async ({ event, step }) => {
    const { userId, emailId, mode: rawMode } = event.data as {
      userId: string;
      emailId: string;
      mode?: string;
    };

    const mode: ReplyMode = VALID_MODES.includes(rawMode as ReplyMode)
      ? (rawMode as ReplyMode)
      : "professional";

    // Step 1: Check cache
    const cached = await step.run("check-cache", async () => {
      const email = await prisma.email.findUnique({
        where: { id: emailId },
        select: {
          replyGenerated: true,
          generatedReply: true,
          needsReply: true,
          replyMode: true,
          from: true,
          subject: true,
        },
      });

      if (email?.replyGenerated && email.generatedReply && email.replyMode === mode) {
        return { cached: true, needsReply: email.needsReply, reply: email.generatedReply, reason: "Cached" };
      }

      return { cached: false };
    });

    if (cached.cached) {
      return { needsReply: cached.needsReply, reply: cached.reply, reason: cached.reason };
    }

    // Step 2: Fetch email for heuristic + LLM checks
    const emailData = await step.run("fetch-email", async () => {
      return prisma.email.findUnique({
        where: { id: emailId },
        select: {
          id: true,
          userId: true,
          from: true,
          fromName: true,
          subject: true,
          body: true,
          labels: true,
          category: true,
        },
      });
    });

    if (!emailData) {
      return { needsReply: false, reply: null, reason: "Email not found" };
    }

    // Step 3: Run heuristics
    const heuristicResult = await step.run("check-heuristics", async () => {
      return checkNeedsReply(
        userId,
        emailData.from,
        emailData.subject,
        emailData.labels,
        emailData.category,
      );
    });

    if (!heuristicResult.needsReply) {
      await step.run("store-no-reply", async () => {
        await prisma.email.update({
          where: { id: emailId },
          data: {
            replyGenerated: true,
            needsReply: false,
            generatedReply: null,
            replyMode: mode,
          },
        });
      });

      return { needsReply: false, reply: null, reason: heuristicResult.reason };
    }

    // Step 4: Generate reply with LLM
    const llmResult = await step.run("llm-generate-reply", async () => {
      const emailInput: ReplyEmailInput = {
        from: emailData.from,
        subject: emailData.subject,
        body: emailData.body,
        threadReplies: [],
        category: emailData.category ?? undefined,
      };

      return generateReply(emailInput, mode);
    });

    // Step 5: Store result
    await step.run("store-reply", async () => {
      await prisma.email.update({
        where: { id: emailId },
        data: {
          replyGenerated: true,
          needsReply: llmResult?.needsReply ?? false,
          generatedReply: llmResult?.reply ?? null,
          replyMode: mode,
        },
      });
    });

    return {
      needsReply: llmResult?.needsReply ?? false,
      reply: llmResult?.reply ?? null,
      reason: llmResult?.reason ?? "Generation failed",
    };
  },
);
