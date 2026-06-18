import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";
import { chatTools, executeTool, type ToolName, type ToolCall } from "./tools";

const AGENT_MODEL = process.env.AGENT_CHAT_MODEL || "gemini-2.5-flash-lite";

const agentProvider = createGoogleGenerativeAI({
  apiKey: process.env.AGENT_CHAT_API_KEY || "",
});

const REVIEW_SYSTEM_PROMPT = `You are Relay AI, an intelligent email and calendar assistant.

BEHAVIOR RULES:
- You are an intelligent assistant. Extract as much context as possible from the user's message, conversation history, and tool results. NEVER ask the user for information they may have already provided or that can be reasonably inferred.
- When a user says "write an email to X about Y", extract the recipient, subject, and body from the message. Use common sense to infer a professional subject line and compose a complete email body.
- When a user says "reply to the email from X", search for the email first, read it, then draft a contextually appropriate reply.
- When a user says "send an email", compose and draft it — the user will review before sending.
- Only ask a follow-up question when information is genuinely missing (e.g., no recipient at all). Ask ONE question, not multiple.
- Infer tone from context: "project update" → professional, "quick note" → casual, etc.

TOOL RULES:
- When the user asks to send, draft, or reply to an email, you MUST use the draft_email or draft_reply tool. NEVER write the email content as plain text.
- When the user asks to schedule or create an event, you MUST use the create_event tool.
- When the user asks to search emails, you MUST use the search_emails tool.
- After calling a tool, respond with a BRIEF confirmation only. Do not generate long explanations.
- NEVER repeat the email content in your text response after using a draft tool. Just say "Draft created" or similar.`;

const AUTO_SEND_SYSTEM_PROMPT = `You are Relay AI, an intelligent email and calendar assistant. You are in AUTO-SEND mode — emails will be sent immediately without user confirmation.

BEHAVIOR RULES:
- You are an intelligent assistant. Extract as much context as possible from the user's message, conversation history, and tool results. NEVER ask the user for information they may have already provided or that can be reasonably inferred.
- When a user says "write an email to X about Y", extract the recipient, subject, and body from the message. Compose a complete, professional email and send it immediately using the send_email tool.
- When a user says "reply to the email from X", search for the email first, read it, then compose and send the reply immediately.
- When a user says "send an email to X", compose and send it immediately.
- Only ask a follow-up question when information is genuinely missing (e.g., no recipient at all). Ask ONE question, not multiple.
- Infer tone from context: "project update" → professional, "quick note" → casual, etc.
- You have FULL permission to send emails. Do NOT ask for confirmation.

TOOL RULES:
- When the user asks to send or draft an email, you MUST use the send_email tool to send it immediately. NEVER use draft_email — emails go out right away.
- When the user asks to reply to an email, use search_emails to find it, read_email to read it, then send_email to reply immediately.
- When the user asks to schedule or create an event, you MUST use the create_event tool.
- When the user asks to search emails, you MUST use the search_emails tool.
- After calling a tool, respond with a BRIEF confirmation only. Do not generate long explanations.`;

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
}

function createTools(cookieHeader?: string, mode?: "review" | "auto") {
  const toolsToUse =
    mode === "auto"
      ? Object.entries(chatTools).filter(
          ([name]) => name !== "draft_email" && name !== "draft_reply"
        )
      : Object.entries(chatTools).filter(([name]) => name !== "send_email");

  return Object.fromEntries(
    toolsToUse.map(([name, tool]) => [
      name,
      {
        description: tool.description,
        inputSchema: tool.parameters,
        execute: async (args: Record<string, unknown>) => {
          try {
            return await executeTool(
              name as ToolName,
              args,
              "",
              fetch,
              cookieHeader
            );
          } catch (err) {
            console.error(`[agent] Tool ${name} failed:`, err);
            return { error: `Tool ${name} failed: ${(err as Error).message}` };
          }
        },
      },
    ])
  );
}

const DRAFT_TOOLS = new Set(["draft_email", "draft_reply", "send_email"]);

