import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { buildSpellCheckPrompt } from "./prompts";
import { withRetry } from "./retry";
import { type SpellCheckResult, spellCheckSchema } from "./spell-check.types";

const AI_MODEL = process.env.AI_MODEL || "gemini-2.5-flash-lite";

const inlineProvider = createGoogleGenerativeAI({
  apiKey: process.env.INLINE_API_KEY || "",
});

export async function checkSpelling(text: string): Promise<SpellCheckResult[]> {
  if (!text.trim()) return [];

  const { object } = await withRetry(
    () =>
      generateObject({
        model: inlineProvider(AI_MODEL),
        prompt: buildSpellCheckPrompt(text),
        schema: spellCheckSchema,
      }),
    "checkSpelling",
    3,
    "spell-check",
  );

  return object.errors.filter(
    (e) => e.offset >= 0 && e.length > 0 && e.offset + e.length <= text.length,
  );
}
