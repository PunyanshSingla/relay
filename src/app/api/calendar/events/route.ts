import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getUpcomingEvents } from "@/lib/sync/calendar";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "10"), 50);

    const events = await getUpcomingEvents(session.user.id, limit);

    return NextResponse.json({ events });
  } catch (error) {
    console.error("[calendar/events] Failed to fetch:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}
