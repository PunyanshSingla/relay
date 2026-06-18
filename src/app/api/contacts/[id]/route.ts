import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { corsair, ensureCorsairSetup, ensureTenant } from "@/lib/corsair";

interface EmailRow {
  id: string;
  gmailId: string;
  from: string;
  fromName: string | null;
  toText: string;
  subject: string;
  snippet: string | null;
  timestamp: Date;
  read: boolean;
  starred: boolean;
  priority: string | null;
  category: string | null;
  isSent: boolean;
  labels: string[];
}

interface CalendarEvent {
  id?: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  attendees?: Array<{ email?: string; displayName?: string; responseStatus?: string }>;
  status?: string;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const contact = await prisma.contact.findUnique({
      where: { id },
    });

    if (!contact || contact.userId !== session.user.id) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const contactEmail = contact.email.toLowerCase();

    // Fetch all emails with this contact (sent + received)
    const allEmails = await prisma.email.findMany({
      where: {
        userId: session.user.id,
        OR: [
          { from: { contains: contactEmail, mode: "insensitive" } },
          { toText: { contains: contactEmail, mode: "insensitive" } },
        ],
      },
      orderBy: { timestamp: "desc" },
      select: {
        id: true,
        gmailId: true,
        from: true,
        fromName: true,
        toText: true,
        subject: true,
        snippet: true,
        timestamp: true,
        read: true,
        starred: true,
        priority: true,
        category: true,
        isSent: true,
        labels: true,
      },
    });

    // Split sent vs received
    const emailsSent = allEmails.filter((e) => e.isSent);
    const emailsReceived = allEmails.filter((e) => !e.isSent);

    // Compute average response time from email pairs
    const avgResponseTime = computeAvgResponseTime(emailsSent, emailsReceived, contactEmail);

    // Fetch calendar events with this contact as attendee
    let meetings: CalendarEvent[] = [];
    try {
      await Promise.all([ensureCorsairSetup(), ensureTenant(session.user.id)]);
      const tenant = corsair.withTenant(session.user.id);

      const now = new Date();
      const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

      const events = await tenant.googlecalendar.api.events.getMany({
        timeMin: sixMonthsAgo.toISOString(),
        timeMax: now.toISOString(),
        maxResults: 250,
        singleEvents: true,
        orderBy: "startTime",
      });

      meetings = (events as CalendarEvent[]).filter((event) => {
        if (!event.attendees) return false;
        return event.attendees.some(
          (a) => a.email?.toLowerCase() === contactEmail
        );
      });
    } catch (err) {
      console.error(`[contact/${id}] Failed to fetch calendar events:`, err);
    }

    // Build activity timeline (interleave emails + meetings, last 20)
    const timeline: Array<{
      type: "email" | "meeting";
      date: Date;
      title: string;
      detail: string;
      sent?: boolean;
    }> = [];

    for (const email of allEmails.slice(0, 30)) {
      timeline.push({
        type: "email",
        date: email.timestamp,
        title: email.subject,
        detail: email.snippet || "",
        sent: email.isSent,
      });
    }

    for (const meeting of meetings.slice(0, 20)) {
      const start = meeting.start?.dateTime || meeting.start?.date;
      if (start) {
        timeline.push({
          type: "meeting",
          date: new Date(start),
          title: meeting.summary || "(No title)",
          detail: meeting.location || "",
        });
      }
    }

    timeline.sort((a, b) => b.date.getTime() - a.date.getTime());
    const trimmedTimeline = timeline.slice(0, 20);

    // Compute active days
    const uniqueDays = new Set(
      allEmails.map((e) => new Date(e.timestamp).toDateString())
    );

    // Recent emails for the emails tab (last 20)
    const recentEmails = allEmails.slice(0, 20);

    return NextResponse.json({
      contact,
      stats: {
        emailsExchanged: allEmails.length,
        emailsSent: emailsSent.length,
        emailsReceived: emailsReceived.length,
        meetings: meetings.length,
        avgResponseTime,
        lastEmailSubject: allEmails[0]?.subject || null,
        firstInteraction: allEmails.length > 0 ? allEmails[allEmails.length - 1].timestamp : contact.createdAt,
        activeDays: uniqueDays.size,
      },
      recentEmails,
      meetings: meetings.map((m) => ({
        id: m.id,
        summary: m.summary,
        location: m.location,
        start: m.start,
        end: m.end,
        attendees: m.attendees,
        status: m.status,
      })),
      activityTimeline: trimmedTimeline.map((t) => ({
        ...t,
        date: t.date.toISOString(),
      })),
    });
  } catch (error) {
    console.error("[contact detail] Failed:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch contact";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);

  try {
    const contact = await prisma.contact.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!contact || contact.userId !== session.user.id) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (body?.vip !== undefined) updateData.vip = body.vip;
    if (body?.name !== undefined) updateData.name = body.name;

    await prisma.contact.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[contact detail] PATCH failed:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

function computeAvgResponseTime(
  sent: EmailRow[],
  received: EmailRow[],
  contactEmail: string
): string | null {
  // For each received email, find the next sent email (as a reply)
  // and compute the time difference
  const responseTimes: number[] = [];

  const sortedReceived = received.toSorted(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );
  const sortedSent = sent.toSorted(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );

  let sentIdx = 0;
  for (const recv of sortedReceived) {
    while (sentIdx < sortedSent.length && sortedSent[sentIdx].timestamp.getTime() <= recv.timestamp.getTime()) {
      sentIdx++;
    }
    const reply = sentIdx < sortedSent.length ? sortedSent[sentIdx] : undefined;
    if (reply) {
      const diffMs = reply.timestamp.getTime() - recv.timestamp.getTime();
      // Only count if within 7 days (reasonable response window)
      if (diffMs < 7 * 24 * 60 * 60 * 1000) {
        responseTimes.push(diffMs);
      }
    }
  }

  if (responseTimes.length === 0) return null;

  const avgMs =
    responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length;

  const hours = Math.floor(avgMs / (1000 * 60 * 60));
  const minutes = Math.floor((avgMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
