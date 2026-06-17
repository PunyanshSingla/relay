import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { runAgentStream, type ChatMessage } from "@/lib/ai/agent";
import type { ToolCall } from "@/lib/ai/tools";

export async function POST(request: Request) {
  const startTime = Date.now();
  console.log(`\n[chat] ========== NEW REQUEST ==========`);

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    console.error("[chat] Unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  console.log(`[chat] Session: user=${session.user.id}`);

  const body = await request.json();
  const { message, history = [] } = body as {
    message: string;
    history: Array<{ role: "user" | "assistant"; content: string }>;
  };

  if (!message?.trim()) {
    console.error("[chat] Empty message");
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  console.log(`[chat] Message: "${message.slice(0, 100)}..."`);
  console.log(`[chat] History length: ${history.length}`);

  // Extract cookies to pass to internal API calls
  const cookieHeader = request.headers.get("cookie") || "";
  console.log(`[chat] Has cookies: ${cookieHeader.length > 0}`);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        try {
          const payload = `data: ${JSON.stringify({ event, data })}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch {
          // Controller already closed — ignore
        }
      };

      const messages: ChatMessage[] = [
        ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
        { role: "user" as const, content: message },
      ];

      console.log(`[chat] Messages sent to agent: ${messages.length}`);

      try {
        const toolCalls: ToolCall[] = [];
        let textChunks = 0;

        // Global timeout — force close after 60s
        const globalTimeout = setTimeout(() => {
          console.warn(`[chat] ⏰ Global timeout reached (60s), forcing stream close`);
          send("done", { toolCalls: toolCalls.map((tc) => ({ name: tc.name, args: tc.args })) });
          try { controller.close(); } catch {}
        }, 60000);

        console.log(`[chat] Starting agent stream...`);

        await runAgentStream(
          messages,
          cookieHeader,
          (chunk) => {
            textChunks++;
            if (textChunks <= 3 || textChunks % 10 === 0) {
              console.log(`[chat] Text chunk #${textChunks}: "${chunk.slice(0, 80)}..."`);
            }
            send("text", chunk);
          },
          (tc) => {
            toolCalls.push(tc);
            console.log(`[chat] Tool call: ${tc.name}`, JSON.stringify(tc.args).slice(0, 200));
            if (tc.result) {
              console.log(`[chat] Tool result:`, JSON.stringify(tc.result).slice(0, 300));
            }
            send("tool_call", {
              name: tc.name,
              args: tc.args,
              result: tc.result,
            });
          },
        );

        clearTimeout(globalTimeout);

        const totalToolCalls = toolCalls.map((tc) => ({ name: tc.name, args: tc.args }));
        console.log(`[chat] Agent finished. Total text chunks: ${textChunks}, tool calls: ${toolCalls.length}`);
        console.log(`[chat] Tool call summary:`, JSON.stringify(totalToolCalls));

        send("done", { toolCalls: totalToolCalls });
      } catch (error) {
        const elapsed = Date.now() - startTime;
        console.error(`[chat] ❌ Agent error after ${elapsed}ms:`, error);
        console.error(`[chat] Error stack:`, error instanceof Error ? error.stack : "no stack");
        send("error", { message: "AI agent encountered an error. Please try again." });
      }

      try {
        controller.close();
        console.log(`[chat] Stream closed. Total time: ${Date.now() - startTime}ms`);
      } catch (err) {
        console.error(`[chat] Failed to close controller:`, err);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
