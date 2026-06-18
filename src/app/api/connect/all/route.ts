import { generateOAuthUrl } from "corsair/oauth";
import { NextResponse } from "next/server";
import { corsair, ensureCorsairSetup } from "@/lib/corsair";
import { auth } from "@/lib/auth";

const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/connect/callback`;
const GOOGLE_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar";

export async function GET() {
  const session = await auth.api.getSession({ headers: await (await import("next/headers")).headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureCorsairSetup();

    const { url } = await generateOAuthUrl(corsair as never, "gmail", {
      tenantId: session.user.id,
      redirectUri: REDIRECT_URI,
    });

    // Append Google Calendar scope to the Gmail OAuth URL
    // This combines both permissions into a single consent screen
    const parsedUrl = new URL(url);
    const existingScope = parsedUrl.searchParams.get("scope") || "";
    const scopeList = existingScope.split(" ");
    if (!scopeList.includes(GOOGLE_CALENDAR_SCOPE)) {
      scopeList.push(GOOGLE_CALENDAR_SCOPE);
    }
    parsedUrl.searchParams.set("scope", scopeList.join(" "));
    parsedUrl.searchParams.set("prompt", "consent");
    parsedUrl.searchParams.set("access_type", "offline");

    const finalUrl = parsedUrl.toString();

    const response = NextResponse.redirect(finalUrl);
    response.cookies.set("oauth_state", "combined", {
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
