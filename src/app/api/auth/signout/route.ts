import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST() {
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch {
    // Session may already be invalid — proceed anyway
  }

  const response = NextResponse.json({ success: true });

  response.cookies.set("gmail_connected", "", {
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

  response.cookies.set("oauth_tenant", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });

  return response;
}
