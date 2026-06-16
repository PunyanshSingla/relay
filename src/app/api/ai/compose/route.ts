import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import {
  suggestCompletionStream,
  fixSpelling,
  improveWriting,
  writeWithAi,
  changeTone,
  shortenText,
  expandText,
} from "@/lib/ai/compose";
import type { ComposeContext } from "@/lib/ai/compose.types";

interface ComposeRequest {
  action: "suggest" | "fix" | "improve" | "write" | "tone" | "shorten" | "expand";
  text: string;
  subject?: string;
  to?: string;
  thread?: string;
  tone?: "formal" | "casual" | "friendly";
  customPrompt?: string;
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: ComposeRequest = await request.json();
    const { action, text, subject, to, thread, tone, customPrompt } = body;

    if (!text?.trim()) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const context: ComposeContext = { subject, to, thread };

    switch (action) {
      case "suggest": {
        const stream = await suggestCompletionStream(text, context);
        return new Response(stream, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache",
          },
        });
      }
      case "fix": {
        const result = await fixSpelling(text);
        return NextResponse.json({ result });
      }
      case "improve": {
        const result = await improveWriting(text, context, customPrompt);
        return NextResponse.json({ result });
      }
      case "write": {
        const result = await writeWithAi(text, context, customPrompt);
        return NextResponse.json({ result });
      }
      case "tone": {
        if (!tone) {
          return NextResponse.json({ error: "Tone is required" }, { status: 400 });
        }
        const result = await changeTone(text, tone, context);
        return NextResponse.json({ result });
      }
      case "shorten": {
        const result = await shortenText(text, context);
        return NextResponse.json({ result });
      }
      case "expand": {
        const result = await expandText(text, context);
        return NextResponse.json({ result });
      }
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("[compose-api] Error:", error);
    return NextResponse.json(
      { error: "AI processing failed. Please try again." },
      { status: 500 },
    );
  }
}
