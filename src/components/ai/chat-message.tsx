"use client";

import { Sparkles, User, Search, Mail, Send, Calendar, Contact, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToolCall } from "@/lib/ai/tools";

const TOOL_ICONS: Record<string, typeof Search> = {
  search_emails: Search,
  read_email: Mail,
  send_email: Send,
  reply_to_email: Send,
  create_event: Calendar,
  search_events: Calendar,
  list_contacts: Contact,
  get_inbox_summary: BarChart3,
};

const TOOL_LABELS: Record<string, string> = {
  search_emails: "Searched emails",
  read_email: "Read email",
  send_email: "Sent email",
  reply_to_email: "Replied to email",
  create_event: "Created event",
  search_events: "Searched calendar",
  list_contacts: "Searched contacts",
  get_inbox_summary: "Got inbox summary",
};

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
  isStreaming?: boolean;
}

export function ChatMessage({ role, content, toolCalls, isStreaming }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div className={cn("flex gap-3 px-4", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="size-4 text-primary" />
        </div>
      )}

      <div className={cn("max-w-[80%] space-y-2", isUser && "order-first")}>
        {/* Tool calls */}
        {toolCalls && toolCalls.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {toolCalls.map((tc, i) => {
              const Icon = TOOL_ICONS[tc.name] || Sparkles;
              return (
                <div
                  key={i}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted text-xs text-muted-foreground"
                >
                  <Icon className="size-3" />
                  {TOOL_LABELS[tc.name] || tc.name}
                </div>
              );
            })}
          </div>
        )}

        {/* Message content */}
        <div
          className={cn(
            "rounded-lg px-3 py-2 text-sm",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground",
          )}
        >
          {isStreaming && !content ? (
            <div className="flex items-center gap-1.5">
              <div className="size-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="size-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="size-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          ) : (
            <div className="whitespace-pre-wrap break-words">{content}</div>
          )}
        </div>
      </div>

      {isUser && (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
          <User className="size-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
