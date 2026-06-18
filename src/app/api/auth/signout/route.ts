import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function POST() {
  const headersList = await headers();

  // Get tenantId from session before signout
  let tenantId: string | null = null;
  try {
    const session = await auth.api.getSession({ headers: headersList });
    if (session) {
      tenantId = session.user.id;
    }
  } catch {
    // Session may already be invalid
  }

  try {
    await auth.api.signOut({ headers: headersList });
  } catch {
    // Session may already be invalid — proceed anyway
  }

  // Clean up Corsair account entries so status API reflects reality
  if (tenantId) {
    try {
      const accounts = await prisma.corsairAccount.findMany({
        where: { tenantId },
        select: { id: true },
      });
      const accountIds = accounts.map((a) => a.id);

      if (accountIds.length > 0) {
        await Promise.all([
          prisma.corsairEntity.deleteMany({
            where: { accountId: { in: accountIds } },
          }),
          prisma.corsairEvent.deleteMany({
            where: { accountId: { in: accountIds } },
          }),
        ]);
        await prisma.corsairAccount.deleteMany({
          where: { tenantId },
        });
      }
    } catch (err) {
      console.error("[signout] Failed to clean up corsair accounts:", err);
    }
  }

  const response = NextResponse.json({ success: true });

  response.cookies.set("gmail_connected", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  response.cookies.set("calendar_connected", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  response.cookies.set("oauth_state", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });

  response.cookies.set("oauth_state_calendar", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });

  response.cookies.set("oauth_tenant", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });

  return response;
}
