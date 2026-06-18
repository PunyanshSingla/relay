"use client";

import { useState, useCallback, useRef } from "react";
import type { ToolCall, DraftResult } from "@/lib/ai/tools";
import { enhancePrompt, type EnhanceMode } from "@/lib/ai/prompt-enhance";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
  draft?: DraftResult;
  streamingBody?: string;
  sentEmail?: { to: string; subject: string };
}

export type ReviewMode = "review" | "auto";

const MAX_RETRIES = 3;

function applyToolCallDelta(
  data: { name: string; body: string | null; to: string | null; subject: string | null },
  prev: Message
): Partial<Message> {
  const updates: Partial<Message> = {};

  if (data.body !== null) {
    updates.streamingBody = data.body;
  }

  const hasPartialData =
    data.body !== null || data.to !== null || data.subject !== null;

  if (hasPartialData) {
    if (prev.draft) {
      const merged = { ...prev.draft };
      if (data.body !== null) merged.body = data.body;
      if (data.to !== null) merged.to = data.to;
      if (data.subject !== null) merged.subject = data.subject;
      updates.draft = merged;
    } else {
      const isReply = data.name === "draft_reply" || data.name === "send_email";
      updates.draft = {
        draft: true,
        type: isReply ? "reply" : "email",
        to: data.to || "",
        subject: data.subject || "",
        body: data.body || "",
        replyToId: isReply ? undefined : undefined,
      };
    }
  }

  return updates;
}

function applyToolCall(
  data: { name: string; args: Record<string, unknown>; result?: unknown },
  prev: Message
): Partial<Message> {
  const newToolCalls = [...(prev.toolCalls || []), data];

  let draft = data.result?.draft ? (data.result as DraftResult) : undefined;
  if (!draft && data.name === "draft_email" && data.args?.to) {
    draft = {
      draft: true,
      type: "email",
      to: data.args.to as string,
      subject: (data.args.subject as string) || "",
      body: (data.args.body as string) || prev.streamingBody || "",
    };
  }
  if (!draft && data.name === "draft_reply" && data.args?.emailId) {
    draft = {
      draft: true,
      type: "reply",
      to: "",
      subject: "",
      body: (data.args.body as string) || prev.streamingBody || "",
      replyToId: data.args.emailId as string,
    };
  }
  if (!draft && data.result?.draft && prev.draft) {
    draft = data.result as DraftResult;
  }

  let sentEmail = prev.sentEmail;
  if (data.name === "send_email" && data.result?.success) {
    sentEmail = {
      to: data.args?.to as string,
      subject: data.args?.subject as string,
    };
  }

  return {
    toolCalls: newToolCalls,
    draft: draft || prev.draft,
    sentEmail,
    streamingBody: undefined,
  };
}

