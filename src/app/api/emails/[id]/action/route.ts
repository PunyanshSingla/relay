import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { corsair } from "@/lib/corsair";
import { auth } from "@/lib/auth";
import { gmailCacheInvalidate } from "@/lib/gmail-cache";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/action-logger";

type Action = "star" | "unstar" | "archive" | "trash" | "read" | "unread" | "spam" | "unspam" | "restore";

const ACTIONS: Record<Action, { add?: string[]; remove?: string[]; trash?: boolean }> = {
  star: { add: ["STARRED"] },
  unstar: { remove: ["STARRED"] },
  archive: { remove: ["INBOX"] },
  trash: { add: ["TRASH"] },
  spam: { add: ["SPAM"], remove: ["INBOX"] },
  unspam: { remove: ["SPAM"] },
  restore: { remove: ["TRASH"], add: ["INBOX"] },
  read: { remove: ["UNREAD"] },
  unread: { add: ["UNREAD"] },
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [{ id }, body] = await Promise.all([params, request.json().catch(() => null)]);
  const action = body?.action as Action | undefined;

  if (!action || !(action in ACTIONS)) {
    return NextResponse.json(
      { error: "Invalid action. Must be one of: star, unstar, archive, trash, read, unread" },
      { status: 400 }
    );
  }

  try {
    const tenant = corsair.withTenant(session.user.id);

    // Resolve UUID → gmailId
    const dbLookup = await prisma.email.findUnique({
      where: { id },
      select: { gmailId: true },
    });
    const gmailId = dbLookup?.gmailId ?? id;

    const config = ACTIONS[action];

    if (config.trash) {
      await tenant.gmail.api.messages.trash({ id: gmailId });
    } else {
      await tenant.gmail.api.messages.modify({
        id: gmailId,
        addLabelIds: config.add,
        removeLabelIds: config.remove,
      });
    }
    const actionTypeMap: Record<string, string> = {
      star: "star_email",
      unstar: "star_email",
      archive: "archive_email",
      trash: "trash_email",
    };
    if (action === "archive" || action === "trash") {
      gmailCacheInvalidate(session.user.id, id);
    }
      if (actionTypeMap[action]) {
        const email = await prisma.email.findUnique({ where: { id }, select: { from: true, subject: true, category: true, threadId: true } });
        logAction({
          userId: session.user.id,
          actionType: actionTypeMap[action],
          target: gmailId,
          sender: email?.from,
          subject: email?.subject,
          category: email?.category,
          threadId: email?.threadId,
        }).catch(() => { });
      }

      return NextResponse.json({ ok: true });
    } catch (error) {
      console.error(`Failed to ${action} email:`, error);
      const message = error instanceof Error ? error.message : `Failed to ${action} email`;
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }
