import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getUpcomingEvents } from "@/lib/sync/calendar";
import { corsair, ensureCorsairSetup, ensureTenant } from "@/lib/corsair";
import { logAction } from "@/lib/action-logger";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
    const timeMin = searchParams.get("timeMin") ?? undefined;
    const timeMax = searchParams.get("timeMax") ?? undefined;

    const events = await getUpcomingEvents(session.user.id, limit, timeMin, timeMax);

    return NextResponse.json({ events });
  } catch (error) {
    console.error("[calendar/events] Failed to fetch:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch events";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { summary, description, location, start, end, startDateTime, endDateTime, attendees, conferenceData, recurrence, reminders } = body;

    const rawStart = start || startDateTime;
    const rawEnd = end || endDateTime;

    if (!summary || !rawStart) {
      return NextResponse.json({ error: "summary and start are required" }, { status: 400 });
    }

    // Validate start/end times
    const startDateTimeStr = typeof rawStart === "string" ? rawStart : rawStart?.dateTime;
    const endDateTimeStr = typeof rawEnd === "string" ? rawEnd : rawEnd?.dateTime;

    if (startDateTimeStr && endDateTimeStr) {
      const startDate = new Date(startDateTimeStr);
      const endDate = new Date(endDateTimeStr);
      if (endDate <= startDate) {
        return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
      }
    }

    // Build Google Calendar event object, stripping undefined fields
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

    let eventStart: { dateTime?: string; date?: string; timeZone: string };
    if (typeof rawStart === "string") {
      eventStart = { dateTime: rawStart, timeZone: tz };
    } else {
      eventStart = { timeZone: tz };
      if (rawStart.dateTime) eventStart.dateTime = rawStart.dateTime;
      if (rawStart.date) eventStart.date = rawStart.date;
    }

    let eventEnd: { dateTime?: string; date?: string; timeZone: string } | undefined;
    if (rawEnd) {
      if (typeof rawEnd === "string") {
        eventEnd = { dateTime: rawEnd, timeZone: tz };
      } else {
        eventEnd = { timeZone: tz };
        if (rawEnd.dateTime) eventEnd.dateTime = rawEnd.dateTime;
        if (rawEnd.date) eventEnd.date = rawEnd.date;
      }
    }

    await ensureCorsairSetup();
    await ensureTenant(session.user.id);

    const tenant = corsair.withTenant(session.user.id);

    // Build event without conferenceData first (Corsair create doesn't pass conferenceDataVersion)
    const eventPayload: Record<string, unknown> = {
      summary,
      start: eventStart,
      end: eventEnd,
    };
    if (description) eventPayload.description = description;
    if (location) eventPayload.location = location;
    if (attendees?.length) {
      eventPayload.attendees = attendees.map((email: string) => ({ email }));
    }
    if (recurrence?.length) {
      eventPayload.recurrence = recurrence;
    }
    if (reminders) {
      eventPayload.reminders = reminders;
    }

    console.log("[calendar/events] Creating event:", JSON.stringify(eventPayload));

    const result = await tenant.googlecalendar.api.events.create({
      event: eventPayload as Parameters<typeof tenant.googlecalendar.api.events.create>[0]["event"],
    });

    // If conference data requested, update the event to add Meet link
    // (Corsair's create doesn't pass conferenceDataVersion as query param, but update does)
    if (conferenceData && result.id) {
      try {
        await tenant.googlecalendar.api.events.update({
          id: result.id,
          event: {
            conferenceData: conferenceData as Record<string, unknown>,
          } as Parameters<typeof tenant.googlecalendar.api.events.update>[0]["event"],
          conferenceDataVersion: 1,
        });
        // Re-fetch to get the hangoutLink
        const updated = await tenant.googlecalendar.api.events.get({ id: result.id });
        Object.assign(result, updated);
      } catch (meetErr) {
        console.error("[calendar/events] Failed to add Meet link:", meetErr);
        // Event was created successfully, just without Meet link — don't fail the whole request
      }
    }

    console.log("[calendar/events] Created event:", JSON.stringify(result));

    logAction({
      userId: session.user.id,
      actionType: "create_event",
      target: result.id ?? "",
      subject: summary,
    }).catch(() => {});

    return NextResponse.json({ event: result }, { status: 201 });
  } catch (error) {
    console.error("[calendar/events] Failed to create:", error);
    const message = error instanceof Error ? error.message : "Failed to create event";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
