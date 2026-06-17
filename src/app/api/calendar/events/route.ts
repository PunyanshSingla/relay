import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getUpcomingEvents } from "@/lib/sync/calendar";
import { corsair, ensureCorsairSetup, ensureTenant } from "@/lib/corsair";

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
    const { summary, description, location, start, end, startDateTime, endDateTime, attendees } = body;

    const rawStart = start || startDateTime;
    const rawEnd = end || endDateTime;

    if (!summary || !rawStart) {
      return NextResponse.json({ error: "summary and start are required" }, { status: 400 });
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

    console.log("[calendar/events] Creating event:", JSON.stringify(eventPayload));

    const result = await tenant.googlecalendar.api.events.create({
      event: eventPayload as Parameters<typeof tenant.googlecalendar.api.events.create>[0]["event"],
    });

    console.log("[calendar/events] Created event:", JSON.stringify(result));

    return NextResponse.json({ event: result }, { status: 201 });
  } catch (error) {
    console.error("[calendar/events] Failed to create:", error);
    const message = error instanceof Error ? error.message : "Failed to create event";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
