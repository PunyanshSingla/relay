import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { buildSingleClassifyPrompt, buildBatchClassifyPrompt } from "@/lib/ai/prompts";

export interface ClassifyResult {
  priority: "P1" | "P2" | "P3";
  category:
    | "action_needed"
    | "meeting"
    | "follow_up"
    | "fyi"
    | "newsletter"
    | "promotion"
    | "social";
  reason: string;
  suggestedAction: string;
}

const classifySchema = z.object({
  priority: z.enum(["P1", "P2", "P3"]),
  category: z.enum([
    "action_needed",
    "meeting",
    "follow_up",
    "fyi",
    "newsletter",
    "promotion",
    "social",
  ]),
  reason: z.string(),
  suggested_action: z.string(),
});

const batchClassifySchema = z.object({
  classifications: z.array(
    z.object({
      index: z.number(),
      priority: z.enum(["P1", "P2", "P3"]),
      category: z.enum([
        "action_needed",
        "meeting",
        "follow_up",
        "fyi",
        "newsletter",
        "promotion",
        "social",
      ]),
      reason: z.string(),
      suggested_action: z.string(),
    }),
  ),
});

const AI_MODEL = process.env.AI_MODEL || "gemini-2.5-flash-lite";

function isRetryable(error: unknown): boolean {
  if (error && typeof error === "object" && "statusCode" in error) {
    const status = (error as { statusCode: number }).statusCode;
    return status === 503 || status === 529 || status === 429;
  }
  if (error && typeof error === "object" && "isRetryable" in error) {
    return (error as { isRetryable: boolean }).isRetryable === true;
  }
  if (error instanceof TypeError) return true;
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  maxRetries: number = 3,
): Promise<T> {
  const delays = [1000, 3000, 9000];
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const retryable = isRetryable(error);

      console.error(
        `[classifier] ${label} attempt ${attempt}/${maxRetries} failed:`,
        error instanceof Error ? error.message : error,
      );

      if (!retryable || attempt === maxRetries) {
        throw error;
      }

      const delay = delays[attempt - 1] ?? 9000;
      console.warn(
        `[classifier] ${label} retryable error, retrying in ${delay}ms...`,
      );
      await sleep(delay);
    }
  }

  throw lastError;
}

export async function classifyEmail(
  email: {
    from: string;
    subject: string;
    snippet?: string;
    body?: string;
    labels?: string[];
  },
  contactContext?: {
    name?: string;
    emailCount?: number;
    relationshipStrength?: number;
    lastTopic?: string;
  },
): Promise<ClassifyResult | null> {
  try {
    const model = google(AI_MODEL);

    const { object } = await withRetry(async () => {
      return generateObject({
        model,
        prompt: buildSingleClassifyPrompt(email, contactContext),
        schema: classifySchema,
      });
    }, "classifyEmail");

    return {
      priority: object.priority,
      category: object.category,
      reason: object.reason,
      suggestedAction: object.suggested_action,
    };
  } catch (error) {
    console.error("[classifier] Single email classification failed:", error);
    return null;
  }
}

export async function classifyBatch(
  emails: Array<{
    index: number;
    from: string;
    subject: string;
    snippet?: string;
    contactContext?: {
      name?: string;
      emailCount?: number;
      relationshipStrength?: number;
      lastTopic?: string;
    };
  }>,
): Promise<Array<{ index: number; result: ClassifyResult }>> {
  if (emails.length === 0) return [];

  const model = google(AI_MODEL);

  console.log(`[classifier] Classifying batch of ${emails.length} emails with model ${AI_MODEL}`);

  const { object } = await withRetry(async () => {
    return generateObject({
      model,
      prompt: buildBatchClassifyPrompt(emails),
      schema: batchClassifySchema,
    });
  }, "classifyBatch");

  console.log(`[classifier] Got ${object.classifications.length} classifications from LLM`);

  return object.classifications.map((c) => ({
    index: c.index,
    result: {
      priority: c.priority,
      category: c.category,
      reason: c.reason,
      suggestedAction: c.suggested_action,
    },
  }));
}
