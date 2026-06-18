"use client";

import { Star, Mail, Calendar, MessageSquare, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "@/lib/format-date";

interface ContactData {
  id: string;
  email: string;
  name: string | null;
  emailCount: number;
  meetingCount: number;
  lastInteraction: string | null;
  lastTopic: string | null;
  relationshipStrength: number;
  vip: boolean;
}

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

interface ContactItemProps {
  contact: ContactData;
}

export function ContactItem({ contact }: ContactItemProps) {
  const router = useRouter();
  const displayName = contact.name || contact.email;
  const avatarColor = getAvatarColor(displayName);
  const strengthPercent = Math.round(contact.relationshipStrength * 100);

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors border-b border-border hover:bg-muted/30 cursor-pointer",
        contact.vip && "bg-amber-500/[0.02]"
      )}
      onClick={() => router.push(`/dashboard/contacts/${contact.id}`)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(`/dashboard/contacts/${contact.id}`); } }}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-medium",
          avatarColor
        )}
      >
        {getInitials(displayName)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground truncate">
            {displayName}
          </span>
          {contact.vip && (
            <Star className="size-3.5 fill-amber-500 text-amber-500 shrink-0" />
          )}
          {contact.relationshipStrength >= 0.6 && !contact.vip && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-500 shrink-0">
              Close
            </span>
          )}
        </div>

        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {contact.email}
        </p>

        <div className="flex items-center gap-4 mt-2">
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Mail className="size-3" />
            {contact.emailCount}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="size-3" />
            {contact.meetingCount}
          </span>
          {contact.lastTopic && (
            <span
              className="inline-flex items-center gap-1 text-xs text-muted-foreground truncate max-w-[160px]"
              title={contact.lastTopic}
            >
              <MessageSquare className="size-3 shrink-0" />
              <span className="truncate">{contact.lastTopic}</span>
            </span>
          )}
          {contact.lastInteraction && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground shrink-0">
              <Clock className="size-3" />
              {formatDistanceToNow(contact.lastInteraction)}
            </span>
          )}
        </div>
      </div>

      {/* Relationship strength */}
      <div className="flex flex-col items-end gap-1 shrink-0 pt-1">
        <div className="w-16 h-1 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${strengthPercent}%` }}
          />
        </div>
        <span className="text-[10px] text-muted-foreground">
          {strengthPercent}%
        </span>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-border animate-pulse">
      <div className="size-10 rounded-full bg-muted shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-4 w-28 bg-muted rounded" />
        </div>
        <div className="h-3 w-44 bg-muted rounded" />
        <div className="flex items-center gap-4 mt-1">
          <div className="h-3 w-10 bg-muted rounded" />
          <div className="h-3 w-10 bg-muted rounded" />
          <div className="h-3 w-24 bg-muted rounded" />
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <div className="w-16 h-1 rounded-full bg-muted" />
        <div className="h-3 w-8 bg-muted rounded" />
      </div>
    </div>
  );
}

export function ContactSkeletonList({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </>
  );
}
