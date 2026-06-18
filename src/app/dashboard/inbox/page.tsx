"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Pencil, RefreshCw, CheckCheck, X, Star, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { mutate as globalMutate } from "swr";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FilterBar } from "@/components/inbox/filter-bar";
import { EmailList } from "@/components/inbox/email-list";
import { SyncBanner } from "@/components/inbox/sync-banner";
import { SyncSummaryCard } from "@/components/inbox/sync-summary-card";
import { cn } from "@/lib/utils";
import { useSyncStatus } from "@/contexts/sync-status-context";
import { usePriorityEmailList } from "@/hooks/use-priority-emails";
import { useEmailCounts } from "@/hooks/use-emails";
import type { Email, FilterOption } from "@/types/email";

type FilterId = "all" | "unread" | "P1" | "P2" | "P3" | "trash" | "sent" | "spam" | "starred";

export default function InboxPage() {
  const router = useRouter();
  const { syncState } = useSyncStatus();
  const searchParams = useSearchParams();
  const urlFilter = searchParams.get("filter") as FilterId | null;
  const [activeFilter, setActiveFilter] = useState<FilterId>(urlFilter || "all");

  // Sync filter from URL
  useEffect(() => {
    if (urlFilter && urlFilter !== activeFilter) {
      setActiveFilter(urlFilter);
    }
  }, [urlFilter]);

  const sender = searchParams.get("sender") ?? undefined;

  const {
    emails,
    counts: priorityCounts,
    loading,
    loadingGroups,
    isValidating,
    mutate,
  } = usePriorityEmailList(activeFilter, sender);

  const { counts: polledCounts } = useEmailCounts(syncState?.phase);
  const counts = polledCounts ?? priorityCounts;

  const isSpecialFilter = ["trash", "sent", "spam", "starred"].includes(activeFilter);

  const filters: { id: FilterId; label: string; count?: number }[] = isSpecialFilter
    ? [
        { id: "all", label: "All", count: counts?.total },
        { id: "unread", label: "Unread", count: counts?.unread },
        { id: "P1", label: "P1", count: counts?.P1 },
        { id: "P2", label: "P2", count: counts?.P2 },
        { id: "P3", label: "P3", count: counts?.P3 },
      ]
    : [
        { id: "all", label: "All", count: counts?.total ?? emails.length },
        { id: "unread", label: "Unread", count: counts?.unread ?? 0 },
        { id: "P1", label: "P1 Critical", count: counts?.P1 ?? 0 },
        { id: "P2", label: "P2 Important", count: counts?.P2 ?? 0 },
        { id: "P3", label: "P3 Low", count: counts?.P3 ?? 0 },
      ];

  const handleFilterChange = useCallback((filter: FilterId) => {
    setActiveFilter(filter);
    if (filter === "all") {
      router.push("/dashboard/inbox");
    } else {
      router.push(`/dashboard/inbox?filter=${filter}`);
    }
  }, [router]);

  const [syncing, setSyncing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const res = await fetch("/api/emails/sync", { method: "POST" });
      if (res.ok) {
        toast("Checking for new emails...", { duration: 2000 });
      } else {
        toast.error("Failed to trigger sync");
      }
    } catch {
      toast.error("Failed to trigger sync");
    } finally {
      setSyncing(false);
    }
  }, [syncing]);

  // Revalidate emails when sync finishes
  useEffect(() => {
    if (syncState?.phase === "complete") {
      mutate();
    }
  }, [syncState?.phase, mutate]);

  // Toasts for classification progress
  const prevClassified = useRef(0);
  const wasInitialSync = useRef(false);
  const hasShownClassifyingToast = useRef(false);

  useEffect(() => {
    if (syncState?.isInitialSync && syncState.phase === "classifying") {
      wasInitialSync.current = true;
    }
  }, [syncState?.isInitialSync, syncState?.phase]);

  useEffect(() => {
    if (!syncState) return;

    if (
      syncState.phase === "classifying" &&
      !hasShownClassifyingToast.current &&
      prevClassified.current === 0 &&
      syncState.classifiedEmails > 0
    ) {
      hasShownClassifyingToast.current = true;
      toast("AI is categorizing your emails...", { duration: 3000 });
    }

    if (syncState.phase === "complete" || syncState.phase === "idle") {
      hasShownClassifyingToast.current = false;
    }

    prevClassified.current = syncState.classifiedEmails;
  }, [syncState?.classifiedEmails, syncState?.phase]);

  useEffect(() => {
    if (syncState?.phase === "complete" && wasInitialSync.current) {
      wasInitialSync.current = false;
      toast.success(`Sync complete! ${syncState.totalEmails} emails processed.`, {
        duration: 6000,
      });
    }
  }, [syncState?.phase]);

  // Prefetch top 3 email details so clicking feels instant
  useEffect(() => {
    if (emails.length === 0) return;
    const top3 = emails.slice(0, 3);
    for (const email of top3) {
      const key = `/api/emails/${email.id}`;
      fetch(key)
        .then((r) => r.json())
        .then((data) => {
          if (data?.email) {
            globalMutate(key, data, false);
          }
        })
        .catch(() => {});
    }
  }, [emails]);

  const handleToggleStar = useCallback(async (id: string) => {
    const email = emails.find((e) => e.id === id);
    if (!email) return;
    const newStarred = !email.starred;

    mutate(
      (current) =>
        current?.map((page) => {
          if (!page) return page;
          return {
            ...page,
            emails: page.emails.map((e: Email) =>
              e.id === id ? { ...e, starred: newStarred } : e
            ),
          };
        }),
      { revalidate: false },
    );

    try {
      await fetch(`/api/emails/${id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: newStarred ? "star" : "unstar" }),
      });
    } catch {
      mutate();
    }
  }, [emails, mutate]);

  const handleMarkAllRead = useCallback(async () => {
    const unreadIds = emails.filter((e) => !e.read).map((e) => e.id);
    if (unreadIds.length === 0) return;

    mutate(
      (current) =>
        current?.map((page) => {
          if (!page) return page;
          return {
            ...page,
            emails: page.emails.map((e: Email) =>
              unreadIds.includes(e.id) ? { ...e, read: true } : e
            ),
          };
        }),
      { revalidate: false },
    );

    try {
      await Promise.all(
        unreadIds.map((id) =>
          fetch(`/api/emails/${id}/action`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "read" }),
          })
        )
      );
    } catch {
      mutate();
    }
  }, [emails, mutate]);

  const isPriorityMode = activeFilter === "all";

  return (
    <div className="flex flex-col h-full">
      {/* Action bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="size-4 mr-1" />
            Mark all read
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={syncing || syncState?.phase === "syncing"}
          >
            <RefreshCw
              className={cn(
                "size-4 mr-1",
                (syncing || syncState?.phase === "syncing") && "animate-spin"
              )}
            />
            {syncing || syncState?.phase === "syncing" ? "Syncing..." : "Refresh"}
          </Button>
        </div>
        <Button size="sm" onClick={() => router.push("/dashboard/compose")}>
          <Pencil className="size-4 mr-1" />
          Compose
        </Button>
      </div>

      {/* Sync progress banner */}
      <SyncBanner />

      {/* Post-sync summary */}
      {syncState?.phase === "complete" && syncState.isInitialSync && (
        <SyncSummaryCard totalEmails={syncState.totalEmails} counts={counts ?? {}} />
      )}

      {/* Filter bar */}
      <FilterBar
        filters={filters}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
      />

      {/* Active sender filter */}
      {sender && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-card">
          <span className="text-xs text-muted-foreground">Filtered by:</span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
            {sender}
            <button
              onClick={() => router.push("/dashboard/inbox")}
              className="ml-0.5 hover:text-primary/70 transition-colors"
            >
              <X className="size-3" />
            </button>
          </span>
        </div>
      )}

      {/* Email list — full width */}
      <div className="flex-1 overflow-hidden overflow-x-hidden">
        {isPriorityMode ? (
          <PriorityEmailList
            emails={emails}
            loadingGroups={loadingGroups}
            activeFilter={activeFilter}
            onSelect={(id) => router.push(`/dashboard/inbox/${id}`)}
            onToggleStar={handleToggleStar}
            onEmptyTrash={async () => {
              if (!confirm("Permanently delete all emails in trash?")) return;
              try {
                const res = await fetch("/api/emails/empty-trash", { method: "POST" });
                if (res.ok) {
                  toast.success("Trash emptied");
                  mutate();
                }
              } catch {
                toast.error("Failed to empty trash");
              }
            }}
            loading={loading}
            syncState={syncState}
          />
        ) : (
          <EmailList
            emails={emails}
            selectedId={null}
            onSelect={(id) => router.push(`/dashboard/inbox/${id}`)}
            onToggleStar={handleToggleStar}
            loading={loading}
            loadingMore={isValidating && emails.length > 0}
            hasMore={false}
            onLoadMore={() => {}}
            syncState={syncState}
          />
        )}
      </div>
    </div>
  );
}

// ── Priority-grouped email list with staggered rendering ──

function PriorityEmailList({
  emails,
  loadingGroups,
  activeFilter,
  onSelect,
  onToggleStar,
  onEmptyTrash,
  loading,
  syncState,
}: {
  emails: Email[];
  loadingGroups: { p1: boolean; p2: boolean; p3: boolean };
  activeFilter: FilterId;
  onSelect: (id: string) => void;
  onToggleStar: (id: string) => void;
  onEmptyTrash: () => void;
  loading: boolean;
  syncState?: { phase: string } | null;
}) {
  const p1Emails = emails.filter((e) => e.priority === "P1");
  const p2Emails = emails.filter((e) => e.priority === "P2");
  const p3Emails = emails.filter((e) => e.priority === "P3");

  if (loading) {
    return (
      <div className="h-full overflow-y-auto">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    );
  }

  const isSyncing = syncState?.phase === "syncing" || syncState?.phase === "classifying";

  return (
    <div className="h-full overflow-y-auto">
      <div className="divide-y divide-border">
        {/* P1 — Critical emails, appear instantly */}
        <PriorityGroup
          label="Critical"
          emails={p1Emails}
          visible={!loadingGroups.p1}
          delay={0}
          onSelect={onSelect}
          onToggleStar={onToggleStar}
        />

        {/* P2 — Important emails, fade in after P1 */}
        <PriorityGroup
          label="Important"
          emails={p2Emails}
          visible={!loadingGroups.p2}
          delay={150}
          onSelect={onSelect}
          onToggleStar={onToggleStar}
        />

        {/* P3 — Low priority, fade in last */}
        <PriorityGroup
          label="Low Priority"
          emails={p3Emails}
          visible={!loadingGroups.p3}
          delay={300}
          onSelect={onSelect}
          onToggleStar={onToggleStar}
        />

        {isSyncing && emails.length === 0 && (
          <>
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={`sync-skeleton-${i}`} />
            ))}
          </>
        )}

        {emails.length === 0 && !loading && !isSyncing && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p className="text-sm">
              {activeFilter === "trash" && "Trash is empty"}
              {activeFilter === "sent" && "No sent emails yet"}
              {activeFilter === "spam" && "No spam emails"}
              {activeFilter === "starred" && "No starred emails"}
              {activeFilter === "all" && "No emails match this filter"}
              {activeFilter === "unread" && "All caught up! No unread emails"}
              {!["trash", "sent", "spam", "starred", "all", "unread"].includes(activeFilter) && "No emails match this filter"}
            </p>
            {activeFilter === "trash" && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3 text-destructive"
                onClick={onEmptyTrash}
              >
                Empty Trash
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PriorityGroup({
  label,
  emails,
  visible,
  delay,
  onSelect,
  onToggleStar,
}: {
  label: string;
  emails: Email[];
  visible: boolean;
  delay: number;
  onSelect: (id: string) => void;
  onToggleStar: (id: string) => void;
}) {
  if (emails.length === 0) return null;

  return (
    <div
      className={cn(
        "transition-all duration-500 ease-out",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {emails.map((email, i) => (
        <div
          key={email.id}
          className="animate-fade-in"
          style={{ animationDelay: `${delay + i * 30}ms` }}
        >
          <EmailItemCompact
            email={email}
            onSelect={onSelect}
            onToggleStar={onToggleStar}
          />
        </div>
      ))}
    </div>
  );
}

function EmailItemCompact({
  email,
  onSelect,
  onToggleStar,
}: {
  email: Email;
  onSelect: (id: string) => void;
  onToggleStar: (id: string) => void;
}) {
  const avatarColor = getAvatarColor(email.from.name);
  const timeAgo = formatDistanceToNow(email.timestamp);

  return (
    <button
      onClick={() => onSelect(email.id)}
      className={cn(
        "flex w-full items-start gap-3 p-3 text-left transition-colors border-b border-border",
        "hover:bg-muted/50 border-l-2 border-l-transparent",
        !email.read && "bg-muted/30"
      )}
    >
      {/* Unread indicator + Priority dot */}
      <div className="flex flex-col items-center gap-1 pt-1">
        {!email.read && (
          <div className="size-2 rounded-full bg-primary shrink-0" />
        )}
        <div
          className={cn(
            "size-2 rounded-full shrink-0",
            email.priority === "P1"
              ? "bg-red-500"
              : email.priority === "P2"
                ? "bg-amber-500"
                : "bg-gray-400"
          )}
        />
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
              !email.read
                ? "font-semibold text-foreground"
                : "text-muted-foreground"
            )}
          >
            {email.from.name}
          </span>
          <span className="text-xs text-muted-foreground shrink-0">
            {timeAgo}
          </span>
        </div>
        <p
          className={cn(
            "text-sm truncate mt-0.5",
            !email.read
              ? "font-medium text-foreground"
              : "text-muted-foreground"
          )}
        >
          {email.subject}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5" title={email.preview}>
          {email.preview.length > 120
            ? email.preview.slice(0, 120) + "..."
            : email.preview}
        </p>
      </div>

      {/* Right side */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleStar(email.id);
          }}
          className="text-muted-foreground hover:text-amber-500 transition-colors"
        >
          <Star
            className={cn(
              "size-4",
              email.starred && "fill-amber-500 text-amber-500"
            )}
          />
        </button>
        {!email.isClassified ? (
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 h-4 font-medium bg-muted text-muted-foreground border-muted animate-pulse"
          >
            Processing...
          </Badge>
        ) : (
          <>
            {email.priority && (
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-1.5 py-0 h-4 font-medium",
                  email.priority === "P1" && "bg-red-500/10 text-red-500 border-red-500/20",
                  email.priority === "P2" && "bg-amber-500/10 text-amber-500 border-amber-500/20",
                  email.priority === "P3" && "bg-gray-500/10 text-gray-500 border-gray-500/20",
                )}
              >
                {email.priority}
              </Badge>
            )}
            {email.category && (
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-1.5 py-0 h-4 font-medium",
                  email.category === "action_needed" && "bg-red-500/10 text-red-500 border-red-500/20",
                  email.category === "meeting" && "bg-purple-500/10 text-purple-500 border-purple-500/20",
                  email.category === "follow_up" && "bg-amber-500/10 text-amber-500 border-amber-500/20",
                  email.category === "fyi" && "bg-gray-500/10 text-gray-500 border-gray-500/20",
                  email.category === "newsletter" && "bg-blue-500/10 text-blue-500 border-blue-500/20",
                  email.category === "promotion" && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                  email.category === "social" && "bg-pink-500/10 text-pink-500 border-pink-500/20",
                )}
              >
                {email.category === "action_needed" && "Action"}
                {email.category === "meeting" && "Meeting"}
                {email.category === "follow_up" && "Follow-up"}
                {email.category === "fyi" && "FYI"}
                {email.category === "newsletter" && "News"}
                {email.category === "promotion" && "Promo"}
                {email.category === "social" && "Social"}
              </Badge>
            )}
          </>
        )}
        {email.hasAttachment && (
          <Paperclip className="size-3 text-muted-foreground" />
        )}
      </div>
    </button>
  );
}

// ── Shared helpers ──

function SkeletonRow() {
  return (
    <div className="flex items-start gap-3 p-3 border-b border-border animate-pulse">
      <div className="flex flex-col items-center gap-1 pt-1">
        <div className="size-2 rounded-full bg-muted" />
        <div className="size-2 rounded-full bg-muted" />
      </div>
      <div className="size-9 rounded-full bg-muted shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-24 bg-muted rounded" />
          <div className="h-3 w-10 bg-muted rounded ml-auto" />
        </div>
        <div className="h-3.5 w-40 bg-muted rounded" />
        <div className="h-3 w-56 bg-muted rounded" />
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <div className="size-4 bg-muted rounded" />
        <div className="h-4 w-7 bg-muted rounded" />
      </div>
    </div>
  );
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

function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return new Date(date).toLocaleDateString();
}

