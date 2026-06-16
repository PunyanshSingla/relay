"use client";

import { useRef, useCallback, useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import type { Email, Priority, Category } from "@/types/email";
import { formatDistanceToNow } from "@/lib/format-date";

const PRIORITY_COLORS: Record<Priority, string> = {
  P1: "bg-red-500",
  P2: "bg-amber-500",
  P3: "bg-gray-400",
};

const CATEGORY_CONFIG: Record<Category, { badge: string; label: string }> = {
  action_needed: { badge: "bg-red-500/10 text-red-500 border-red-500/20", label: "Action Needed" },
  meeting: { badge: "bg-purple-500/10 text-purple-500 border-purple-500/20", label: "Meeting" },
  follow_up: { badge: "bg-amber-500/10 text-amber-500 border-amber-500/20", label: "Follow-up" },
  fyi: { badge: "bg-gray-500/10 text-gray-500 border-gray-500/20", label: "FYI" },
  newsletter: { badge: "bg-blue-500/10 text-blue-500 border-blue-500/20", label: "Newsletter" },
  promotion: { badge: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", label: "Promotion" },
  social: { badge: "bg-pink-500/10 text-pink-500 border-pink-500/20", label: "Social" },
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
  onArchive?: () => void;
  onDelete?: () => void;
}

export function ThreadView({ email, onToggleStar, onReply, onReplyAll, onForward, onArchive, onDelete }: ThreadViewProps) {
  const avatarColor = getAvatarColor(email.from.name);
  const priorityColor = PRIORITY_COLORS[email.priority];
  const categoryConfig = CATEGORY_CONFIG[email.category];
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [replies, setReplies] = useState<Email["replies"]>(email.replies);
  const [repliesLoading, setRepliesLoading] = useState(false);

  useEffect(() => {
    if (email.replies.length > 0) return;
    setRepliesLoading(true);
    fetch(`/api/emails/${email.id}/replies`)
      .then((r) => r.json())
      .then((data) => setReplies(data.replies ?? []))
      .catch(() => {})
      .finally(() => setRepliesLoading(false));
  }, [email.id, email.replies.length]);
  const [replyMode, setReplyMode] = useState<"short" | "professional" | "friendly" | "generate">("professional");

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
              {categoryConfig && (
                <Badge
                  variant="outline"
                  className={cn("text-[10px] px-1.5 py-0 h-5 font-medium", categoryConfig.badge)}
                >
                  {categoryConfig.label}
                </Badge>
              )}
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
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <p className="text-sm">No preview available</p>
          </div>
        )}

        {/* Attachments */}
        {email.attachments && email.attachments.length > 0 && (
          <div className="mt-4 space-y-1">
            {email.attachments.map((att) => (
              <a
                key={att.id}
                href={`/api/emails/${email.id}/attachments/${att.id}`}
                download={att.filename}
                className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/50 hover:bg-muted transition-colors text-sm text-foreground no-underline"
              >
                <Paperclip className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{att.filename}</span>
                {att.size > 0 && (
                  <span className="text-xs text-muted-foreground shrink-0 ml-auto">
                    {att.size > 1024 * 1024
                      ? `${(att.size / (1024 * 1024)).toFixed(1)} MB`
                      : `${(att.size / 1024).toFixed(0)} KB`}
                  </span>
                )}
              </a>
            ))}
          </div>
        )}

        {/* Thread replies */}
        {repliesLoading && (
          <div className="mt-6 space-y-3">
            <Separator />
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="pl-4 border-l-2 border-border space-y-2">
                <div className="h-3 w-32 bg-muted rounded animate-pulse" />
                <div className="h-3 w-full bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        )}

        {replies.length > 0 && (
          <div className="mt-6 space-y-4">
            <Separator />
            {replies.map((reply) => (
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
          <AIReplyPanel
            emailId={email.id}
            activeMode={replyMode}
            onModeChange={setReplyMode}
          />
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
            <Button variant="outline" size="sm" onClick={onArchive}>
              <Archive className="size-4 mr-1" />
              Archive
            </Button>
          </TooltipTrigger>
          <TooltipContent>Archive (E)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive">
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
