import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { withRetry } from "./retry";

const AI_MODEL = process.env.AI_MODEL || "gemini-2.5-flash-lite";

const summarizerProvider = createGoogleGenerativeAI({
  apiKey: process.env.REPLY_GENERATE_API_KEY || "",
});

const summarySchema = z.object({
  summary: z.string().describe("A concise 2-3 sentence summary of the email"),
  keyPoints: z.array(z.string()).describe("3-5 key points from the email"),
  actionItems: z.array(z.string()).describe("Action items or things requiring response, if any"),
  sentiment: z.enum(["positive", "neutral", "negative", "urgent"]).describe("Overall sentiment/tone of the email"),
});

export type EmailSummaryResult = z.infer<typeof summarySchema>;

export interface SummarizeEmailInput {
  from: string;
  subject: string;
  body: string;
}

export async function summarizeEmail(
  email: SummarizeEmailInput,
): Promise<EmailSummaryResult | null> {
  console.log(`[email-summarizer] Summarizing email from ${email.from}`);

  try {
    const { object } = await withRetry(async () => {
      return generateObject({
        model: summarizerProvider(AI_MODEL),
        prompt: buildSummaryPrompt(email),
        schema: summarySchema,
      });
    }, "summarizeEmail", 3, "email-summarizer");

    console.log(`[email-summarizer] Done: ${object.keyPoints.length} key points, ${object.actionItems.length} action items`);
    return object;
  } catch (error) {
    console.error("[email-summarizer] Failed:", error);
    return null;
  }
}

function buildSummaryPrompt(email: SummarizeEmailInput): string {
  return `Summarize this email concisely.

FROM: ${email.from}
SUBJECT: ${email.subject}

EMAIL BODY:
"""
${email.body.slice(0, 4000)}
"""

Rules:
- summary: 2-3 sentences capturing the main message
- keyPoints: 3-5 most important points or details
- actionItems: specific things the recipient needs to do (empty array if none)
- sentiment: overall tone — positive, neutral, negative, or urgent
- Be factual and concise
- Do NOT include greetings or sign-offs in the summary
- If the email is a newsletter/promotion, summarize the main content highlights`;
}
