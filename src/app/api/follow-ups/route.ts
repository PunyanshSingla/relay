import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { FollowUp, FollowUpStatus } from "@/types/follow-up";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as FollowUpStatus | "all" | null;
  const cursor = searchParams.get("cursor") || undefined;

  const where: Record<string, unknown> = { userId: session.user.id };
  if (status && status !== "all") {
    where.status = status;
  }

  const PAGE_SIZE = 25;
  const query: Record<string, unknown> = {
    where,
    orderBy: { sentAt: "desc" },
    take: PAGE_SIZE + 1,
  };

  if (cursor) {
    query.cursor = { id: cursor };
    query.skip = 1;
  }

  const items = await prisma.followUp.findMany(query as Parameters<typeof prisma.followUp.findMany>[0]);
  const hasMore = items.length > PAGE_SIZE;
  const followUps = hasMore ? items.slice(0, PAGE_SIZE) : items;

  const [pending, dismissed, acted_upon] = await Promise.all([
    prisma.followUp.count({ where: { userId: session.user.id, status: "pending" } }),
    prisma.followUp.count({ where: { userId: session.user.id, status: "dismissed" } }),
    prisma.followUp.count({ where: { userId: session.user.id, status: "acted_upon" } }),
  ]);

  const result: FollowUp[] = followUps.map((f) => ({
    id: f.id,
    emailId: f.emailId,
    gmailId: f.gmailId,
    threadId: f.threadId,
    subject: f.subject,
    toEmail: f.toEmail,
    toName: f.toName,
    sentAt: f.sentAt,
    status: f.status as FollowUpStatus,
    replyReceivedAt: f.replyReceivedAt,
    createdAt: f.createdAt,
  }));

  return NextResponse.json({
    followUps: result,
    nextCursor: hasMore ? followUps[followUps.length - 1].id : null,
    counts: { pending, dismissed, acted_upon },
  });
}
