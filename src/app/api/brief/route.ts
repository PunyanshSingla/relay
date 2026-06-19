import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { inngest } from "@/lib/inngest";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");

  let briefDate: Date;
  if (dateParam) {
    briefDate = new Date(dateParam);
    briefDate.setHours(0, 0, 0, 0);
  } else {
    briefDate = new Date();
    briefDate.setHours(0, 0, 0, 0);
  }

  let brief;
  try {
    brief = await prisma.dailyBrief.findUnique({
      where: { userId_date: { userId: session.user.id, date: briefDate } },
    });
  } catch {
    return NextResponse.json({ brief: null });
  }

  if (!brief) {
    return NextResponse.json({ brief: null });
  }

  return NextResponse.json({
    brief: {
      id: brief.id,
      date: brief.date,
      summary: brief.summary,
      emailCount: brief.emailCount,
      meetingCount: brief.meetingCount,
      followUpCount: brief.followUpCount,
      overdueCount: brief.overdueCount,
      createdAt: brief.createdAt,
    },
  });
}

export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await prisma.dailyBrief.findUnique({
    where: { userId_date: { userId: session.user.id, date: today } },
  });
  if (existing) {
    return NextResponse.json({ generating: false });
  }

  await inngest.send({
    name: "brief/generate",
    data: { userId: session.user.id },
  });

  return NextResponse.json({ generating: true });
}
