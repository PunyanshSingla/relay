import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/prisma";
import { corsair, ensureCorsairSetup } from "@/lib/corsair";

const CHECK_BATCH_SIZE = 50;

export const checkFollowUpsJob = inngest.createFunction(
  {
    id: "check-follow-ups",
    triggers: [{ cron: "0 */4 * * *" }],
    retries: 1,
  },
  async ({ step }) => {
    const users = await step.run("fetch-users", async () => {
      return prisma.email.findMany({
        where: {
          isSent: true,
          followUpEligibleAt: { lte: new Date() },
        },
        distinct: ["userId"],
        select: { userId: true },
      });
    });

    let totalChecked = 0;
    let totalCreated = 0;
    const errors: string[] = [];

    for (const { userId } of users) {
      try {
        const eligibleEmails = await step.run(`fetch-eligible-${userId}`, async () => {
          return prisma.email.findMany({
            where: {
              userId,
              isSent: true,
              followUpEligibleAt: { lte: new Date() },
              OR: [
                { followUpCheckedAt: null },
                { followUpCheckedAt: { lt: new Date(Date.now() - 4 * 60 * 60 * 1000) } },
              ],
            },
            orderBy: { followUpEligibleAt: "asc" },
            take: CHECK_BATCH_SIZE,
          });
        });

        if (eligibleEmails.length === 0) continue;

        await ensureCorsairSetup();
        const tenant = corsair.withTenant(userId);

        for (const email of eligibleEmails) {
          try {
            const thread = await step.run(`check-thread-${email.id}`, async () => {
              return tenant.gmail.api.threads.get({
                id: email.threadId,
                format: "metadata",
                metadataHeaders: ["From", "Date"],
              });
            });

            const messages = thread.messages ?? [];
            const sentIndex = messages.findIndex((m) => m.id === email.gmailId);

            let replyFound = false;
            if (sentIndex >= 0 && sentIndex < messages.length - 1) {
              for (let i = sentIndex + 1; i < messages.length; i++) {
                const msg = messages[i];
                const fromHeader = msg.payload?.headers?.find(
                  (h) => h.name?.toLowerCase() === "from"
                );
                const fromValue = fromHeader?.value?.toLowerCase() ?? "";
                if (!fromValue.includes(userId.toLowerCase())) {
                  replyFound = true;
                  break;
                }
              }
            }

            await step.run(`store-result-${email.id}`, async () => {
              if (replyFound) {
                await prisma.email.update({
                  where: { id: email.id },
                  data: {
                    followUpCheckedAt: new Date(),
                    followUp: {
                      upsert: {
                        create: {
                          userId,
                          gmailId: email.gmailId,
                          threadId: email.threadId,
                          subject: email.subject,
                          toEmail: email.toText.split(",")[0]?.trim() ?? "",
                          toName: null,
                          sentAt: email.timestamp,
                          status: "acted_upon",
                          replyReceivedAt: new Date(),
                        },
                        update: {
                          status: "acted_upon",
                          replyReceivedAt: new Date(),
                          lastCheckedAt: new Date(),
                        },
                      },
                    },
                  },
                });
              } else {
                const existing = await prisma.followUp.findUnique({
                  where: { emailId: email.id },
                });

                if (!existing) {
                  await prisma.followUp.create({
                    data: {
                      userId,
                      emailId: email.id,
                      gmailId: email.gmailId,
                      threadId: email.threadId,
                      subject: email.subject,
                      toEmail: email.toText.split(",")[0]?.trim() ?? "",
                      toName: null,
                      sentAt: email.timestamp,
                      status: "pending",
                    },
                  });
                  totalCreated++;
                }

                await prisma.email.update({
                  where: { id: email.id },
                  data: { followUpCheckedAt: new Date() },
                });
              }
            });

            totalChecked++;
          } catch (err) {
            console.error(`[check-follow-ups] Failed for email ${email.id}:`, err);
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[check-follow-ups] Failed for user ${userId}:`, msg);
        errors.push(`${userId}: ${msg}`);
      }
    }

    return { totalChecked, totalCreated, errors };
  },
);
