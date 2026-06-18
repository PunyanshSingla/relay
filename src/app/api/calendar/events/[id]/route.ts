import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { corsair, ensureCorsairSetup, ensureTenant } from "@/lib/corsair";
import { logAction } from "@/lib/action-logger";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await Promise.all([ensureCorsairSetup(), ensureTenant(session.user.id)]);
    const tenant = corsair.withTenant(session.user.id);

    const event = await tenant.googlecalendar.api.events.get({
      eventId: id,
    });

    return NextResponse.json({ event });
  } catch (error) {
    console.error("[calendar/event] Failed to fetch:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch event";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { summary, description, location, start, end, startDateTime, endDateTime, attendees, colorId } = body;

    await Promise.all([ensureCorsairSetup(), ensureTenant(session.user.id)]);
    const tenant = corsair.withTenant(session.user.id);

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const eventPayload: Record<string, unknown> = {};

    if (summary) eventPayload.summary = summary;
    if (description !== undefined) eventPayload.description = description;
    if (location !== undefined) eventPayload.location = location;
    if (colorId !== undefined) eventPayload.colorId = colorId;

    const rawStart = start || startDateTime;
    const rawEnd = end || endDateTime;

    if (rawStart) {
      if (typeof rawStart === "string") {
        eventPayload.start = { dateTime: rawStart, timeZone: tz };
      } else {
        eventPayload.start = { timeZone: tz };
        if (rawStart.dateTime) eventPayload.start.dateTime = rawStart.dateTime;
        if (rawStart.date) eventPayload.start.date = rawStart.date;
      }
    }

    if (rawEnd) {
      if (typeof rawEnd === "string") {
        eventPayload.end = { dateTime: rawEnd, timeZone: tz };
      } else {
        eventPayload.end = { timeZone: tz };
        if (rawEnd.dateTime) eventPayload.end.dateTime = rawEnd.dateTime;
        if (rawEnd.date) eventPayload.end.date = rawEnd.date;
      }
    }

    if (attendees?.length) {
      eventPayload.attendees = attendees.map((email: string) => ({ email }));
    }

    const result = await tenant.googlecalendar.api.events.update({
      eventId: id,
      event: eventPayload as Parameters<typeof tenant.googlecalendar.api.events.update>[0]["event"],
    });

    logAction({
      userId: session.user.id,
      actionType: "update_event",
      target: id,
      subject: summary,
    }).catch(() => {});

    return NextResponse.json({ event: result });
  } catch (error) {
    console.error("[calendar/event] Failed to update:", error);
    const message = error instanceof Error ? error.message : "Failed to update event";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await Promise.all([ensureCorsairSetup(), ensureTenant(session.user.id)]);
    const tenant = corsair.withTenant(session.user.id);

    await tenant.googlecalendar.api.events.delete({
      eventId: id,
    });

    logAction({
      userId: session.user.id,
      actionType: "delete_event",
      target: id,
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[calendar/event] Failed to delete:", error);
    const message = error instanceof Error ? error.message : "Failed to delete event";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
