import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { buildSpellRankPrompt } from "./prompts";
import { withRetry } from "./retry";
import { type Misspelling, type RankedFix, rankSchema } from "./spell-suggest.types";

const AI_MODEL = process.env.AI_MODEL || "gemini-2.5-flash-lite";

const google = createGoogleGenerativeAI({
  apiKey: process.env.SPELL_SUGGEST_API_KEY,
});

export async function rankSuggestions(
  sentence: string,
  misspellings: Misspelling[],
): Promise<RankedFix[]> {
  if (!misspellings.length) return [];

  const misspellingList = misspellings
    .map(
      (m) =>
        `- "${m.word}" (offset ${m.offset}): suggestions: [${m.suggestions.join(", ")}]`,
    )
    .join("\n");

  const { object } = await withRetry(
    () =>
      generateObject({
        model: google(AI_MODEL),
        prompt: buildSpellRankPrompt(sentence, misspellingList),
        schema: rankSchema,
      }),
    "rankSuggestions",
    3,
    "spell-suggest",
  );

  const fixesMap = new Map(
    object.fixes.map((f) => [f.word, f]),
  );

  return misspellings.map((m) => {
    const fix = fixesMap.get(m.word);
    return {
      word: m.word,
      offset: m.offset,
      length: m.length,
      bestFit: fix?.bestFit ?? m.suggestions[0] ?? m.word,
      reason: fix?.reason ?? "",
      alternatives: fix?.alternatives ?? m.suggestions.filter((s) => s !== (fix?.bestFit ?? m.suggestions[0])),
    };
  });
}