async function processStream(
  res: Response,
  assistantId: string,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  abortController: AbortController
): Promise<void> {
  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response stream");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    if (abortController.signal.aborted) break;
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
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + data } : m
            )
          );
        }

        if (event === "tool_call_delta") {
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== assistantId) return m;
              return { ...m, ...applyToolCallDelta(data, m) };
            })
          );
        }

        if (event === "tool_call") {
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== assistantId) return m;
              return { ...m, ...applyToolCall(data, m) };
            })
          );
        }
      } catch {
        // skip malformed lines
      }
    }
  }
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [reviewMode, setReviewMode] = useState<ReviewMode>(() => {
    if (typeof window !== "undefined") {
      return (
        (localStorage.getItem("ai-review-mode") as ReviewMode) || "review"
      );
    }
    return "review";
  });
  const abortRef = useRef<AbortController | null>(null);

  const updateReviewMode = useCallback((mode: ReviewMode) => {
    setReviewMode(mode);
    localStorage.setItem("ai-review-mode", mode);
  }, []);

  const streamRequest = useCallback(
    async (
      assistantId: string,
      body: {
        message: string;
        history: Array<{ role: string; content: string }>;
        mode: string;
      }
    ) => {
      const controller = new AbortController();
      abortRef.current = controller;

      let lastError: Error | null = null;
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      let aborted = false;
      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`Chat request failed (${res.status})`);

        await processStream(res, assistantId, setMessages, controller);
        lastError = null;
        break;
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          lastError = err as Error;
          aborted = true;
        } else {
          lastError = err as Error;
          console.warn(
            `[chat] Attempt ${attempt + 1} failed:`,
            lastError.message
          );

          if (attempt < MAX_RETRIES - 1) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? {
                      ...m,
                      content: "",
                      toolCalls: [],
                      draft: undefined,
                      streamingBody: undefined,
                    }
                  : m
              )
            );
            await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
          }
        }
      }
      if (aborted) break;
      }

      if (lastError) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content:
                    "Sorry, something went wrong after retries. Please try again.",
                }
              : m
          )
        );
      }
    },
    []
  );

  const sendMessage = useCallback(
    async (content: string, enhanceMode: EnhanceMode) => {
      if (loading) return;

      let finalMessage = content;
      if (enhanceMode !== "none") {
        finalMessage = await enhancePrompt(content, enhanceMode);
      }

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: finalMessage,
      };
      const assistantId = crypto.randomUUID();

      setMessages((prev) => [
        ...prev,
        userMessage,
        { id: assistantId, role: "assistant", content: "", toolCalls: [] },
      ]);
      setLoading(true);

      const history = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      try {
        await streamRequest(assistantId, {
          message: finalMessage,
          history,
          mode: reviewMode,
        });
      } catch {
        // error handled
      }
      setLoading(false);
      abortRef.current = null;
    },
    [loading, messages, reviewMode, streamRequest]
  );

  const sendDraft = useCallback(async (draft: DraftResult) => {
    try {
      const formData = new FormData();
      formData.set("to", draft.to);
      formData.set("subject", draft.subject);
      formData.set("bodyHtml", draft.body);
      if (draft.threadId) formData.set("threadId", draft.threadId);
      if (draft.replyToId) formData.set("replyToId", draft.replyToId);

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
            sentEmail: { to: draft.to, subject: draft.subject },
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

  const discardDraft = useCallback((messageId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, draft: undefined } : m))
    );
  }, []);

  const regenerateMessage = useCallback(
    async (enhanceMode: EnhanceMode) => {
      if (loading) return;

      const lastUserMsg = [...messages]
        .reverse()
        .find((m) => m.role === "user");
      if (!lastUserMsg) return;

      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.id === lastUserMsg.id);
        return prev.slice(0, idx + 1);
      });

      const assistantId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "", toolCalls: [] },
      ]);
      setLoading(true);

      const history = messages
        .slice(
          0,
          messages.findIndex((m) => m.id === lastUserMsg.id) + 1
        )
        .map((m) => ({ role: m.role, content: m.content }));

      try {
        await streamRequest(assistantId, {
          message: lastUserMsg.content,
          history,
          mode: reviewMode,
        });
      } catch {
        // error handled
      }
      setLoading(false);
      abortRef.current = null;
    },
    [loading, messages, reviewMode, streamRequest]
  );

  const editAndResend = useCallback(
    async (
      messageId: string,
      newContent: string,
      enhanceMode: EnhanceMode
    ) => {
      if (loading) return;

      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.id === messageId);
        return prev.slice(0, idx);
      });

      setLoading(true);

      let finalMessage = newContent;
      if (enhanceMode !== "none") {
        finalMessage = await enhancePrompt(newContent, enhanceMode);
      }

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: finalMessage,
      };
      const assistantId = crypto.randomUUID();

      setMessages((prev) => [
        ...prev,
        userMessage,
        { id: assistantId, role: "assistant", content: "", toolCalls: [] },
      ]);

      const history = messages
        .slice(
          0,
          messages.findIndex((m) => m.id === messageId)
        )
        .concat(userMessage)
        .map((m) => ({ role: m.role, content: m.content }));

      try {
        await streamRequest(assistantId, {
          message: finalMessage,
          history,
          mode: reviewMode,
        });
      } catch {
        // error handled
      }
      setLoading(false);
      abortRef.current = null;
    },
    [loading, messages, reviewMode, streamRequest]
  );

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
    setLoading(false);
  }, []);

  const clearMessages = useCallback(() => setMessages([]), []);

  return {
    messages,
    loading,
    reviewMode,
    updateReviewMode,
    sendMessage,
    sendDraft,
    discardDraft,
    regenerateMessage,
    editAndResend,
    stopGeneration,
    clearMessages,
  };
}
