"use client";

import { useRef, useEffect, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmailItem } from "./email-item";
import type { Email } from "@/types/email";

interface EmailListProps {
  emails: Email[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleStar: (id: string) => void;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  syncState?: {
    phase: "idle" | "syncing" | "classifying" | "complete";
    syncedEmails: number;
    totalEmails: number;
    classifiedEmails: number;
    totalToClassify: number;
  } | null;
}

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

export function EmailList({
  emails,
  selectedId,
  onSelect,
  onToggleStar,
  loading,
  loadingMore,
  hasMore,
  onLoadMore,
  syncState,
}: EmailListProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !loadingMore && !loading) {
        onLoadMore();
      }
    },
    [hasMore, loadingMore, loading, onLoadMore]
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(handleIntersection, {
      root: null,
      rootMargin: "200px",
      threshold: 0,
    });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleIntersection]);

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
    <ScrollArea className="h-full overflow-hidden">
      <div className="divide-y divide-border">
        {emails.map((email) => (
          <EmailItem
            key={email.id}
            email={email}
            isSelected={email.id === selectedId}
            onSelect={onSelect}
            onToggleStar={onToggleStar}
          />
        ))}

        {isSyncing && emails.length === 0 && (
          <div className="h-full overflow-y-auto">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={`sync-skeleton-${i}`} />
            ))}
          </div>
        )}

        {loadingMore &&
          Array.from({ length: 3 }).map((_, i) => (
            <SkeletonRow key={`skeleton-${i}`} />
          ))}

        {hasMore && !loadingMore && (
          <div ref={sentinelRef} className="h-4" />
        )}

        {emails.length === 0 && !loading && !isSyncing && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p className="text-sm">No emails match this filter</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
