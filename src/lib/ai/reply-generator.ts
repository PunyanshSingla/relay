import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { buildReplyPrompt } from "./prompts";
import { withRetry } from "./retry";
import { replyGenerateSchema, type ReplyEmailInput, type ReplyMode, type ReplyGenerateResult } from "./reply-generator.types";

const AI_MODEL = process.env.AI_MODEL || "gemini-2.5-flash-lite";

const replyProvider = createGoogleGenerativeAI({
  apiKey: process.env.REPLY_GENERATE_API_KEY || "",
});

export async function generateReply(
  email: ReplyEmailInput,
  mode: ReplyMode,
): Promise<ReplyGenerateResult | null> {
  console.log(`[reply-generator] Generating ${mode} reply for email from ${email.from}`);

  try {
    const { object } = await withRetry(async () => {
      return generateObject({
        model: replyProvider(AI_MODEL),
        prompt: buildReplyPrompt(email, mode),
        schema: replyGenerateSchema,
      });
    }, "generateReply", 3, "reply-generator");

    console.log(`[reply-generator] Result: needsReply=${object.needsReply}, reason=${object.reason}`);

    return object;
  } catch (error) {
    console.error("[reply-generator] Failed:", error);
    return null;
  }
}
