import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import type { Misspelling } from "@/lib/ai/spell-suggest.types";
import { rankSuggestions } from "@/lib/ai/spell-suggest";
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { sentence, misspellings } = await request.json();

    if (!sentence?.trim() || !misspellings?.length) {
      return NextResponse.json({ fixes: [] });
    }

    const fixes = await rankSuggestions(sentence, misspellings as Misspelling[]);
    return NextResponse.json({ fixes });
  } catch (error) {
    console.error("[spell-suggest-api] Error:", error);
    return NextResponse.json(
      { error: "Spell suggestion failed", fixes: [] },
      { status: 500 },
    );
  }
}