function extractBodyFromArgs(argsText: string): string | null {
  const bodyIdx = argsText.indexOf('"body"');
  if (bodyIdx === -1) return null;

  const colonIdx = argsText.indexOf(":", bodyIdx + 6);
  if (colonIdx === -1) return null;

  const quoteStart = argsText.indexOf('"', colonIdx + 1);
  if (quoteStart === -1) return null;

  let i = quoteStart + 1;
  let body = "";
  while (i < argsText.length) {
    const ch = argsText[i];
    if (ch === "\\") {
      const next = argsText[i + 1];
      if (next === '"') body += '"';
      else if (next === "\\") body += "\\";
      else if (next === "n") body += "\n";
      else if (next === "t") body += "\t";
      else body += next;
      i += 2;
    } else if (ch === '"') {
      break;
    } else {
      body += ch;
      i++;
    }
  }
  return body;
}

function extractFieldFromArgs(argsText: string, field: string): string | null {
  const pattern = `"${field}"`;
  const fieldIdx = argsText.indexOf(pattern);
  if (fieldIdx === -1) return null;

  const colonIdx = argsText.indexOf(":", fieldIdx + pattern.length);
  if (colonIdx === -1) return null;

  const quoteStart = argsText.indexOf('"', colonIdx + 1);
  if (quoteStart === -1) return null;

  let i = quoteStart + 1;
  let value = "";
  while (i < argsText.length) {
    const ch = argsText[i];
    if (ch === "\\") {
      const next = argsText[i + 1];
      if (next === '"') value += '"';
      else if (next === "\\") value += "\\";
      else if (next === "n") value += "\n";
      else if (next === "t") value += "\t";
      else value += next;
      i += 2;
    } else if (ch === '"') {
      break;
    } else {
      value += ch;
      i++;
    }
  }
  return value;
}

export async function runAgentStream(
  messages: ChatMessage[],
  cookieHeader: string,
  onChunk: (chunk: string) => void,
  onToolCall: (toolCall: ToolCall) => void,
  onToolCallDelta?: (toolName: string, argsTextDelta: string, partialBody: string | null, partialTo: string | null, partialSubject: string | null) => void,
  mode: "review" | "auto" = "review"
): Promise<void> {
  const history = messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const tools = createTools(cookieHeader, mode);
  const systemPrompt =
    mode === "auto" ? AUTO_SEND_SYSTEM_PROMPT : REVIEW_SYSTEM_PROMPT;

  const result = streamText({
    model: agentProvider(AGENT_MODEL),
    system: systemPrompt,
    messages: history,
    tools,
  });

  const reader = result.fullStream.getReader();
  const argsBuffers = new Map<string, string>();

  try {
    while (true) {
      const { done, value } = await Promise.race([
        reader.read(),
        new Promise<{ done: true; value: undefined }>((resolve) =>
          setTimeout(() => resolve({ done: true, value: undefined }), 45000)
        ),
      ]);

      if (done) break;
      if (!value) continue;

      if (value.type === "text-delta") {
        onChunk((value as { text: string }).text);
      }

      if (value.type === "tool-call-streaming-start") {
        const v = value as { toolCallId: string; toolName: string };
        if (DRAFT_TOOLS.has(v.toolName)) {
          argsBuffers.set(v.toolCallId, "");
        }
      }

      if (value.type === "tool-call-delta") {
        const v = value as {
          toolCallId: string;
          toolName: string;
          argsTextDelta: string;
        };

        if (DRAFT_TOOLS.has(v.toolName) && onToolCallDelta) {
          const prev = argsBuffers.get(v.toolCallId) || "";
          const updated = prev + v.argsTextDelta;
          argsBuffers.set(v.toolCallId, updated);

          const body = extractBodyFromArgs(updated);
          const to = extractFieldFromArgs(updated, "to");
          const subject = extractFieldFromArgs(updated, "subject");

          if (body !== null || to !== null) {
            onToolCallDelta(v.toolName, v.argsTextDelta, body, to, subject);
          }
        }
      }

      if (value.type === "tool-call") {
        const tc = value as { toolName: string; toolCallId?: string; input: Record<string, unknown> };
        console.log(`[agent] Tool call detected: ${tc.toolName}`);
        if (tc.toolCallId) argsBuffers.delete(tc.toolCallId);
        onToolCall({
          name: tc.toolName as ToolName,
          args: tc.input,
          result: undefined,
        });
      }

      if (value.type === "tool-result") {
        const tr = value as unknown as { toolName: string; result: unknown };
        if (tr.result) {
          console.log(`[agent] Tool result: ${tr.toolName}`);
          onToolCall({
            name: tr.toolName as ToolName,
            args: {} as Record<string, unknown>,
            result: tr.result,
          });
        }
      }
    }
  } catch (err) {
    reader.releaseLock();
    throw err;
  }
  reader.releaseLock();
}
