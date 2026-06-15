import { generateOAuthUrl } from "corsair/oauth";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { corsair, ensureCorsairSetup, ensureTenant } from "@/lib/corsair";
import { auth } from "@/lib/auth";

const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/connect/callback`;

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureCorsairSetup();
    await ensureTenant(session.user.id);

    const { url, state } = await generateOAuthUrl(corsair as never, "googlecalendar", {
      tenantId: session.user.id,
      redirectUri: REDIRECT_URI,
    });

    const response = NextResponse.redirect(url);
    response.cookies.set("oauth_state_calendar", state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 10,
      path: "/",
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to start OAuth flow";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
