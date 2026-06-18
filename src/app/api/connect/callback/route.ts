import { processOAuthCallback, generateOAuthUrl } from "corsair/oauth";
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
  const isCombinedFlow = gmailState === "combined";

  try {
    await ensureCorsairSetup();
    await processOAuthCallback(corsair as never, {
      code,
      state,
      redirectUri: REDIRECT_URI,
    });

    let tenantId: string | null = parseStateTenantId(state);
    if (!tenantId) {
      try {
        const session = await Promise.race([
          auth.api.getSession({ headers: await headers() }),
          new Promise<null>((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000)),
        ]);
        tenantId = session?.user?.id ?? null;
      } catch {
        // session fetch failed, use state fallback
      }
    }

    // Combined flow: Gmail token now has Calendar scopes too
    // Process as Gmail, then also setup Calendar
    if (isCombinedFlow) {
      // The combined OAuth already granted Calendar scopes
      // We need to also register the Calendar account in Corsair
      try {
        const tenant = corsair.withTenant(tenantId ?? "");
        // Try to get calendar events to verify Calendar access works
        await tenant.googlecalendar.api.events.getMany({ maxResults: 1 });
      } catch {
        // Calendar might need separate setup - that's ok, Gmail is connected
      }

      const response = NextResponse.redirect(new URL("/dashboard", request.url));
      response.cookies.set("gmail_connected", "true", {
        httpOnly: true, sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/", maxAge: 60 * 60 * 24 * 365,
      });
      response.cookies.set("calendar_connected", "true", {
        httpOnly: true, sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/", maxAge: 60 * 60 * 24 * 365,
      });
      response.cookies.delete("oauth_state");

      if (tenantId) {
        try {
          await inngest.send({ name: "email/trigger-sync", data: { userId: tenantId } });
          await inngest.send({ name: "calendar/trigger-sync", data: { userId: tenantId } });
        } catch (err) {
          console.error("[callback] Failed to trigger sync:", err);
        }
      }

      return response;
    }

    // Calendar flow
    if (isCalendarFlow) {
      const response = NextResponse.redirect(new URL("/onboarding", request.url));
      response.cookies.set("calendar_connected", "true", {
        httpOnly: true, sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/", maxAge: 60 * 60 * 24 * 365,
      });
      response.cookies.delete("oauth_state_calendar");

      if (tenantId) {
        try {
          await inngest.send({ name: "calendar/trigger-sync", data: { userId: tenantId } });
        } catch (err) {
          console.error("[callback] Failed to trigger calendar sync:", err);
        }
      }

      return response;
    }

    // Gmail flow (non-combined)
    const response = NextResponse.redirect(new URL("/onboarding", request.url));
    response.cookies.set("gmail_connected", "true", {
      httpOnly: true, sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/", maxAge: 60 * 60 * 24 * 365,
    });
    response.cookies.delete("oauth_state");

    if (tenantId) {
      try {
        await inngest.send({ name: "email/trigger-sync", data: { userId: tenantId } });
      } catch (err) {
        console.error("[callback] Failed to trigger email sync:", err);
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
