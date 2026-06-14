"use client";

import { useRef, useCallback } from "react";
import {
  Reply,
  Forward,
  Archive,
  Trash2,
  Star,
  MoreHorizontal,
  Paperclip,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import DOMPurify from "dompurify";
import { AIReplyPanel } from "./ai-reply-panel";
import type { Email, Priority } from "@/types/email";
import { formatDistanceToNow } from "@/lib/format-date";

const PRIORITY_COLORS: Record<Priority, string> = {
  P1: "bg-red-500",
  P2: "bg-amber-500",
  P3: "bg-gray-400",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string): string {
  const colors = [
    "bg-red-500/20 text-red-500",
    "bg-blue-500/20 text-blue-500",
    "bg-emerald-500/20 text-emerald-500",
    "bg-purple-500/20 text-purple-500",
    "bg-amber-500/20 text-amber-500",
    "bg-pink-500/20 text-pink-500",
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

interface ThreadViewProps {
  email: Email;
  onToggleStar: (id: string) => void;
  onReply?: (email: Email) => void;
  onReplyAll?: (email: Email) => void;
  onForward?: (email: Email) => void;
}

export function ThreadView({ email, onToggleStar, onReply, onReplyAll, onForward }: ThreadViewProps) {
  const avatarColor = getAvatarColor(email.from.name);
  const priorityColor = PRIORITY_COLORS[email.priority];
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleIframeLoad = useCallback(() => {
    const iframe = iframeRef.current;
    if (iframe?.contentDocument?.body) {
      const height = iframe.contentDocument.body.scrollHeight;
      iframe.style.height = Math.max(height + 2, 200) + "px";
    }
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-border">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-medium",
              avatarColor
            )}
          >
            {getInitials(email.from.name)}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{email.subject}</h2>
              <div className={cn("size-2 rounded-full", priorityColor)} />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{email.from.name}</span>
              <span>&lt;{email.from.email}&gt;</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>To: {email.to.map((t) => t.name).join(", ")}</span>
              {email.cc && email.cc.length > 0 && (
                <span>· Cc: {email.cc.map((c) => c.name).join(", ")}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground mr-2">
            {formatDistanceToNow(email.timestamp)}
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => onToggleStar(email.id)}
              >
                <Star
                  className={cn(
                    "size-4",
                    email.starred && "fill-amber-500 text-amber-500"
                  )}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{email.starred ? "Unstar" : "Star"}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>More actions</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Email Body */}
      <div className="flex-1 overflow-y-auto p-4">
        {email.bodyHtml ? (
          <iframe
            ref={iframeRef}
            srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;padding:12px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.5;color:#1a1a1a;}img{max-width:100%;height:auto;}a{color:#0066cc;text-decoration:underline;}table{border-collapse:separate;}td,th{padding:4px 8px;}blockquote{border-left:3px solid #ddd;padding-left:12px;margin:0 0 0 0;color:#555;}</style></head><body>${DOMPurify.sanitize(email.bodyHtml, { ADD_TAGS: ["style"], ADD_ATTR: ["target", "style"] })}</body></html>`}
            sandbox="allow-same-origin"
            className="w-full border-0 bg-white"
            style={{ minHeight: "200px" }}
            onLoad={handleIframeLoad}
          />
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {email.body}
            </div>
          </div>
        )}

        {/* Attachments */}
        {email.hasAttachment && (
          <div className="mt-4 p-3 rounded-lg border border-border bg-muted/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Paperclip className="size-4" />
              <span>1 attachment</span>
            </div>
          </div>
        )}

        {/* Thread replies */}
        {email.replies.length > 0 && (
          <div className="mt-6 space-y-4">
            <Separator />
            {email.replies.map((reply) => (
              <div key={reply.id} className="pl-4 border-l-2 border-border">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{reply.from.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(reply.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{reply.body}</p>
              </div>
            ))}
          </div>
        )}

        {/* AI Reply Panel */}
        <div className="mt-6">
          <AIReplyPanel activeMode="professional" onModeChange={() => {}} />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 p-4 border-t border-border">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" onClick={() => onReply?.(email)}>
              <Reply className="size-4 mr-1" />
              Reply
            </Button>
          </TooltipTrigger>
          <TooltipContent>Reply (R)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" onClick={() => onReplyAll?.(email)}>
              <Reply className="size-4 mr-1" />
              Reply All
            </Button>
          </TooltipTrigger>
          <TooltipContent>Reply All (Shift+R)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" onClick={() => onForward?.(email)}>
              <Forward className="size-4 mr-1" />
              Forward
            </Button>
          </TooltipTrigger>
          <TooltipContent>Forward (F)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm">
              <Archive className="size-4 mr-1" />
              Archive
            </Button>
          </TooltipTrigger>
          <TooltipContent>Archive (E)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
              <Trash2 className="size-4 mr-1" />
              Delete
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
