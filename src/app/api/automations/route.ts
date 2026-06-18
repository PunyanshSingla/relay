import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionType } from "@/types/automation";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const candidates = await prisma.workflowCandidate.findMany({
    where: {
      userId: session.user.id,
      status: "suggested",
    },
    orderBy: { confidence: "desc" },
    take: 10,
  });

  return NextResponse.json({
    automations: candidates.map((c) => ({
      id: c.id,
      actionType: (c.suggestedActions as { action?: string })?.action ?? "unknown",
      target: c.name,
      description: c.description,
      count: c.frequency,
      status: c.status,
    })),
  });
}
