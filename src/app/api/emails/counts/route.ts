import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [total, unread, p1, p2, p3] = await Promise.all([
    prisma.email.count({ where: { userId } }),
    prisma.email.count({ where: { userId, read: false } }),
    prisma.email.count({ where: { userId, priority: "P1" } }),
    prisma.email.count({ where: { userId, priority: "P2" } }),
    prisma.email.count({ where: { userId, priority: "P3" } }),
  ]);

  return NextResponse.json({ total, unread, P1: p1, P2: p2, P3: p3 });
}
