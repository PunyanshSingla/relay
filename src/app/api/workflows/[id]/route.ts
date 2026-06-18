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

  const [{ id }, body] = await Promise.all([params, request.json().catch(() => null)]);
  const status = body?.status as string | undefined;

  if (!status || !["enabled", "dismissed"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const candidate = await prisma.workflowCandidate.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!candidate || candidate.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.workflowCandidate.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[workflows] Failed to update candidate:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
