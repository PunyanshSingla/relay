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
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { summary, description, location, start, end } = body;

    if (!summary || !start) {
      return NextResponse.json({ error: "summary and start are required" }, { status: 400 });
    }

    await ensureCorsairSetup();
    await ensureTenant(session.user.id);

    const tenant = corsair.withTenant(session.user.id);

    const result = await tenant.googlecalendar.api.events.create({
      event: {
        summary,
        description,
        location,
        start,
        end,
      },
    });

    return NextResponse.json({ event: result }, { status: 201 });
  } catch (error) {
    console.error("[calendar/events] Failed to create:", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }
}
