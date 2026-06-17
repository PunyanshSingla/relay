import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/prisma";
import { corsair, ensureCorsairSetup } from "@/lib/corsair";
import { buildMimeMessage, encodeRfc2822 } from "@/lib/gmail-utils";

export const runAutomationsJob = inngest.createFunction(
  {
    id: "run-automations",
    triggers: [{ event: "email/run-automations" }],
    retries: 2,
  },
  async ({ event, step }) => {
    const { userId } = event.data as { userId: string };

    const newEmails = await step.run("fetch-new-emails", async () => {
      return prisma.email.findMany({
        where: {
          userId,
          aiClassified: true,
          isSent: false,
          createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          gmailId: true,
          from: true,
          subject: true,
          body: true,
          bodyHtml: true,
          category: true,
          threadId: true,
        },
      });
    });

    if (newEmails.length === 0) return { executed: 0 };

    const rules = await step.run("fetch-rules", async () => {
      return prisma.automationRule.findMany({
        where: { userId, enabled: true },
      });
    });

    if (rules.length === 0) return { executed: 0 };

    let executed = 0;

    for (const email of newEmails) {
      const matchingRules = rules.filter((rule) => matchesRule(email, rule));

      for (const rule of matchingRules) {
        try {
          await step.run(`execute-${rule.id}-${email.id}`, async () => {
            await executeAction(userId, email, rule);
          });

          await step.log(`executed-rule-${rule.id}-${email.id}`, {
            ruleId: rule.id,
            emailId: email.id,
            action: rule.actionType,
            target: rule.actionTarget,
          });

          await step.run(`log-execution-${rule.id}-${email.id}`, async () => {
            await prisma.automationExecution.create({
              data: {
                ruleId: rule.id,
                emailId: email.id,
                actionTaken: `${rule.actionType}:${rule.actionTarget}`,
                success: true,
              },
            });

            await prisma.automationRule.update({
              where: { id: rule.id },
              data: {
                executionCount: { increment: 1 },
                lastExecutedAt: new Date(),
              },
            });
          });

          executed++;
        } catch (err) {
          console.error(`[run-automations] Failed: rule=${rule.id} email=${email.id}:`, err);

          await step.run(`log-error-${rule.id}-${email.id}`, async () => {
            await prisma.automationExecution.create({
              data: {
                ruleId: rule.id,
                emailId: email.id,
                actionTaken: `${rule.actionType}:${rule.actionTarget}`,
                success: false,
                error: err instanceof Error ? err.message : "Unknown error",
              },
            });
          });
        }
      }
    }

    return { executed };
  },
);

function matchesRule(
  email: { from: string; subject: string; category: string | null },
  rule: { triggerType: string; triggerValue: string },
): boolean {
  const value = rule.triggerValue.toLowerCase();

  switch (rule.triggerType) {
    case "sender_email":
      return email.from.toLowerCase().includes(value);
    case "sender_domain": {
      const match = email.from.match(/@([^>]+)/);
      return match ? match[1].toLowerCase() === value : false;
    }
    case "subject_contains":
      return email.subject.toLowerCase().includes(value);
    case "category":
      return email.category === value;
    default:
      return false;
  }
}

async function executeAction(
  userId: string,
  email: { from: string; subject: string; body: string; bodyHtml: string | null; gmailId: string; threadId: string },
  rule: { actionType: string; actionTarget: string },
): Promise<void> {
  await ensureCorsairSetup();
  const tenant = corsair.withTenant(userId);

  if (rule.actionType === "forward_to") {
    const fromHeader = email.from.match(/<(.+?)>/)?.[1] ?? email.from;
    const rfc2822 = buildMimeMessage({
      from: "",
      to: rule.actionTarget,
      subject: `Fwd: ${email.subject}`,
      htmlBody: `<p><strong>---------- Forwarded message ----------</strong><br>From: ${email.from}<br>Subject: ${email.subject}</p>${email.bodyHtml ?? `<p>${email.body}</p>`}`,
    });
    const raw = encodeRfc2822(rfc2822);
    await tenant.gmail.api.messages.send({ raw });
  } else if (rule.actionType === "auto_reply") {
    const rfc2822 = buildMimeMessage({
      from: "",
      to: email.from,
      subject: `Re: ${email.subject}`,
      htmlBody: rule.actionTarget,
    });
    const raw = encodeRfc2822(rfc2822);
    await tenant.gmail.api.messages.send({ raw, threadId: email.threadId });
  }
}
