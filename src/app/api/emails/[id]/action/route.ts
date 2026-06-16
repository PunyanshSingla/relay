import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { corsair } from "@/lib/corsair";
import { auth } from "@/lib/auth";
import { gmailCacheInvalidate } from "@/lib/gmail-cache";

type Action = "star" | "unstar" | "archive" | "trash" | "read" | "unread";

const ACTIONS: Record<Action, { add?: string[]; remove?: string[]; trash?: boolean }> = {
  star:    { add: ["STARRED"] },
  unstar:  { remove: ["STARRED"] },
  archive: { remove: ["INBOX"] },
  trash:   { add: ["TRASH"] },
  read:    { remove: ["UNREAD"] },
  unread:  { add: ["UNREAD"] },
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const action = body?.action as Action | undefined;

  if (!action || !(action in ACTIONS)) {
    return NextResponse.json(
      { error: "Invalid action. Must be one of: star, unstar, archive, trash, read, unread" },
      { status: 400 }
    );
  }

  try {
    const tenant = corsair.withTenant(session.user.id);
    const config = ACTIONS[action];

    if (config.trash) {
      await tenant.gmail.api.messages.trash({ id });
    } else {
      await tenant.gmail.api.messages.modify({
        id,
        addLabelIds: config.add,
        removeLabelIds: config.remove,
      });
    }

    if (action === "archive" || action === "trash") {
      gmailCacheInvalidate(session.user.id, id);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(`Failed to ${action} email:`, error);
    const message = error instanceof Error ? error.message : `Failed to ${action} email`;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
