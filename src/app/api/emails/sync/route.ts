import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { inngest } from "@/lib/inngest";

export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await inngest.send({
      name: "email/trigger-sync",
      data: { userId: session.user.id },
    });

    return NextResponse.json({ success: true, message: "Sync triggered" });
  } catch (err) {
    console.error("[sync] Failed to trigger sync:", err);
    return NextResponse.json(
      { error: "Failed to trigger sync" },
      { status: 500 },
    );
  }
}
