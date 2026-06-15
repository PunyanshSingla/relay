import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getSyncState } from "@/lib/sync-status";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const state = await getSyncState(session.user.id);

  if (!state) {
    return NextResponse.json({ phase: "idle" });
  }

  return NextResponse.json({
    phase: state.phase,
    isInitialSync: state.isInitialSync,
    totalEmails: state.totalEmails,
    syncedEmails: state.syncedEmails,
    classifiedEmails: state.classifiedEmails,
    totalToClassify: state.totalToClassify,
    syncStartedAt: state.syncStartedAt?.toISOString() ?? null,
    syncCompletedAt: state.syncCompletedAt?.toISOString() ?? null,
    lastSyncAt: state.lastSyncAt?.toISOString() ?? null,
  });
}
