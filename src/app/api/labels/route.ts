import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { corsair } from "@/lib/corsair";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tenant = corsair.withTenant(session.user.id);
    const result = await tenant.gmail.api.labels.list({});

    const labelsRaw = result.labels ?? [];
    const labels = [];
    for (const l of labelsRaw) {
      if (l.type === "user" && l.name) {
        labels.push({ id: l.id ?? "", name: l.name ?? "", unread: l.threadsUnread ?? 0 });
      }
    }
    labels.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ labels });
  } catch (error) {
    console.error("Failed to fetch labels:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch labels";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
