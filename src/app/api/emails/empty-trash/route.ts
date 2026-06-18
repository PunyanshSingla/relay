import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { corsair, ensureCorsairSetup, ensureTenant } from "@/lib/corsair";

export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureCorsairSetup();
    await ensureTenant(session.user.id);
    const tenant = corsair.withTenant(session.user.id);

    // Get all trashed emails
    const trashed = await prisma.email.findMany({
      where: {
        userId: session.user.id,
        labels: { has: "TRASH" },
      },
      select: { gmailId: true, id: true },
    });

    // Delete from Gmail
    const results = await Promise.allSettled(
      trashed.map((e) =>
        tenant.gmail.api.messages.delete({ id: e.gmailId })
      )
    );

    const deleted = results.filter((r) => r.status === "fulfilled").length;

    // Delete from DB
    await prisma.email.deleteMany({
      where: {
        userId: session.user.id,
        labels: { has: "TRASH" },
      },
    });

    return NextResponse.json({ success: true, deleted });
  } catch (error) {
    console.error("[empty-trash] Failed:", error);
    const message = error instanceof Error ? error.message : "Failed to empty trash";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
