"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, Trash2, Wand2, MessageCircle, FileText, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChatInput } from "@/components/ai/chat-input";
import { ChatMessage } from "@/components/ai/chat-message";
import { DraftCard } from "@/components/ai/draft-card";
import { cn } from "@/lib/utils";
import type { ToolCall, DraftResult } from "@/lib/ai/tools";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
  draft?: DraftResult;
}

type EnhanceMode = "none" | "simple" | "clarity" | "draft";

const ENHANCE_MODES: { id: EnhanceMode; label: string; icon: typeof Sparkles; description: string }[] = [
  { id: "none", label: "Agent", icon: Sparkles, description: "Full AI agent — search, send, schedule" },
  { id: "simple", label: "Enhance", icon: Wand2, description: "Improve your prompt for better results" },
  { id: "clarity", label: "Clarify", icon: MessageCircle, description: "Resolve vague refs, add specificity" },
  { id: "draft", label: "Draft", icon: FileText, description: "Generate a full draft from your idea" },
];

const SUGGESTIONS = [
  "Show me my unread emails",
  "Reply to the latest email from GitHub",
  "Schedule a meeting tomorrow at 3pm",
  "What's on my calendar this week?",
  "Draft an email to sarah@company.com about the project update",
];

export default function AiChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [enhanceMode, setEnhanceMode] = useState<EnhanceMode>("none");
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(async (content: string) => {
    if (loading) return;

    let finalMessage = content;
    if (enhanceMode !== "none") {
      finalMessage = await enhancePrompt(content, enhanceMode);
    }

    // Add user message instantly
    const userMessage: Message = { id: crypto.randomUUID(), role: "user", content: finalMessage };
    const assistantId = crypto.randomUUID();
    const assistantMessage: Message = { id: assistantId, role: "assistant", content: "", toolCalls: [] };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setLoading(true);

    const history = [...messages, userMessage].map((m) => ({ role: m.role, content: m.content }));

    try {
      abortRef.current = new AbortController();

      let lastError: Error | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const res = await fetch("/api/ai/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: finalMessage, history }),
            signal: abortRef.current.signal,
          });

          if (!res.ok) throw new Error(`Chat request failed (${res.status})`);

          const reader = res.body?.getReader();
          if (!reader) throw new Error("No response stream");

          const decoder = new TextDecoder();
          let buffer = "";
          let gotText = false;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              try {
                const { event, data } = JSON.parse(line.slice(6));

                if (event === "text") {
                  gotText = true;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId ? { ...m, content: m.content + data } : m
                    )
                  );
                }

                if (event === "tool_call") {
                  gotText = true;
                  setMessages((prev) =>
                    prev.map((m) => {
                      if (m.id !== assistantId) return m;
                      const newToolCalls = [...(m.toolCalls || []), data];

                      // Detect draft from result OR from args
                      let draft = data.result?.draft ? data.result as DraftResult : undefined;
                      if (!draft && data.name === "draft_email" && data.args?.to) {
                        draft = { draft: true, type: "email", to: data.args.to, subject: data.args.subject || "", body: data.args.body || "" };
                      }
                      if (!draft && data.name === "draft_reply" && data.args?.emailId) {
                        draft = { draft: true, type: "reply", to: "", subject: "", body: data.args.body || "", replyToId: data.args.emailId };
                      }

                      // Update existing draft if it's a result event (has result but empty args)
                      if (!draft && data.result?.draft && m.draft) {
                        draft = data.result as DraftResult;
                      }

                      return { ...m, toolCalls: newToolCalls, draft: draft || m.draft };
                    })
                  );
                }
              } catch {
                // skip malformed lines
              }
            }
          }

          // Success — break out of retry loop
          lastError = null;
          break;
        } catch (err) {
          if ((err as Error).name === "AbortError") throw err;
          lastError = err as Error;
          console.warn(`[chat] Attempt ${attempt + 1} failed:`, lastError.message);
          if (attempt < 2) await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        }
      }

      if (lastError) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "Sorry, something went wrong after retries. Please try again." }
              : m
          )
        );
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, [loading, messages, enhanceMode]);

  const handleSendDraft = useCallback(async (draft: DraftResult) => {
    try {
      const formData = new FormData();
      formData.set("to", draft.to);
      formData.set("subject", draft.subject);
      formData.set("bodyHtml", draft.body);
      if (draft.threadId) formData.set("threadId", draft.threadId);

      const res = await fetch("/api/emails/send", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: `Email sent to ${draft.to} with subject "${draft.subject}".`,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "Failed to send email. Please try again.",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Failed to send email. Please try again.",
        },
      ]);
    }
  }, []);

  const handleClear = () => setMessages([]);
  const handleStop = () => { abortRef.current?.abort(); setLoading(false); };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="size-8" onClick={() => router.back()}>
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="size-4 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-semibold">AI Command Center</h1>
            <p className="text-xs text-muted-foreground">Search, send, schedule, and manage your inbox</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClear} className="text-xs text-muted-foreground">
              <Trash2 className="size-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Mode selector */}
      <div className="flex items-center gap-1.5 px-4 py-2 border-b border-border bg-card shrink-0">
        {ENHANCE_MODES.map((mode) => {
          const Icon = mode.icon;
          return (
            <button
              key={mode.id}
              onClick={() => setEnhanceMode(mode.id)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
                enhanceMode === mode.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
              title={mode.description}
            >
              <Icon className="size-3" />
              {mode.label}
            </button>
          );
        })}
        {enhanceMode !== "none" && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 ml-1">
            {ENHANCE_MODES.find((m) => m.id === enhanceMode)?.description}
          </Badge>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Sparkles className="size-10 mb-4 opacity-30" />
            <h2 className="text-lg font-medium mb-1">What can I help you with?</h2>
            <p className="text-sm mb-6">I can search emails, draft replies, create events, and more.</p>
            <div className="flex flex-wrap gap-2 max-w-lg justify-center">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="px-3 py-1.5 rounded-lg border border-border bg-card text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id}>
              <ChatMessage
                role={msg.role}
                content={msg.content}
                toolCalls={msg.toolCalls}
                isStreaming={loading && msg.role === "assistant" && msg.id === messages[messages.length - 1]?.id && !msg.draft}
              />
              {msg.draft && (
                <div className="px-4 mt-2">
                  <DraftCard draft={msg.draft} onSend={handleSendDraft} />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="relative shrink-0">
        {loading && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-10">
            <Button variant="outline" size="sm" onClick={handleStop} className="text-xs shadow-md">
              Stop generating
            </Button>
          </div>
        )}
        <ChatInput onSend={handleSend} disabled={loading} />
      </div>
    </div>
  );
}

async function enhancePrompt(prompt: string, mode: EnhanceMode): Promise<string> {
  const modePrompts: Record<string, string> = {
    simple: `Enhance this user prompt to be clearer and more specific for an AI email assistant. Keep it concise. User's original prompt: "${prompt}"`,
    clarity: `Improve this prompt for an AI email assistant. Resolve vague references using common sense (e.g., "tomorrow" = next day, "him" = the person mentioned). Only add specificity where the original is genuinely ambiguous. Do NOT ask questions. Return the improved prompt directly. User's prompt: "${prompt}"`,
    draft: `The user has given a rough idea for an email. Generate a complete, professional draft based on their idea. Include subject line and body. User's idea: "${prompt}"`,
  };

  try {
    const res = await fetch("/api/ai/compose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "write", prompt: modePrompts[mode] }),
    });
    if (!res.ok) return prompt;
    const data = await res.json();
    return data.result || prompt;
  } catch {
    return prompt;
  }
}
