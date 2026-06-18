import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, streamText } from "ai";
import {
  buildSuggestPrompt,
  buildFixSpellingPrompt,
  buildImprovePrompt,
  buildWritePrompt,
  buildChangeTonePrompt,
  buildShortenPrompt,
  buildExpandPrompt,
} from "./prompts";
import { withRetry } from "./retry";
import type { ComposeContext } from "./compose.types";

const AI_MODEL = process.env.AI_MODEL || "gemini-2.5-flash-lite";

const inlineProvider = createGoogleGenerativeAI({
  apiKey: process.env.INLINE_API_KEY || "",
});

const composeProvider = createGoogleGenerativeAI({
  apiKey: process.env.COMPOSE_API_KEY || "",
});

function buildContextBlock(ctx?: ComposeContext): string {
  if (!ctx) return "";
  const parts: string[] = [];
  if (ctx.subject) parts.push(`Subject: ${ctx.subject}`);
  if (ctx.to) parts.push(`To: ${ctx.to}`);
  if (ctx.thread) parts.push(`Quoted thread:\n${ctx.thread.slice(0, 300)}${ctx.thread.length > 300 ? "..." : ""}`);
  return parts.length > 0 ? `\n\nEmail context:\n${parts.join("\n")}` : "";
}

async function suggestCompletion(
  text: string,
  context?: ComposeContext,
): Promise<string> {
  const ctxBlock = buildContextBlock(context);

  const { textStream } = await streamText({
    model: inlineProvider(AI_MODEL),
    prompt: buildSuggestPrompt(text, ctxBlock),
  });

  let result = "";
  for await (const chunk of textStream) {
    result += chunk;
  }
  return result.trim();
}

export async function suggestCompletionStream(
  text: string,
  context?: ComposeContext,
): Promise<ReadableStream<Uint8Array>> {
  const ctxBlock = buildContextBlock(context);

  const { textStream } = await streamText({
    model: inlineProvider(AI_MODEL),
    prompt: buildSuggestPrompt(text, ctxBlock),
  });

  const reader = textStream.getReader();
  const encoder = new TextEncoder();

  return new ReadableStream({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
      } else {
        controller.enqueue(encoder.encode(value));
      }
    },
    async cancel() {
      reader.releaseLock();
    },
  });
}
export async function fixSpelling(text: string): Promise<string> {
  if (!text.trim()) return text;

  const { text: result } = await withRetry(
    () =>
      generateText({
        model: inlineProvider(AI_MODEL),
        prompt: buildFixSpellingPrompt(text),
      }),
    "fixSpelling",
    3,
    "compose",
  );

  return result.trim();
}

export async function improveWriting(
  text: string,
  context?: ComposeContext,
  customPrompt?: string,
): Promise<string> {
  if (!text.trim()) return text;

  const ctxBlock = buildContextBlock(context);

  const { text: result } = await withRetry(
    () =>
      generateText({
        model: composeProvider(AI_MODEL),
        prompt: buildImprovePrompt(text, ctxBlock, customPrompt),
      }),
    "improveWriting",
    3,
    "compose",
  );

  return result.trim();
}

export async function writeWithAi(
  text: string,
  context?: ComposeContext,
  customPrompt?: string,
): Promise<string> {
  const ctxBlock = buildContextBlock(context);

  const { text: result } = await withRetry(
    () =>
      generateText({
        model: composeProvider(AI_MODEL),
        prompt: buildWritePrompt(text, ctxBlock, customPrompt),
      }),
    "writeWithAi",
    3,
    "compose",
  );

  return result.trim();
}

export async function changeTone(
  text: string,
  tone: "formal" | "casual" | "friendly",
  context?: ComposeContext,
): Promise<string> {
  if (!text.trim()) return text;

  const ctxBlock = buildContextBlock(context);

  const { text: result } = await withRetry(
    () =>
      generateText({
        model: composeProvider(AI_MODEL),
        prompt: buildChangeTonePrompt(text, tone, ctxBlock),
      }),
    `changeTone-${tone}`,
    3,
    "compose",
  );

  return result.trim();
}

export async function shortenText(
  text: string,
  context?: ComposeContext,
): Promise<string> {
  if (!text.trim()) return text;

  const ctxBlock = buildContextBlock(context);

  const { text: result } = await withRetry(
    () =>
      generateText({
        model: composeProvider(AI_MODEL),
        prompt: buildShortenPrompt(text, ctxBlock),
      }),
    "shortenText",
    3,
    "compose",
  );

  return result.trim();
}

export async function expandText(
  text: string,
  context?: ComposeContext,
): Promise<string> {
  if (!text.trim()) return text;

  const ctxBlock = buildContextBlock(context);

  const { text: result } = await withRetry(
    () =>
      generateText({
        model: composeProvider(AI_MODEL),
        prompt: buildExpandPrompt(text, ctxBlock),
      }),
    "expandText",
    3,
    "compose",
  );

  return result.trim();
}
