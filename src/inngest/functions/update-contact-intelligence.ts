import { inngest } from "@/lib/inngest";
import { prisma } from "@/lib/prisma";
import { corsair, ensureCorsairSetup } from "@/lib/corsair";

interface CalendarEvent {
  id?: string;
  start?: { dateTime?: string; date?: string };
  attendees?: Array<{ email?: string }>;
}

export const updateContactIntelligenceJob = inngest.createFunction(
  {
    id: "update-contact-intelligence",
    triggers: [{ cron: "0 */12 * * *" }],
    retries: 1,
  },
  async ({ step }) => {
    const users = await step.run("fetch-users", async () => {
      return prisma.contact.findMany({
        distinct: ["userId"],
        select: { userId: true },
      });
    });

    let updated = 0;

    for (const { userId } of users) {
      const contacts = await step.run(`fetch-contacts-${userId}`, async () => {
        return prisma.contact.findMany({
          where: { userId },
          select: { id: true, email: true },
        });
      });

      // Fetch calendar events for this user (last 6 months)
      let calendarEvents: CalendarEvent[] = [];
      try {
        await step.run(`fetch-calendar-${userId}`, async () => {
          await ensureCorsairSetup();
          const tenant = corsair.withTenant(userId);
          const now = new Date();
          const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

          const events = await tenant.googlecalendar.api.events.getMany({
            timeMin: sixMonthsAgo.toISOString(),
            timeMax: now.toISOString(),
            maxResults: 250,
            singleEvents: true,
            orderBy: "startTime",
          });

          calendarEvents = events as CalendarEvent[];
        });
      } catch (err) {
        console.error(`[contact-intel] Calendar fetch failed for ${userId}:`, err);
      }

      for (const contact of contacts) {
        const contactEmail = contact.email.toLowerCase();

        // Compute response pattern from emails
        const responsePattern = await step.run(`response-pattern-${contact.id}`, async () => {
          return computeResponsePattern(userId, contactEmail);
        });

        // Compute meeting count and preferred times from calendar
        const { meetingCount, preferredTimes } = computeMeetingData(calendarEvents, contactEmail);

        await step.run(`update-contact-${contact.id}`, async () => {
          await prisma.contact.update({
            where: { id: contact.id },
            data: {
              responsePattern: responsePattern ?? undefined,
              meetingCount,
              preferredMeetingTimes: preferredTimes,
            },
          });
        });

        updated++;
      }
    }

    return { updated };
  },
);

async function computeResponsePattern(
  userId: string,
  contactEmail: string
): Promise<string | null> {
  const emails = await prisma.email.findMany({
    where: {
      userId,
      OR: [
        { from: { contains: contactEmail, mode: "insensitive" } },
        { toText: { contains: contactEmail, mode: "insensitive" } },
      ],
    },
    orderBy: { timestamp: "asc" },
    select: { timestamp: true, isSent: true, from: true, toText: true },
  });

  if (emails.length < 4) return null;

  const received = emails.filter((e) => !e.isSent);
  const sent = emails.filter((e) => e.isSent);

  // Compute average response time
  const responseTimes: number[] = [];
  for (const recv of received) {
    const reply = sent.find((s) => s.timestamp.getTime() > recv.timestamp.getTime());
    if (reply) {
      const diff = reply.timestamp.getTime() - recv.timestamp.getTime();
      if (diff < 7 * 24 * 60 * 60 * 1000) {
        responseTimes.push(diff);
      }
    }
  }

  if (responseTimes.length === 0) return null;

  const avgMs = responseTimes.reduce((s, t) => s + t, 0) / responseTimes.length;
  const hours = Math.floor(avgMs / (1000 * 60 * 60));

  if (hours < 1) return "Replies within minutes";
  if (hours < 4) return `Replies within ${hours} hours`;
  if (hours < 24) return `Replies within ${hours} hours (business hours)`;
  return `Replies within ${Math.floor(hours / 24)} day(s)`;
}

function computeMeetingData(
  events: CalendarEvent[],
  contactEmail: string
): { meetingCount: number; preferredTimes: string[] } {
  const matchingEvents = events.filter((e) =>
    e.attendees?.some((a) => a.email?.toLowerCase() === contactEmail)
  );

  if (matchingEvents.length === 0) {
    return { meetingCount: 0, preferredTimes: [] };
  }

  // Extract hour-of-day distribution
  const hourCounts: Record<number, number> = {};
  for (const event of matchingEvents) {
    const startStr = event.start?.dateTime;
    if (startStr) {
      const hour = new Date(startStr).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }
  }

  // Find top 2 time slots
  const sorted = Object.entries(hourCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2);

  const preferredTimes = sorted.map(([hour]) => {
    const h = parseInt(hour);
    if (h === 0) return "12 AM";
    if (h < 12) return `${h} AM`;
    if (h === 12) return "12 PM";
    return `${h - 12} PM`;
  });

  return { meetingCount: matchingEvents.length, preferredTimes };
}
