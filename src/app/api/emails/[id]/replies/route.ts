import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { corsair } from "@/lib/corsair";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mapGmailThreadToEmails } from "@/lib/gmail-utils";
import { gmailCacheGet, gmailCacheSet } from "@/lib/gmail-cache";

const GMAIL_CACHE_TTL = 5 * 60 * 1000;

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
      select: { threadId: true, gmailId: true },
    });

    if (!dbEmail?.threadId) {
      return NextResponse.json({ replies: [] });
    }

    const cacheKey = `${session.user.id}:thread:${dbEmail.threadId}`;
    const cached = gmailCacheGet<Array<{
      id: string;
      from: { name: string; email: string };
      body: string;
      bodyHtml?: string;
      timestamp: Date;
    }>>(cacheKey);

    if (cached) {
      return NextResponse.json({ replies: cached });
    }

    const tenant = corsair.withTenant(session.user.id);
    const thread = await tenant.gmail.api.threads.get({
      id: dbEmail.threadId,
      format: "full",
    });

    const threadEmails = mapGmailThreadToEmails(thread);
    const replies = threadEmails
      .filter((e) => e.id !== dbEmail.gmailId)
      .map((e) => ({
        id: e.id,
        from: e.from,
        body: e.body,
        bodyHtml: e.bodyHtml || undefined,
        timestamp: e.timestamp,
      }));

    gmailCacheSet(cacheKey, replies, GMAIL_CACHE_TTL);

    return NextResponse.json({ replies });
  } catch (error) {
    console.error("Failed to fetch replies:", error);
    return NextResponse.json({ replies: [] });
  }
}
