import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/prisma";
import { getUpcomingEvents } from "@/lib/sync/calendar";
import { generateBrief, type BriefInput } from "@/lib/ai/brief-generator";

export const generateUserBriefJob = inngest.createFunction(
  {
    id: "generate-user-brief",
    retries: 1,
  },
  { event: "brief/generate" },
  async ({ event: { data }, step }) => {
    const { userId } = data;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const briefInput = await step.run("collect-data", async () => {
      const [importantEmails, meetings, pendingFollowUps, overdueFollowUps] = await Promise.all([
        prisma.email.findMany({
          where: {
            userId,
            timestamp: { gte: yesterday },
            priority: { in: ["P1", "P2"] },
          },
          orderBy: { priority: "asc" },
          take: 20,
          select: {
            from: true,
            fromName: true,
            subject: true,
            snippet: true,
            priority: true,
            timestamp: true,
          },
        }),
        getUpcomingEvents(userId, 20, today.toISOString(), tomorrow.toISOString()).catch(() => []),
        prisma.followUp.findMany({
          where: { userId, status: "pending" },
          orderBy: { sentAt: "asc" },
          take: 20,
          select: {
            subject: true,
            toEmail: true,
            sentAt: true,
          },
        }),
        prisma.followUp.findMany({
          where: {
            userId,
            status: "pending",
            sentAt: { lt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
          },
          orderBy: { sentAt: "asc" },
          take: 10,
          select: {
            subject: true,
            toEmail: true,
            sentAt: true,
          },
        }),
      ]);

      const input: BriefInput = {
        emails: importantEmails.map((e) => ({
          from: e.fromName || e.from,
          subject: e.subject,
          preview: e.snippet || "",
          priority: e.priority || "P3",
          timestamp: e.timestamp.toLocaleString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
        })),
        meetings: meetings.map((m: Record<string, unknown>) => {
          const start = m.start as { dateTime?: string } | undefined;
          return {
            summary: (m.summary as string) || "Untitled meeting",
            startTime: start?.dateTime
              ? new Date(start.dateTime).toLocaleString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
              : "All day",
            attendees: Array.isArray(m.attendees)
              ? (m.attendees as Array<{ email: string }>).map((a) => a.email).join(", ")
              : undefined,
          };
        }),
        pendingFollowUps: pendingFollowUps.map((f) => ({
          subject: f.subject,
          toEmail: f.toEmail,
          sentAt: formatDaysAgo(f.sentAt),
        })),
        overdueFollowUps: overdueFollowUps.map((f) => ({
          subject: f.subject,
          toEmail: f.toEmail,
          sentAt: formatDaysAgo(f.sentAt),
          daysSince: Math.floor((Date.now() - f.sentAt.getTime()) / (24 * 60 * 60 * 1000)),
        })),
      };

      return { input, emailCount: importantEmails.length, meetingCount: meetings.length, followUpCount: pendingFollowUps.length, overdueCount: overdueFollowUps.length };
    });

    const summary = await step.run("generate-brief", async () => {
      return generateBrief(briefInput.input);
    });

    if (!summary) {
      return { success: false, reason: "LLM generation failed" };
    }

    await step.run("store-brief", async () => {
      await prisma.dailyBrief.upsert({
        where: { userId_date: { userId, date: today } },
        create: {
          userId,
          date: today,
          summary,
          emailCount: briefInput.emailCount,
          meetingCount: briefInput.meetingCount,
          followUpCount: briefInput.followUpCount,
          overdueCount: briefInput.overdueCount,
          rawInput: briefInput.input as unknown as Record<string, string>,
        },
        update: {
          summary,
          emailCount: briefInput.emailCount,
          meetingCount: briefInput.meetingCount,
          followUpCount: briefInput.followUpCount,
          overdueCount: briefInput.overdueCount,
          rawInput: briefInput.input as unknown as Record<string, string>,
        },
      });
    });

    return { success: true };
  },
);

function formatDaysAgo(date: Date): string {
  const days = Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000));
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}
