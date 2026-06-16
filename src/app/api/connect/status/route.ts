import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = session.user.id;

  try {
    const accounts = await prisma.corsairAccount.findMany({
      where: { tenantId },
      include: { integration: true },
    });
    console.log(accounts, "accounts")
    const connected = new Set(accounts.map((a) => a.integration.name));
    console.log(connected, "connected")
    return NextResponse.json({
      gmail: connected.has("gmail"),
      calendar: connected.has("googlecalendar"),
    });
  } catch (error) {
    console.error("[connect-status] Error:", error);
    return NextResponse.json({ gmail: false, calendar: false });
  }
}
