"use client";

import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Trash2,
  Wand2,
  MessageCircle,
  FileText,
  ArrowLeft,
  Mail,
  Calendar,
  Send,
  Search,
  Inbox,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChatInput } from "@/components/ai/chat-input";
import { ChatMessage } from "@/components/ai/chat-message";
import { DraftCard } from "@/components/ai/draft-card";
import { ReviewModeToggle } from "@/components/ai/review-mode-toggle";
import { useChat } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";
import type { EnhanceMode } from "@/lib/ai/prompt-enhance";

const ENHANCE_MODES: {
  id: EnhanceMode;
  label: string;
  icon: typeof Sparkles;
  description: string;
}[] = [
  {
    id: "none",
    label: "Agent",
    icon: Sparkles,
    description: "Full AI agent — search, send, schedule",
  },
  {
    id: "simple",
    label: "Enhance",
    icon: Wand2,
    description: "Improve your prompt for better results",
  },
  {
    id: "clarity",
    label: "Clarify",
    icon: MessageCircle,
    description: "Resolve vague refs, add specificity",
  },
  {
    id: "draft",
    label: "Draft",
    icon: FileText,
    description: "Generate a full draft from your idea",
  },
];

const SUGGESTIONS = [
  {
    icon: Inbox,
    text: "Summarize my unread emails",
    color: "text-blue-500",
  },
  {
    icon: Mail,
    text: "Reply to the latest email from GitHub",
    color: "text-violet-500",
  },
  {
    icon: Calendar,
    text: "What's on my calendar this week?",
    color: "text-orange-500",
  },
  {
    icon: Send,
    text: "Draft an email to sarah@company.com about the project update",
    color: "text-emerald-500",
  },
  {
    icon: Search,
    text: "Find emails about the budget from last month",
    color: "text-cyan-500",
  },
];

export default function AiChatPage() {
  const router = useRouter();
  const {
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
  } = useChat();
  const [enhanceMode, setEnhanceMode] = useState<EnhanceMode>("none");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const handleSend = (content: string) => {
    sendMessage(content, enhanceMode);
  };

  const handleRegenerate = () => {
    regenerateMessage(enhanceMode);
  };

  const handleEdit = (messageId: string, newContent: string) => {
    editAndResend(messageId, newContent, enhanceMode);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => router.back()}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="size-4 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-semibold">AI Command Center</h1>
            <p className="text-xs text-muted-foreground">
              Search, send, schedule, and manage your inbox
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ReviewModeToggle mode={reviewMode} onChange={updateReviewMode} />
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearMessages}
              className="text-xs text-muted-foreground"
            >
              <Trash2 className="size-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Mode selector */}
      <div className="flex items-center gap-1.5 px-4 py-2 border-b border-border bg-card shrink-0 overflow-x-auto">
        {ENHANCE_MODES.map((mode) => {
          const Icon = mode.icon;
          return (
            <button
              type="button"
              key={mode.id}
              onClick={() => setEnhanceMode(mode.id)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
                enhanceMode === mode.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              title={mode.description}
            >
              <Icon className="size-3" />
              {mode.label}
            </button>
          );
        })}
        {enhanceMode !== "none" && (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 h-4 ml-1"
          >
            {ENHANCE_MODES.find((m) => m.id === enhanceMode)?.description}
          </Badge>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground px-4">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/5 mb-4">
              <Sparkles className="size-7 text-primary/40" />
            </div>
            <h2 className="text-lg font-medium mb-1">
              What can I help you with?
            </h2>
            <p className="text-sm mb-6 text-center max-w-md">
              {reviewMode === "review"
                ? "I'll draft emails for your review, search your inbox, create events, and more."
                : "I'll send emails directly, search your inbox, create events, and more."}
            </p>
            <div className="flex flex-wrap gap-2 max-w-xl justify-center">
              {SUGGESTIONS.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    type="button"
                    key={s.text}
                    onClick={() => handleSend(s.text)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Icon className={cn("size-3.5", s.color)} />
                    {s.text}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={msg.id}>
              <ChatMessage
                role={msg.role}
                content={msg.content}
                toolCalls={msg.toolCalls}
                isStreaming={
                  loading &&
                  msg.role === "assistant" &&
                  msg.id === messages[messages.length - 1]?.id &&
                  !msg.draft &&
                  !msg.sentEmail
                }
                isLast={idx === messages.length - 1}
                sentEmail={msg.sentEmail}
                onRegenerate={
                  msg.role === "assistant" && idx === messages.length - 1
                    ? handleRegenerate
                    : undefined
                }
                onEdit={
                  msg.role === "user" && idx === messages.length - 1
                    ? (newContent) => handleEdit(msg.id, newContent)
                    : undefined
                }
              />
              {msg.draft && (
                <div className="px-4 mt-2">
                  <DraftCard
                    draft={msg.draft}
                    onSend={sendDraft}
                    onDiscard={() => discardDraft(msg.id)}
                    isStreaming={
                      loading &&
                      !!msg.streamingBody &&
                      idx === messages.length - 1
                    }
                  />
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
            <Button
              variant="outline"
              size="sm"
              onClick={stopGeneration}
              className="text-xs shadow-md"
            >
              Stop generating
            </Button>
          </div>
        )}
        <ChatInput onSend={handleSend} disabled={loading} />
      </div>
    </div>
  );
}
