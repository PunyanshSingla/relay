import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rules = await prisma.automationRule.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ rules });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, triggerType, triggerValue, actionType, actionTarget } = body;

  if (!name || !triggerType || !triggerValue || !actionType || !actionTarget) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  const validTriggers = ["sender_email", "sender_domain", "subject_contains", "category"];
  const validActions = ["forward_to", "auto_reply"];

  if (!validTriggers.includes(triggerType)) {
    return NextResponse.json({ error: "Invalid trigger type" }, { status: 400 });
  }
  if (!validActions.includes(actionType)) {
    return NextResponse.json({ error: "Invalid action type" }, { status: 400 });
  }

  const rule = await prisma.automationRule.create({
    data: {
      userId: session.user.id,
      name,
      triggerType,
      triggerValue,
      actionType,
      actionTarget,
    },
  });

  return NextResponse.json({ rule }, { status: 201 });
}
