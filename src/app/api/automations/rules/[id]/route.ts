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

  const rule = await prisma.automationRule.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!rule || rule.userId !== session.user.id) {
    return NextResponse.json({ error: "Rule not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};
  if (body?.name !== undefined) updateData.name = body.name;
  if (body?.enabled !== undefined) updateData.enabled = body.enabled;
  if (body?.triggerType !== undefined) updateData.triggerType = body.triggerType;
  if (body?.triggerValue !== undefined) updateData.triggerValue = body.triggerValue;
  if (body?.actionType !== undefined) updateData.actionType = body.actionType;
  if (body?.actionTarget !== undefined) updateData.actionTarget = body.actionTarget;

  await prisma.automationRule.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const rule = await prisma.automationRule.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!rule || rule.userId !== session.user.id) {
    return NextResponse.json({ error: "Rule not found" }, { status: 404 });
  }

  await prisma.automationRule.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
