import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const status = body?.status as string | undefined;

  if (!status || !["accepted", "dismissed"].includes(status)) {
    return NextResponse.json(
      { error: "Invalid status. Must be: accepted, dismissed" },
      { status: 400 }
    );
  }

  const rule = await prisma.automationRule.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!rule || rule.userId !== session.user.id) {
    return NextResponse.json({ error: "Automation not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = { status };
  if (status === "dismissed") {
    const suppressUntil = new Date();
    suppressUntil.setDate(suppressUntil.getDate() + 30);
    updateData.suppressedUntil = suppressUntil;
  }

  await prisma.workflowPattern.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ ok: true });
}
