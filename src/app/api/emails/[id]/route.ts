import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { corsair } from "@/lib/corsair";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mapGmailMessageToEmail, mapGmailThreadToEmails } from "@/lib/gmail-utils";
import type { Priority, Category } from "@/types/email";

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
    // Resolve UUID → gmailId via DB lookup
    const dbEmailLookup = await prisma.email.findUnique({
      where: { id },
      select: { gmailId: true },
    });
    const gmailId = dbEmailLookup?.gmailId ?? id;

    const tenant = corsair.withTenant(session.user.id);

    const message = await tenant.gmail.api.messages.get({
      id: gmailId,
      format: "full",
    });

    const threadId = message.threadId;
    if (threadId) {
      const thread = await tenant.gmail.api.threads.get({
        id: threadId,
        format: "full",
      });

      const emails = mapGmailThreadToEmails(thread);
      const email = emails.find((e) => e.id === gmailId) ?? emails[0] ?? mapGmailMessageToEmail(message);

      const otherReplies = emails
        .filter((e) => e.id !== gmailId)
        .map((e) => ({
          id: e.id,
          from: e.from,
          body: e.body,
          bodyHtml: e.bodyHtml,
          timestamp: e.timestamp,
        }));

      email.replies = otherReplies;

      const dbEmail = await prisma.email.findUnique({
        where: { gmailId },
        select: { priority: true, category: true, aiClassified: true, aiReason: true, aiAction: true },
      });

      if (dbEmail) {
        email.priority = (dbEmail.priority as Priority) || email.priority;
        email.category = (dbEmail.category as Category) || email.category;
      }

      return NextResponse.json({ email });
    }

    const email = mapGmailMessageToEmail(message);

    const dbEmail = await prisma.email.findUnique({
      where: { gmailId },
      select: { priority: true, category: true, aiClassified: true, aiReason: true, aiAction: true },
    });

    if (dbEmail) {
      email.priority = (dbEmail.priority as Priority) || email.priority;
      email.category = (dbEmail.category as Category) || email.category;
    }

    return NextResponse.json({ email });
  } catch (error) {
    console.error("Failed to fetch email:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
