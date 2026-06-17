import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";
import { chatTools, executeTool, type ToolName, type ToolCall } from "./tools";

const AGENT_MODEL = process.env.AGENT_CHAT_MODEL || "gemini-2.5-flash-lite";

const agentProvider = createGoogleGenerativeAI({
  apiKey: process.env.AGENT_CHAT_API_KEY || "",
});

const SYSTEM_PROMPT = `You are Relay AI, an intelligent email and calendar assistant.

CRITICAL RULES:
- When the user asks to send, draft, or reply to an email, you MUST use the draft_email or draft_reply tool. NEVER write the email content as plain text.
- When the user asks to schedule or create an event, you MUST use the create_event tool.
- When the user asks to search emails, you MUST use the search_emails tool.
- Keep your text responses VERY SHORT — 1 sentence max after a tool call.
- NEVER repeat the email content in your text response after using a draft tool. Just say "Draft created" or similar.
- After calling a tool, respond with a BRIEF confirmation only. Do not generate long explanations.`;

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
}

function createTools(cookieHeader?: string) {
  return Object.fromEntries(
    Object.entries(chatTools).map(([name, tool]) => [
      name,
      {
        description: tool.description,
        inputSchema: tool.parameters,
        execute: async (args: Record<string, unknown>) => {
          try {
            return await executeTool(name as ToolName, args, "", fetch, cookieHeader);
          } catch (err) {
            console.error(`[agent] Tool ${name} failed:`, err);
            return { error: `Tool ${name} failed: ${(err as Error).message}` };
          }
        },
      },
    ])
  );
}

export async function runAgentStream(
  messages: ChatMessage[],
  cookieHeader: string,
  onChunk: (chunk: string) => void,
  onToolCall: (toolCall: ToolCall) => void,
): Promise<void> {
  const history = messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const tools = createTools(cookieHeader);

  const result = streamText({
    model: agentProvider(AGENT_MODEL),
    system: SYSTEM_PROMPT,
    messages: history,
    tools,
  });

  // Use fullStream which yields ALL parts: text, tool-call, tool-result, etc.
  const reader = result.fullStream.getReader();

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

      // Text chunks
      if (value.type === "text-delta") {
        onChunk((value as { text: string }).text);
      }

      // Tool call initiation — the AI decided to call a tool
      if (value.type === "tool-call") {
        const tc = value as { toolName: string; input: Record<string, unknown> };
        console.log(`[agent] Tool call detected: ${tc.toolName}`);
        onToolCall({
          name: tc.toolName as ToolName,
          args: tc.input,
          result: undefined,
        });
      }

      // Tool result — update the last matching tool call with the result
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
  } finally {
    reader.releaseLock();
  }
}
