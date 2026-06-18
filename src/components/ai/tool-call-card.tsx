"use client";

import { useState } from "react";
import {
  Search,
  Mail,
  Send,
  Calendar,
  Contact,
  BarChart3,
  ChevronDown,
  ExternalLink,
  Check,
  X,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToolCall } from "@/lib/ai/tools";

const TOOL_CONFIG: Record<
  string,
  { icon: typeof Search; label: string; color: string }
> = {
  search_emails: { icon: Search, label: "Searched emails", color: "text-blue-500" },
  read_email: { icon: Mail, label: "Read email", color: "text-violet-500" },
  draft_email: { icon: Send, label: "Draft created", color: "text-green-500" },
  draft_reply: { icon: Send, label: "Reply drafted", color: "text-green-500" },
  send_email: { icon: Send, label: "Email sent", color: "text-emerald-500" },
  create_event: { icon: Calendar, label: "Event created", color: "text-orange-500" },
  search_events: { icon: Calendar, label: "Searched calendar", color: "text-orange-500" },
  list_contacts: { icon: Contact, label: "Searched contacts", color: "text-cyan-500" },
  get_inbox_summary: { icon: BarChart3, label: "Inbox summary", color: "text-pink-500" },
};

function ToolCallResult({ toolCall }: { toolCall: ToolCall }) {
  const hasError = toolCall.result?.error;

  if (!toolCall.result) return null;

  if (hasError) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-destructive">
        <X className="size-3" />
        {String(toolCall.result.error)}
      </div>
    );
  }

  const result = toolCall.result as Record<string, unknown>;

  if (toolCall.name === "search_emails" && Array.isArray(result)) {
    return (
      <div className="space-y-1.5">
        {result.slice(0, 5).map((email: Record<string, string>, i: number) => (
          <a
            key={email.id ?? `email-${i}`}
            href={`/dashboard/inbox/${email.id}`}
            className="flex items-start gap-2 p-1.5 rounded-md hover:bg-muted/50 transition-colors group"
          >
            <Mail className="size-3 mt-0.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium truncate">{email.subject}</span>
                <ExternalLink className="size-2.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
              </div>
              <span className="text-[10px] text-muted-foreground">
                {email.from} — {email.preview}
              </span>
            </div>
          </a>
        ))}
      </div>
    );
  }

  if (toolCall.name === "search_events" && Array.isArray(result)) {
    return (
      <div className="space-y-1.5">
        {result.slice(0, 5).map((event: Record<string, string>, i: number) => (
          <div key={event.id ?? `event-${i}`} className="flex items-start gap-2 p-1.5 rounded-md bg-muted/30">
            <Calendar className="size-3 mt-0.5 shrink-0 text-orange-500" />
            <div>
              <span className="text-xs font-medium">{event.summary}</span>
              <span className="text-[10px] text-muted-foreground block">
                {new Date(event.start).toLocaleString()} — {new Date(event.end).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (toolCall.name === "list_contacts" && Array.isArray(result)) {
    return (
      <div className="space-y-1.5">
        {result.slice(0, 5).map((contact: Record<string, string>, i: number) => (
          <div key={contact.email ?? `contact-${i}`} className="flex items-center gap-2 p-1.5 rounded-md bg-muted/30">
            <Contact className="size-3 shrink-0 text-cyan-500" />
            <span className="text-xs font-medium">{contact.name}</span>
            <span className="text-[10px] text-muted-foreground">{contact.email}</span>
          </div>
        ))}
      </div>
    );
  }

  if (toolCall.name === "send_email") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
        <Check className="size-3" />
        <span>
          Sent to {String(toolCall.args?.to)}
          {toolCall.args?.subject ? ` — "${toolCall.args.subject}"` : ""}
        </span>
      </div>
    );
  }

  if (toolCall.name === "create_event" && result.success) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-orange-600 dark:text-orange-400">
        <Check className="size-3" />
        <span>Event "{String(toolCall.args?.summary)}" created</span>
      </div>
    );
  }

  if (toolCall.name === "get_inbox_summary") {
    return (
      <div className="grid grid-cols-3 gap-2">
        {Object.entries(result).map(([key, value]) => (
          <div key={key} className="text-center p-1.5 rounded-md bg-muted/30">
            <div className="text-xs font-semibold">{String(value)}</div>
            <div className="text-[10px] text-muted-foreground capitalize">
              {key.replace(/([A-Z])/g, " $1").trim()}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

interface ToolCallCardProps {
  toolCall: ToolCall;
}

export function ToolCallCard({ toolCall }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false);
  const config = TOOL_CONFIG[toolCall.name] || {
    icon: Sparkles,
    label: toolCall.name,
    color: "text-muted-foreground",
  };
  const Icon = config.icon;
  const hasResult = toolCall.result && !toolCall.result.error;

  return (
    <div className="mx-4">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors w-full",
          "bg-muted/50 hover:bg-muted",
          expanded && "rounded-b-none"
        )}
      >
        <Icon className={cn("size-3", config.color)} />
        <span className="text-muted-foreground">{config.label}</span>
        {hasResult && (
          <ChevronDown
            className={cn(
              "size-3 text-muted-foreground transition-transform ml-auto",
              expanded && "rotate-180"
            )}
          />
        )}
      </button>
      {expanded && hasResult && (
        <div className="border border-t-0 border-border rounded-b-lg p-2 bg-muted/20">
          <ToolCallResult toolCall={toolCall} />
        </div>
      )}
    </div>
  );
}
