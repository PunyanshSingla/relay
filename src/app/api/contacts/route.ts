import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";

  try {
    const where: { userId: string; OR?: Array<Record<string, unknown>> } = { userId: session.user.id };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [contacts, total, vip] = await Promise.all([
      prisma.contact.findMany({
        where: where as never,
        orderBy: { lastInteraction: { sort: "desc", nulls: "last" } },
      }),
      prisma.contact.count({ where: { userId: session.user.id } }),
      prisma.contact.count({ where: { userId: session.user.id, vip: true } }),
    ]);

    const counts = {
      total,
      vip,
      frequent: contacts.filter((c: typeof contacts[number]) => c.emailCount >= 10).length,
      recent: contacts.filter((c: typeof contacts[number]) => {
        if (!c.lastInteraction) return false;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return new Date(c.lastInteraction) >= thirtyDaysAgo;
      }).length,
    };

    return NextResponse.json({ contacts, counts });
  } catch (error) {
    console.error("Failed to fetch contacts:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch contacts";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
