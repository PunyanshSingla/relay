import { processOAuthCallback } from "corsair/oauth";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { corsair, ensureCorsairSetup } from "@/lib/corsair";
import { inngest } from "@/lib/inngest";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/connect/callback`;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function parseStateTenantId(state: string): string | null {
  try {
    const parts = state.split(".");
    if (parts.length < 2) return null;
    const json = Buffer.from(parts[0], "base64").toString("utf-8");
    const parsed = JSON.parse(json);
    return parsed.tenantId ?? null;
  } catch {
    return null;
  }
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

  const gmailState = request.cookies.get("oauth_state")?.value;
  const calendarState = request.cookies.get("oauth_state_calendar")?.value;

  const isCalendarFlow = !!calendarState;
  const storedState = isCalendarFlow ? calendarState : gmailState;

  if (!storedState || storedState !== state) {
    return new NextResponse(
      '<p>Invalid state. Possible CSRF attempt.</p>',
      { status: 400, headers: { "Set-Cookie": clearCookieHeader, "Content-Type": "text/html" } }
    );
  }

  try {
    await ensureCorsairSetup();
    await processOAuthCallback(corsair as never, {
      code,
      state,
      redirectUri: REDIRECT_URI,
    });

    let tenantId: string | null = null;
    try {
      const session = await auth.api.getSession({ headers: await headers() });
      tenantId = session?.user?.id ?? parseStateTenantId(state);
    } catch {
      tenantId = parseStateTenantId(state);
    }

    if (isCalendarFlow) {
      const response = NextResponse.redirect(
        new URL("/onboarding", request.url)
      );
      response.cookies.set("calendar_connected", "true", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
      response.cookies.delete("oauth_state_calendar");

      if (tenantId) {
        try {
          await inngest.send({
            name: "calendar/trigger-sync",
            data: { userId: tenantId },
          });
        } catch (err) {
          console.error("[callback] Failed to trigger calendar sync (OAuth was successful):", err);
        }
      }

      return response;
    }

    const response = NextResponse.redirect(
      new URL("/onboarding", request.url)
    );
    response.cookies.set("gmail_connected", "true", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    response.cookies.delete("oauth_state");

    if (tenantId) {
      try {
        await inngest.send({
          name: "email/trigger-sync",
          data: { userId: tenantId },
        });
      } catch (err) {
        console.error("[callback] Failed to trigger email sync (OAuth was successful):", err);
      }
    }

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "OAuth failed";
    console.error("[callback] OAuth callback error:", err);
    return new NextResponse(
      `<html><body><h2>OAuth error</h2><p>${escapeHtml(message)}</p><p><a href="/onboarding">Try again</a></p></body></html>`,
      { status: 500, headers: { "Set-Cookie": clearCookieHeader, "Content-Type": "text/html" } }
    );
  }
}
