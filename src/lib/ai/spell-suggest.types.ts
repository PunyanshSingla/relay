import { z } from "zod";

export interface Misspelling {
  word: string;
  offset: number;
  length: number;
  suggestions: string[];
}

export interface RankedFix {
  word: string;
  offset: number;
  length: number;
  bestFit: string;
  reason: string;
  alternatives: string[];
}

export const rankSchema = z.object({
  fixes: z.array(
    z.object({
      word: z.string(),
      bestFit: z.string(),
      reason: z.string(),
      alternatives: z.array(z.string()),
    }),
  ),
});
