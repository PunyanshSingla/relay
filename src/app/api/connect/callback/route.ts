import { processOAuthCallback } from "corsair/oauth";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { corsair } from "@/lib/corsair";

const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/connect/callback`;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const clearCookieHeader = "oauth_state=; HttpOnly; Path=/; Max-Age=0";

  if (error) {
    return new NextResponse(
      `<html><body><h2>Authorization failed</h2><p>${escapeHtml(error)}</p><p><a href="/onboarding">Try again</a></p></body></html>`,
      { status: 400, headers: { "Set-Cookie": clearCookieHeader, "Content-Type": "text/html" } }
    );
  }

  if (!code || !state) {
    return new NextResponse(
      '<p>Missing code or state parameter.</p>',
      { status: 400, headers: { "Set-Cookie": clearCookieHeader, "Content-Type": "text/html" } }
    );
  }

  const storedState = request.cookies.get("oauth_state")?.value;
  if (!storedState || storedState !== state) {
    return new NextResponse(
      '<p>Invalid state. Possible CSRF attempt.</p>',
      { status: 400, headers: { "Set-Cookie": clearCookieHeader, "Content-Type": "text/html" } }
    );
  }

  try {
    await processOAuthCallback(corsair as never, {
      code,
      state,
      redirectUri: REDIRECT_URI,
    });

    const response = NextResponse.redirect(
      new URL("/dashboard", request.url)
    );
    response.cookies.set("gmail_connected", "true", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
    response.cookies.delete("oauth_state");
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "OAuth failed";
    return new NextResponse(
      `<html><body><h2>OAuth error</h2><p>${escapeHtml(message)}</p><p><a href="/onboarding">Try again</a></p></body></html>`,
      { status: 500, headers: { "Set-Cookie": clearCookieHeader, "Content-Type": "text/html" } }
    );
  }
}
