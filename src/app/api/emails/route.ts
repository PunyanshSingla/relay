import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Email, Priority, Category } from "@/types/email";

const PAGE_SIZE = 25;

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) { 
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor") || undefined;
  const filter = searchParams.get("filter") || "all";

  try {
    const where: Record<string, unknown> = { userId: session.user.id };

    if (filter === "unread") {
      where.read = false;
    } else if (filter === "P1" || filter === "P2" || filter === "P3") {
      where.priority = filter;
    }

    const query: Record<string, unknown> = {
      where,
      orderBy: [{ priority: "asc" }, { timestamp: "desc" }],
      take: PAGE_SIZE + 1,
    };

    if (cursor) {
      (query as Record<string, unknown>).cursor = { id: cursor };
      (query as Record<string, unknown>).skip = 1;
    }

    const dbEmails = await prisma.email.findMany(query as Parameters<typeof prisma.email.findMany>[0]);

    const hasMore = dbEmails.length > PAGE_SIZE;
    const items = hasMore ? dbEmails.slice(0, PAGE_SIZE) : dbEmails;

    const [total, unread, p1, p2, p3] = await Promise.all([
      prisma.email.count({ where: { userId: session.user.id } }),
      prisma.email.count({ where: { userId: session.user.id, read: false } }),
      prisma.email.count({ where: { userId: session.user.id, priority: "P1" } }),
      prisma.email.count({ where: { userId: session.user.id, priority: "P2" } }),
      prisma.email.count({ where: { userId: session.user.id, priority: "P3" } }),
    ]);

    const emails: Email[] = items.map((e) => ({
      id: e.id,
      from: { name: e.fromName || e.from, email: e.from },
      to: parseEmailAddresses(e.toText),
      cc: e.ccText ? parseEmailAddresses(e.ccText) : undefined,
      subject: e.subject,
      preview: e.snippet || "",
      body: e.body,
      bodyHtml: e.bodyHtml ?? undefined,
      timestamp: e.timestamp,
      read: e.read,
      starred: e.starred,
      priority: (e.priority as Priority) || "P3",
      category: (e.category as Category) || "fyi",
      labels: e.labels,
      hasAttachment: e.hasAttachment,
      attachments: [],
      threadId: e.threadId,
      replies: [],
    }));

    return NextResponse.json({
      emails,
      nextCursor: hasMore ? items[items.length - 1].id : null,
      counts: { total, unread, P1: p1, P2: p2, P3: p3 },
    });
  } catch (error) {
    console.error("Failed to fetch emails:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch emails";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function parseEmailAddresses(raw: string) {
  if (!raw) return [];
  return raw.split(",").map((addr) => {
    const trimmed = addr.trim();
    const match = trimmed.match(/^(.+?)\s*<(.+?)>$/);
    if (match) {
      return { name: match[1].replace(/"/g, "").trim(), email: match[2] };
    }
    return { name: trimmed, email: trimmed };
  });
}
