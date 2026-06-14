"use client";

import { Star, Paperclip } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Email, Priority } from "@/types/email";
import { formatDistanceToNow } from "@/lib/format-date";

const PRIORITY_CONFIG: Record<Priority, { dot: string; badge: string; label: string }> = {
  P1: { dot: "bg-red-500", badge: "bg-red-500/10 text-red-500 border-red-500/20", label: "P1" },
  P2: { dot: "bg-amber-500", badge: "bg-amber-500/10 text-amber-500 border-amber-500/20", label: "P2" },
  P3: { dot: "bg-gray-400", badge: "bg-gray-500/10 text-gray-500 border-gray-500/20", label: "P3" },
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
}

export function EmailItem({ email, isSelected, onSelect, onToggleStar }: EmailItemProps) {
  const priorityConfig = email.priority ? PRIORITY_CONFIG[email.priority] : null;
  const avatarColor = getAvatarColor(email.from.name);
  const timeAgo = formatDistanceToNow(email.timestamp);

  return (
    <button
      onClick={() => onSelect(email.id)}
      className={cn(
        "flex w-full items-start gap-3 p-3 text-left transition-colors border-b border-border",
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
          <span className="text-xs text-muted-foreground shrink-0">{timeAgo}</span>
        </div>
        <p
          className={cn(
            "text-sm truncate mt-0.5",
            !email.read ? "font-medium text-foreground" : "text-muted-foreground"
          )}
        >
          {email.subject}
        </p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{email.preview}</p>
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
        {priorityConfig && (
          <Badge
            variant="outline"
            className={cn("text-[10px] px-1.5 py-0 h-4 font-medium", priorityConfig.badge)}
          >
            {priorityConfig.label}
          </Badge>
        )}
        {email.hasAttachment && (
          <Paperclip className="size-3 text-muted-foreground" />
        )}
      </div>
    </button>
  );
}
