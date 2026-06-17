"use client";

import { useState, useRef } from "react";
import {
  Sparkles,
  User,
  RefreshCw,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ToolCallCard } from "./tool-call-card";
import type { ToolCall } from "@/lib/ai/tools";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
  isStreaming?: boolean;
  isLast?: boolean;
  onRegenerate?: () => void;
  onEdit?: (newContent: string) => void;
  sentEmail?: { to: string; subject: string };
}

export function ChatMessage({
  role,
  content,
  toolCalls,
  isStreaming,
  isLast,
  onRegenerate,
  onEdit,
  sentEmail,
}: ChatMessageProps) {
  const isUser = role === "user";
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleStartEdit = () => {
    setEditContent(content);
    setEditing(true);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleConfirmEdit = () => {
    if (editContent.trim() && editContent !== content) {
      onEdit?.(editContent.trim());
    }
    setEditing(false);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setEditContent(content);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleConfirmEdit();
    }
    if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  const showActions =
    !isStreaming && content && !editing;

  return (
    <div className={cn("flex gap-3 px-4 group", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="size-4 text-primary" />
        </div>
      )}

      <div className={cn("max-w-[80%] space-y-2", isUser && "order-first")}>
        {/* Tool calls (non-draft, non-send) */}
        {toolCalls && toolCalls.length > 0 && (
          <div className="space-y-1.5">
            {toolCalls
              .filter(
                (tc) =>
                  tc.name !== "draft_email" &&
                  tc.name !== "draft_reply" &&
                  tc.result !== undefined
              )
              .map((tc, i) => (
                <ToolCallCard key={i} toolCall={tc} />
              ))}
          </div>
        )}

        {/* Sent email confirmation */}
        {sentEmail && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs">
            <Check className="size-3" />
            Sent to {sentEmail.to}
          </div>
        )}

        {/* Message content */}
        {content && (
          <div className="relative">
            {editing ? (
              <div className="space-y-1.5">
                <Textarea
                  ref={textareaRef}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onKeyDown={handleEditKeyDown}
                  className="min-h-[60px] text-sm resize-none"
                />
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="default"
                    className="h-6 text-xs"
                    onClick={handleConfirmEdit}
                  >
                    <Check className="size-3 mr-1" />
                    Send
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-xs"
                    onClick={handleCancelEdit}
                  >
                    <X className="size-3 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className={cn(
                  "rounded-lg px-3 py-2 text-sm",
                  isUser
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                )}
              >
                {isStreaming && !content ? (
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="size-3 animate-pulse" />
                    <span className="text-xs text-muted-foreground">
                      Thinking...
                    </span>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap break-words">
                    {content}
                  </div>
                )}
              </div>
            )}

            {/* Hover actions */}
            {showActions && !isUser && onRegenerate && isLast && !sentEmail && (
              <div className="absolute -right-1 -top-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 bg-background border border-border shadow-sm"
                  onClick={onRegenerate}
                  title="Regenerate response"
                >
                  <RefreshCw className="size-3" />
                </Button>
              </div>
            )}
            {showActions && isUser && onEdit && isLast && (
              <div className="absolute -right-1 -top-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 bg-background border border-border shadow-sm"
                  onClick={handleStartEdit}
                  title="Edit message"
                >
                  <Pencil className="size-3" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
          <User className="size-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
