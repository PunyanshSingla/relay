"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Pencil, RefreshCw, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FilterBar } from "@/components/inbox/filter-bar";
import { EmailList } from "@/components/inbox/email-list";
import { SyncBanner } from "@/components/inbox/sync-banner";
import { SyncSummaryCard } from "@/components/inbox/sync-summary-card";
import { cn } from "@/lib/utils";
import { useSyncStatus } from "@/contexts/sync-status-context";
import type { Email, FilterOption } from "@/types/email";

type FilterId = FilterOption["id"];

export default function InboxPage() {
  const router = useRouter();
  const { syncState } = useSyncStatus();
  const [emails, setEmails] = useState<Email[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pageToken, setPageToken] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const fetchEmails = useCallback(async (
    filter: FilterId,
    current_pageToken: string | null,
    reset: boolean
  ) => {
    if (reset) {
      setEmails([]);
      setPageToken(null);
      setHasMore(true);
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);

    try {
      const params = new URLSearchParams();
      if (!reset && current_pageToken) {
        params.set("cursor", current_pageToken);
      }
      if (filter !== "all") {
        params.set("filter", filter);
      }

      const response = await fetch(`/api/emails?${params.toString()}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch emails");
      }

      const data = await response.json();

      setEmails((prev) => {
        if (reset) return data.emails;
        const existingIds = new Set(prev.map((e) => e.id));
        const newEmails = data.emails.filter((e: Email) => !existingIds.has(e.id));
        return [...prev, ...newEmails];
      });
      setPageToken(data.nextCursor);
      setHasMore(!!data.nextCursor);
      if (data.counts) setCounts(data.counts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch emails");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !loadingMore && !loading) {
      fetchEmails(activeFilter, pageToken, false);
    }
  }, [activeFilter, pageToken, hasMore, loadingMore, loading, fetchEmails]);

  const filters: FilterOption[] = [
    { id: "all", label: "All", count: counts.total ?? emails.length },
    { id: "unread", label: "Unread", count: counts.unread ?? 0 },
    { id: "P1", label: "P1 Critical", count: counts.P1 ?? 0 },
    { id: "P2", label: "P2 Important", count: counts.P2 ?? 0 },
    { id: "P3", label: "P3 Low", count: counts.P3 ?? 0 },
  ];

  const handleFilterChange = useCallback((filter: FilterId) => {
    setActiveFilter(filter);
  }, []);

  const handleRefresh = useCallback(() => {
    fetchEmails(activeFilter, null, true);
  }, [activeFilter, fetchEmails]);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const params = new URLSearchParams();
        if (activeFilter !== "all") {
          params.set("filter", activeFilter);
        }

        const response = await fetch(`/api/emails?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to fetch emails");
        }

        const data = await response.json();
        setEmails(data.emails);
        setPageToken(data.nextCursor);
        setHasMore(!!data.nextCursor);
        if (data.counts) setCounts(data.counts);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Failed to fetch emails");
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [activeFilter]);

  useEffect(() => {
    if (syncState?.phase !== "classifying") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/emails/counts");
        if (res.ok) {
          const data = await res.json();
          setCounts(data);
        }
      } catch {
        // ignore polling errors
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [syncState?.phase]);

  useEffect(() => {
    if (syncState?.phase !== "syncing" && syncState?.phase !== "classifying") return;

    const interval = setInterval(async () => {
      try {
        const params = new URLSearchParams();
        if (activeFilter !== "all") {
          params.set("filter", activeFilter);
        }
        const res = await fetch(`/api/emails?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setEmails((prev) => {
            const existingIds = new Set(prev.map((e) => e.id));
            const newEmails = data.emails.filter((e: Email) => !existingIds.has(e.id));
            if (newEmails.length === 0) return prev;
            return [...prev, ...newEmails];
          });
          setPageToken(data.nextCursor);
          setHasMore(!!data.nextCursor);
          if (data.counts) setCounts(data.counts);
        }
      } catch {
        // ignore polling errors
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [syncState?.phase, activeFilter]);

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

    if (syncState.phase === "classifying" && !hasShownClassifyingToast.current && syncState.classifiedEmails > 0) {
      hasShownClassifyingToast.current = true;
      toast("AI is categorizing your emails...", {
        duration: 3000,
      });
    }

    if (syncState.phase === "complete") {
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

  const handleToggleStar = useCallback(async (id: string) => {
    const email = emails.find((e) => e.id === id);
    if (!email) return;
    const newStarred = !email.starred;
    setEmails((prev) =>
      prev.map((e) => (e.id === id ? { ...e, starred: newStarred } : e))
    );
    try {
      await fetch(`/api/emails/${id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: newStarred ? "star" : "unstar" }),
      });
    } catch {
      setEmails((prev) =>
        prev.map((e) => (e.id === id ? { ...e, starred: !newStarred } : e))
      );
    }
  }, [emails]);

  const handleMarkAllRead = useCallback(async () => {
    const unreadIds = emails.filter((e) => !e.read).map((e) => e.id);
    if (unreadIds.length === 0) return;
    setEmails((prev) => prev.map((e) => ({ ...e, read: true })));
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
      setEmails((prev) =>
        prev.map((e) => (unreadIds.includes(e.id) ? { ...e, read: false } : e))
      );
    }
  }, [emails]);

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
          counts={counts}
        />
      )}

      {/* Filter bar */}
      <FilterBar
        filters={filters}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
      />

      {/* Error state */}
      {error && (
        <div className="px-4 py-3 bg-destructive/10 text-destructive text-sm border-b border-border">
          {error}
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
          loadingMore={loadingMore}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          syncState={syncState}
        />
      </div>

    </div>
  );
}
