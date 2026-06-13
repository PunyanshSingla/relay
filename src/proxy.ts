import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const protectedRoutes = ["/dashboard", "/onboarding"];

// Routes that require Gmail connection
const gmailRequiredRoutes = ["/dashboard"];

// Auth routes (redirect to dashboard if already authenticated)
const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip proxy for API routes, static files, and assets
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".png")
  ) {
    return NextResponse.next();
  }

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  const isAuthRoute = authRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // If neither protected nor auth route, proceed
  if (!isProtectedRoute && !isAuthRoute) {
    return NextResponse.next();
  }

  // Fast cookie check (Edge-compatible, no DB)
  const hasSession =
    !!request.cookies.get("better-auth.session_token")?.value ||
    !!request.cookies.get("__Secure-better-auth.session_token")?.value;

  // Redirect unauthenticated users to login
  if (isProtectedRoute && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackURL", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages to dashboard
  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Check Gmail connection status for routes that require it
  const requiresGmail = gmailRequiredRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (requiresGmail && hasSession) {
    const gmailConnected = request.cookies.get("gmail_connected")?.value === "true";
    const isOnboarding = pathname.startsWith("/onboarding");

    // If Gmail not connected and not already on onboarding, redirect
    if (!gmailConnected && !isOnboarding) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }

    // If Gmail connected and on onboarding, redirect to dashboard
    if (gmailConnected && isOnboarding) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.svg$|.*\\.png$).*)",
  ],
};
