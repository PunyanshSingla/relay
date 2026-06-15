import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/prisma";
import { runHeuristics } from "@/lib/ai/heuristics";
import { classifyBatch, classifyEmail } from "@/lib/ai/classifier";
import { trackContact, getContactContext } from "@/lib/contact-tracker";

const BATCH_SIZE = 100;

export const classifyBatchJob = inngest.createFunction(
  {
    id: "classify-batch",
    triggers: [{ event: "email/batch-classify" }],
    retries: 2,
  },
  async ({ event, step }) => {
    const { userId } = event.data as { userId: string };

    // Step 1: Fetch unclassified emails
    const unclassified = await step.run("fetch-unclassified", async () => {
      return prisma.email.findMany({
        where: { userId, aiClassified: false },
        orderBy: { timestamp: "desc" },
        take: BATCH_SIZE,
      });
    });

    if (unclassified.length === 0) {
      return { classified: 0 };
    }

    // Step 2: Run all heuristics in one batch
    const heuristicResults = await step.run("run-heuristics", async () => {
      const results: Array<{
        emailId: string;
        from: string;
        fromName: string | null;
        subject: string;
        snippet: string | null;
        labels: string[];
        matched: boolean;
        priority: string | null;
        category: string | null;
        reason: string | null;
      }> = [];

      for (const email of unclassified) {
        const heuristic = await runHeuristics(userId, email.from, email.subject);
        results.push({
          emailId: email.id,
          from: email.from,
          fromName: email.fromName,
          subject: email.subject,
          snippet: email.snippet,
          labels: email.labels,
          matched: heuristic?.matched ?? false,
          priority: heuristic?.priority ?? null,
          category: heuristic?.category ?? null,
          reason: heuristic?.reason ?? null,
        });
      }

      return results;
    });

    // Step 3: Apply heuristic results in one DB batch
    const heuristicMatched = heuristicResults.filter((r) => r.matched);
    const needsLLM = heuristicResults.filter((r) => !r.matched);

    if (heuristicMatched.length > 0) {
      await step.run("apply-heuristics", async () => {
        for (const item of heuristicMatched) {
          await prisma.email.update({
            where: { id: item.emailId },
            data: {
              priority: item.priority!,
              category: item.category!,
              aiClassified: true,
              aiReason: item.reason!,
            },
          });
        }
      });
    }

    // Step 4: Fetch contact context + run LLM classification in one step
    let llmResults: Array<{ index: number; result: { priority: string; category: string; reason: string; suggestedAction: string } }> = [];

    if (needsLLM.length > 0) {
      llmResults = await step.run("llm-classify-with-context", async () => {
        // Fetch contact context for each email
        const emailsWithContext = await Promise.all(
          needsLLM.map(async (email, i) => {
            const ctx = await getContactContext(userId, email.from);
            return {
              index: i,
              from: email.from,
              subject: email.subject,
              snippet: email.snippet ?? undefined,
              contactContext: ctx,
            };
          }),
        );

        return classifyBatch(emailsWithContext);
      });
    }

    // Step 5: Apply all LLM results + track contacts in one step
    if (llmResults.length > 0) {
      await step.run("apply-llm-results", async () => {
        for (const classification of llmResults) {
          const emailRecord = needsLLM[classification.index];
          if (!emailRecord) continue;

          await prisma.email.update({
            where: { id: emailRecord.emailId },
            data: {
              priority: classification.result.priority,
              category: classification.result.category,
              aiClassified: true,
              aiReason: classification.result.reason,
              aiAction: classification.result.suggestedAction,
            },
          });

          // Track contact after classification
          await trackContact(userId, emailRecord.from, emailRecord.fromName, emailRecord.subject);
        }
      });
    }

    // Step 6: Fallback - classify any remaining unclassified emails individually
    const classifiedIndices = new Set(llmResults.map((r) => r.index));
    const stillUnclassified = needsLLM.filter((_, i) => !classifiedIndices.has(i));

    if (stillUnclassified.length > 0) {
      console.log(`[classify-batch] Batch missed ${stillUnclassified.length} emails, classifying individually`);

      await step.run("fallback-individual-classify", async () => {
        for (const email of stillUnclassified) {
          try {
            const ctx = await getContactContext(userId, email.from);
            const result = await classifyEmail(
              {
                from: email.from,
                subject: email.subject,
                snippet: email.snippet ?? undefined,
                labels: email.labels,
              },
              ctx,
            );

            if (result) {
              await prisma.email.update({
                where: { id: email.emailId },
                data: {
                  priority: result.priority,
                  category: result.category,
                  aiClassified: true,
                  aiReason: result.reason,
                  aiAction: result.suggestedAction,
                },
              });
              await trackContact(userId, email.from, email.fromName, email.subject);
            }
          } catch (error) {
            console.error(`[classify-batch] Individual fallback failed for ${email.emailId}:`, error);
          }
        }
      });
    }

    const totalClassified = heuristicMatched.length + llmResults.length + stillUnclassified.length;

    // Check if more unclassified emails remain and re-trigger
    const remainingCount = await step.run("check-remaining", async () => {
      return prisma.email.count({
        where: { userId, aiClassified: false },
      });
    });

    if (remainingCount > 0) {
      await step.sendEvent("re-dispatch-classify", {
        name: "email/batch-classify",
        data: { userId },
      });
    }

    return { classified: totalClassified, remaining: remainingCount };
  },
);
