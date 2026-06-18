import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/action-logger";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [{ id }, body] = await Promise.all([params, request.json().catch(() => null)]);
  const status = body?.status as string | undefined;

  if (!status || !["dismissed", "acted_upon"].includes(status)) {
    return NextResponse.json(
      { error: "Invalid status. Must be: dismissed, acted_upon" },
      { status: 400 }
    );
  }

  const followUp = await prisma.followUp.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!followUp || followUp.userId !== session.user.id) {
    return NextResponse.json({ error: "Follow-up not found" }, { status: 404 });
  }

  await prisma.followUp.update({
    where: { id },
    data: { status },
  });

  if (status === "dismissed") {
    logAction({
      userId: session.user.id,
      actionType: "dismiss_followup",
      target: id,
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
