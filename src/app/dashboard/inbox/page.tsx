"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Pencil, RefreshCw, CheckCheck, X } from "lucide-react";
import { toast } from "sonner";
import { mutate as globalMutate } from "swr";
import { Button } from "@/components/ui/button";
import { FilterBar } from "@/components/inbox/filter-bar";
import { EmailList } from "@/components/inbox/email-list";
import { SyncBanner } from "@/components/inbox/sync-banner";
import { SyncSummaryCard } from "@/components/inbox/sync-summary-card";
import { cn } from "@/lib/utils";
import { useSyncStatus } from "@/contexts/sync-status-context";
import { useEmailList, useEmailCounts } from "@/hooks/use-emails";
import type { Email, FilterOption } from "@/types/email";

type FilterId = FilterOption["id"];

export default function InboxPage() {
  const router = useRouter();
  const { syncState } = useSyncStatus();
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");

  const searchParams = useSearchParams();
  const sender = searchParams.get("sender") ?? undefined;

  const {
    emails,
    counts: swrCounts,
    hasMore,
    loading,
    isValidating,
    loadMore,
    mutate,
  } = useEmailList(activeFilter, sender);

  const { counts: polledCounts } = useEmailCounts(syncState?.phase);
  const counts = polledCounts ?? swrCounts;

  const filters: FilterOption[] = [
    { id: "all", label: "All", count: counts?.total ?? emails.length },
    { id: "unread", label: "Unread", count: counts?.unread ?? 0 },
    { id: "P1", label: "P1 Critical", count: counts?.P1 ?? 0 },
    { id: "P2", label: "P2 Important", count: counts?.P2 ?? 0 },
    { id: "P3", label: "P3 Low", count: counts?.P3 ?? 0 },
  ];

  const handleFilterChange = useCallback((filter: FilterId) => {
    setActiveFilter(filter);
  }, []);

  const handleRefresh = useCallback(() => {
    mutate();
  }, [mutate]);

  const handleLoadMore = useCallback(() => {
    loadMore();
  }, [loadMore]);

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

    // Show toast only on first transition from 0 to >0 classified emails
    if (
      syncState.phase === "classifying" &&
      !hasShownClassifyingToast.current &&
      prevClassified.current === 0 &&
      syncState.classifiedEmails > 0
    ) {
      hasShownClassifyingToast.current = true;
      toast("AI is categorizing your emails...", {
        duration: 3000,
      });
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

  // Prefetch top 3 email details on load so clicking is instant
  useEffect(() => {
    if (emails.length === 0) return;
    const top3 = emails.slice(0, 3);
    for (const email of top3) {
      globalMutate(`/api/emails/${email.id}`);
    }
  }, [emails]);

  const handleToggleStar = useCallback(async (id: string) => {
    const email = emails.find((e) => e.id === id);
    if (!email) return;
    const newStarred = !email.starred;

    // Optimistic update
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
      // Rollback on error
      mutate();
    }
  }, [emails, mutate]);

  const handleMarkAllRead = useCallback(async () => {
    const unreadIds = emails.filter((e) => !e.read).map((e) => e.id);
    if (unreadIds.length === 0) return;

    // Optimistic update
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

  return (
    <div className="flex flex-col h-full">
      {/* Action bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="size-4 mr-1" />
            Mark all read
          </Button>
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={cn("size-4 mr-1", loading && "animate-spin")} />
            Refresh
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
        <SyncSummaryCard
          totalEmails={syncState.totalEmails}
          counts={counts ?? {}}
        />
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
        <EmailList
          emails={emails}
          selectedId={null}
          onSelect={(id) => router.push(`/dashboard/inbox/${id}`)}
          onToggleStar={handleToggleStar}
          loading={loading}
          loadingMore={isValidating && emails.length > 0}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          syncState={syncState}
        />
      </div>
    </div>
  );
}
