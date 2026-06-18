import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateMeetingPrep, type MeetingPrepInput } from "@/lib/ai/meeting-prep";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [{ id }, body] = await Promise.all([params, request.json().catch(() => null)]);

  if (!body?.summary) {
    return NextResponse.json({ error: "summary is required" }, { status: 400 });
  }

  const attendees: Array<{ email: string; name?: string }> = body.attendees ?? [];
  const attendeeEmails = attendees.map((a) => a.email.toLowerCase());

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [emails, followUps] = await Promise.all([
      attendeeEmails.length > 0
        ? prisma.email.findMany({
            where: {
              userId: session.user.id,
              timestamp: { gte: thirtyDaysAgo },
              OR: [
                { from: { in: attendeeEmails } },
                { toText: { contains: attendeeEmails[0] } },
              ],
            },
            orderBy: { timestamp: "desc" },
            take: 15,
            select: {
              from: true,
              fromName: true,
              subject: true,
              snippet: true,
              timestamp: true,
            },
          })
        : [],
      attendeeEmails.length > 0
        ? prisma.followUp.findMany({
            where: {
              userId: session.user.id,
              status: "pending",
              toEmail: { in: attendeeEmails },
            },
            orderBy: { sentAt: "desc" },
            take: 10,
            select: {
              subject: true,
              toEmail: true,
              sentAt: true,
            },
          })
        : [],
    ]);

    const input: MeetingPrepInput = {
      summary: body.summary,
      description: body.description,
      attendees,
      recentEmails: emails.map((e) => ({
        from: e.fromName || e.from,
        subject: e.subject,
        snippet: e.snippet || "",
        timestamp: e.timestamp.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }),
      })),
      pendingFollowUps: followUps.map((f) => ({
        subject: f.subject,
        toEmail: f.toEmail,
        sentAt: formatDaysAgo(f.sentAt),
      })),
    };

    const prep = await generateMeetingPrep(input);

    if (!prep) {
      return NextResponse.json({ error: "Failed to generate meeting prep" }, { status: 500 });
    }

    return NextResponse.json({ prep });
  } catch (error) {
    console.error("[meeting-prep] Failed:", error);
    const message = error instanceof Error ? error.message : "Failed to generate meeting prep";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function formatDaysAgo(date: Date): string {
  const days = Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000));
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}
