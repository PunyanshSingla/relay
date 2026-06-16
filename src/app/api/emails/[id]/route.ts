import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Email, Priority, Category } from "@/types/email";

const DB_FIELDS = {
  id: true,
  gmailId: true,
  userId: true,
  threadId: true,
  from: true,
  fromName: true,
  toText: true,
  ccText: true,
  subject: true,
  body: true,
  bodyHtml: true,
  snippet: true,
  timestamp: true,
  read: true,
  starred: true,
  hasAttachment: true,
  labels: true,
  priority: true,
  category: true,
  aiClassified: true,
  aiReason: true,
  aiAction: true,
} as const;

function parseAddresses(raw: string): Array<{ name: string; email: string }> {
  if (!raw) return [];
  return raw.split(",").map((addr) => {
    const trimmed = addr.trim();
    const match = trimmed.match(/^(.+?)\s*<(.+?)>$/);
    if (match) return { name: match[1].replace(/"/g, "").trim(), email: match[2] };
    return { name: trimmed, email: trimmed };
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const dbEmail = await prisma.email.findUnique({
      where: { id },
      select: DB_FIELDS,
    });

    if (!dbEmail) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    const email: Email = {
      id: dbEmail.id,
      from: { name: dbEmail.fromName || dbEmail.from, email: dbEmail.from },
      to: parseAddresses(dbEmail.toText),
      cc: dbEmail.ccText ? parseAddresses(dbEmail.ccText) : undefined,
      subject: dbEmail.subject,
      preview: dbEmail.snippet || "",
      body: dbEmail.body,
      bodyHtml: dbEmail.bodyHtml ?? undefined,
      timestamp: dbEmail.timestamp,
      read: dbEmail.read,
      starred: dbEmail.starred,
      priority: (dbEmail.priority as Priority) || "P3",
      category: (dbEmail.category as Category) || "fyi",
      labels: dbEmail.labels,
      hasAttachment: dbEmail.hasAttachment,
      attachments: [],
      threadId: dbEmail.threadId,
      replies: [],
      isClassified: dbEmail.aiClassified,
    };

    return NextResponse.json({ email });
  } catch (error) {
    console.error("Failed to fetch email:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
