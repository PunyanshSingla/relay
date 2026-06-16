import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { buildSingleClassifyPrompt, buildBatchClassifyPrompt } from "@/lib/ai/prompts";
import { withRetry } from "./retry";
import {
  type EmailInput,
  type ContactContext,
  type BatchEmailInput,
  type ClassifyResult,
  type BatchClassifyResult,
  classifySchema,
  batchClassifySchema,
} from "./classifier.types";

const AI_MODEL = process.env.AI_MODEL || "gemini-2.5-flash-lite";

const classifyProvider = createGoogleGenerativeAI({
  apiKey: process.env.CLASSIFY_API_KEY || "",
});

export async function classifyEmail(
  email: EmailInput,
  contactContext?: ContactContext,
): Promise<ClassifyResult | null> {
  try {
    const { object } = await withRetry(async () => {
      return generateObject({
        model: classifyProvider(AI_MODEL),
        prompt: buildSingleClassifyPrompt(email, contactContext),
        schema: classifySchema,
      });
    }, "classifyEmail", 3, "classifier");

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
  emails: BatchEmailInput[],
): Promise<BatchClassifyResult> {
  if (emails.length === 0) return [];

  console.log(`[classifier] Classifying batch of ${emails.length} emails with model ${AI_MODEL}`);

  const { object } = await withRetry(async () => {
    return generateObject({
      model: classifyProvider(AI_MODEL),
      prompt: buildBatchClassifyPrompt(emails),
      schema: batchClassifySchema,
    });
  }, "classifyBatch", 3, "classifier");

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
