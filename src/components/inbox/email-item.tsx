"use client";

import { useCallback } from "react";
import { Star, Paperclip, Archive, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { mutate } from "swr";
import { cn } from "@/lib/utils";
import type { Email, Priority, Category } from "@/types/email";
import { formatDistanceToNow } from "@/lib/format-date";

function decodeHtmlEntities(text: string): string {
  const el = document.createElement("textarea");
  el.innerHTML = text;
  return el.value;
}

const PRIORITY_CONFIG: Record<Priority, { dot: string; badge: string; label: string }> = {
  P1: { dot: "bg-red-500", badge: "bg-red-500/10 text-red-500 border-red-500/20", label: "P1" },
  P2: { dot: "bg-amber-500", badge: "bg-amber-500/10 text-amber-500 border-amber-500/20", label: "P2" },
  P3: { dot: "bg-gray-400", badge: "bg-gray-500/10 text-gray-500 border-gray-500/20", label: "P3" },
};

const CATEGORY_CONFIG: Record<Category, { badge: string; label: string }> = {
  action_needed: { badge: "bg-red-500/10 text-red-500 border-red-500/20", label: "Action" },
  meeting: { badge: "bg-purple-500/10 text-purple-500 border-purple-500/20", label: "Meeting" },
  follow_up: { badge: "bg-amber-500/10 text-amber-500 border-amber-500/20", label: "Follow-up" },
  fyi: { badge: "bg-gray-500/10 text-gray-500 border-gray-500/20", label: "FYI" },
  newsletter: { badge: "bg-blue-500/10 text-blue-500 border-blue-500/20", label: "News" },
  promotion: { badge: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", label: "Promo" },
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
    "bg-indigo-500/20 text-indigo-500",
    "bg-teal-500/20 text-teal-500",
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

interface EmailItemProps {
  email: Email;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onToggleStar: (id: string) => void;
  onArchive: (id: string) => void;
  onTrash: (id: string) => void;
}

export function EmailItem({ email, isSelected, onSelect, onToggleStar, onArchive, onTrash }: EmailItemProps) {
  const priorityConfig = email.priority ? PRIORITY_CONFIG[email.priority] : null;
  const categoryConfig = email.category ? CATEGORY_CONFIG[email.category] : null;
  const avatarColor = getAvatarColor(email.from.name);
  const timeAgo = formatDistanceToNow(email.timestamp);

  const handlePrefetch = useCallback(() => {
    mutate(`/api/emails/${email.id}`);
  }, [email.id]);

  return (
    <button
      onClick={() => onSelect(email.id)}
      onMouseEnter={handlePrefetch}
      className={cn(
        "group relative flex w-full items-start gap-3 p-3 text-left transition-colors border-b border-border",
        isSelected
          ? "bg-primary/5 border-l-2 border-l-primary"
          : "hover:bg-muted/50 border-l-2 border-l-transparent",
        !email.read && "bg-muted/30"
      )}
    >
      {/* Unread indicator + Priority dot */}
      <div className="flex flex-col items-center gap-1 pt-1">
        {!email.read && (
          <div className="size-2 rounded-full bg-primary shrink-0" />
        )}
        {priorityConfig && (
          <div className={cn("size-2 rounded-full shrink-0", priorityConfig.dot)} />
        )}
      </div>

      {/* Avatar */}
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-medium",
          avatarColor
        )}
      >
        {getInitials(email.from.name)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-sm truncate",
              !email.read ? "font-semibold text-foreground" : "text-muted-foreground"
            )}
          >
            {email.from.name}
          </span>
          <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline">{timeAgo}</span>
        </div>
        <p
          className={cn(
            "text-sm truncate mt-0.5",
            !email.read ? "font-medium text-foreground" : "text-muted-foreground"
          )}
          title={decodeHtmlEntities(email.subject)}
        >
          {decodeHtmlEntities(email.subject)}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5" title={decodeHtmlEntities(email.preview)}>
          {decodeHtmlEntities(email.preview).length > 120 ? decodeHtmlEntities(email.preview).slice(0, 120) + "..." : decodeHtmlEntities(email.preview)}
        </p>
      </div>

      {/* Right side: badges + star */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleStar(email.id);
          }}
          className="text-muted-foreground hover:text-amber-500 transition-colors"
        >
          <Star
            className={cn("size-4", email.starred && "fill-amber-500 text-amber-500")}
          />
        </button>
        {!email.isClassified ? (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 h-4 font-medium bg-muted text-muted-foreground border-muted animate-pulse hidden sm:inline-flex"
          >
            Processing...
          </Badge>
        ) : (
          <>
            {priorityConfig && (
              <Badge
                variant="outline"
                className={cn("text-[10px] px-1.5 py-0 h-4 font-medium hidden sm:inline-flex", priorityConfig.badge)}
              >
                {priorityConfig.label}
              </Badge>
            )}
            {categoryConfig && (
              <Badge
                variant="outline"
                className={cn("text-[10px] px-1.5 py-0 h-4 font-medium hidden sm:inline-flex", categoryConfig.badge)}
              >
                {categoryConfig.label}
              </Badge>
            )}
          </>
        )}
        {email.hasAttachment && (
          <Paperclip className="size-3 text-muted-foreground hidden sm:block" />
        )}
      </div>

      {/* Hover action buttons — Gmail-style */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5 bg-card border border-border rounded-lg shadow-sm p-0.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onArchive(email.id);
          }}
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Archive"
        >
          <Archive className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onTrash(email.id);
          }}
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive transition-colors"
          title="Delete"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </button>
  );
}
