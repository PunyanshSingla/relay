import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { checkSpelling } from "@/lib/ai/spell-check";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { text } = await request.json();

    if (!text?.trim()) {
      return NextResponse.json({ errors: [] });
    }

    const errors = await checkSpelling(text);
    return NextResponse.json({ errors });
  } catch (error) {
    console.error("[spell-check-api] Error:", error);
    return NextResponse.json(
      { error: "Spell check failed", errors: [] },
      { status: 500 },
    );
  }
}
