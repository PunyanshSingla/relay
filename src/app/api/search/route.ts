import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateEmbedding } from "@/lib/ai/embeddings";
import type { Email, Priority, Category } from "@/types/email";

function parseAddresses(raw: string): Array<{ name: string; email: string }> {
  if (!raw) return [];
  return raw.split(",").map((addr) => {
    const trimmed = addr.trim();
    const match = trimmed.match(/^(.+?)\s*<(.+?)>$/);
    if (match) return { name: match[1].replace(/"/g, "").trim(), email: match[2] };
    return { name: trimmed, email: trimmed };
  });
}

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  if (!query?.trim()) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  try {
    // Vector search
    let vectorEmails: (Email & { similarity: number })[] = [];
    try {
      const embedding = await generateEmbedding(query.trim());
      if (embedding) {
        const vectorStr = `[${embedding.join(",")}]`;
        const results = await prisma.$queryRawUnsafe<Array<{
          id: string; gmail_id: string; "from": string; "fromName": string | null;
          subject: string; body: string; snippet: string | null; timestamp: Date;
          read: boolean; starred: boolean; hasAttachment: boolean; labels: string[];
          priority: string | null; category: string | null; aiClassified: boolean;
          threadId: string; similarity: number;
        }>>(
          `SELECT e.id, e."gmailId" as gmail_id, e."from", e."fromName", e.subject, e.body, e.snippet,
                  e.timestamp, e."read", e.starred, e."hasAttachment", e.labels, e.priority,
                  e.category, e."aiClassified", e."threadId",
                  1 - (ee.embedding <=> $1::vector) as similarity
           FROM email_embeddings ee
           JOIN emails e ON e.id = ee."emailId"
           WHERE e."userId" = $2
           ORDER BY ee.embedding <=> $1::vector
           LIMIT 20`,
          vectorStr,
          session.user.id,
        );
        vectorEmails = results.map((r) => ({
          id: r.id, from: { name: r.fromName || r.from, email: r.from }, to: [],
          subject: r.subject, preview: r.snippet || "", body: r.body,
          timestamp: r.timestamp, read: r.read, starred: r.starred,
          priority: (r.priority as Priority) || "P3", category: (r.category as Category) || "fyi",
          labels: r.labels, hasAttachment: r.hasAttachment, attachments: [],
          threadId: r.threadId, replies: [], isClassified: r.aiClassified,
          similarity: r.similarity,
        }));
      }
    } catch (err) {
      console.error("[search] Vector search failed:", err);
    }

    // Text search — always run to catch emails without embeddings
    const textResults = await prisma.email.findMany({
      where: {
        userId: session.user.id,
        OR: [
          { subject: { contains: query.trim(), mode: "insensitive" } },
          { body: { contains: query.trim(), mode: "insensitive" } },
          { from: { contains: query.trim(), mode: "insensitive" } },
        ],
      },
      orderBy: { timestamp: "desc" },
      take: 20,
    });

    const textEmails: Email[] = textResults.map((e) => ({
      id: e.id, from: { name: e.fromName || e.from, email: e.from },
      to: parseAddresses(e.toText), cc: e.ccText ? parseAddresses(e.ccText) : undefined,
      subject: e.subject, preview: e.snippet || "", body: e.body,
      bodyHtml: e.bodyHtml ?? undefined, timestamp: e.timestamp, read: e.read,
      starred: e.starred, priority: (e.priority as Priority) || "P3",
      category: (e.category as Category) || "fyi", labels: e.labels,
      hasAttachment: e.hasAttachment, attachments: [], threadId: e.threadId,
      replies: [], isClassified: e.aiClassified,
    }));

    // Merge: vector results first (ranked by similarity), then text results not already included
    const seenIds = new Set(vectorEmails.map((e) => e.id));
    const merged = [
      ...vectorEmails,
      ...textEmails.filter((e) => !seenIds.has(e.id)),
    ];

    return NextResponse.json({ emails: merged });
  } catch (error) {
    console.error("[search] Search failed:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
