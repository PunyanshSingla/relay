import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AutomationRule, ActionType } from "@/types/automation";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rules = await prisma.automationRule.findMany({
    where: {
      userId: session.user.id,
      status: "suggested",
    },
    orderBy: { count: "desc" },
    take: 10,
  });

  const result: AutomationRule[] = rules.map((r) => ({
    id: r.id,
    actionType: r.actionType as ActionType,
    target: r.target,
    description: r.description,
    count: r.count,
    status: r.status as "suggested",
    suppressedUntil: r.suppressedUntil,
    createdAt: r.createdAt,
  }));

  return NextResponse.json({ automations: result });
}
