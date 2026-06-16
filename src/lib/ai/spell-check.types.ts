import { z } from "zod";

export interface SpellCheckResult {
  offset: number;
  length: number;
  message: string;
  fix: string;
}

export const spellCheckSchema = z.object({
  errors: z.array(
    z.object({
      offset: z.number(),
      length: z.number(),
      message: z.string(),
      fix: z.string(),
    }),
  ),
});
