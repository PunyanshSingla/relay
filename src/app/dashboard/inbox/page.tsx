"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Pencil, RefreshCw, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterBar } from "@/components/inbox/filter-bar";
import { EmailList } from "@/components/inbox/email-list";
import { ThreadView } from "@/components/inbox/thread-view";
import { ComposeModal } from "@/components/inbox/compose-modal";
import { cn } from "@/lib/utils";
import type { Email, FilterOption } from "@/types/email";

type FilterId = FilterOption["id"];

function getGmailFilterQuery(filter: FilterId): string | undefined {
  switch (filter) {
    case "unread":
      return "is:unread";
    default:
      return undefined;
  }
}

export default function InboxPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<{ name: string; email: string; subject: string } | undefined>();

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pageToken, setPageToken] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedEmail = emails.find((e) => e.id === selectedId) || null;

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
        params.set("pageToken", current_pageToken);
      }
      const q = getGmailFilterQuery(filter);
      if (q) {
        params.set("q", q);
      }

      const response = await fetch(`/api/emails?${params.toString()}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch emails");
      }

      const data = await response.json();

      setEmails((prev) => (reset ? data.emails : [...prev, ...data.emails]));
      setPageToken(data.nextPageToken);
      setHasMore(!!data.nextPageToken);
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
    { id: "all", label: "All", count: emails.length },
    { id: "unread", label: "Unread", count: emails.filter((e) => !e.read).length },
    { id: "P1", label: "P1 Critical", count: emails.filter((e) => e.priority === "P1").length },
    { id: "P2", label: "P2 Important", count: emails.filter((e) => e.priority === "P2").length },
    { id: "P3", label: "P3 Low", count: emails.filter((e) => e.priority === "P3").length },
  ];

  const handleFilterChange = useCallback((filter: FilterId) => {
    setActiveFilter(filter);
  }, []);

  const handleRefresh = useCallback(() => {
    fetchEmails(activeFilter, null, true);
  }, [activeFilter, fetchEmails]);

  // Fetch emails on mount and when filter changes
  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const params = new URLSearchParams();
        const q = getGmailFilterQuery(activeFilter);
        if (q) {
          params.set("q", q);
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
        setPageToken(data.nextPageToken);
        setHasMore(!!data.nextPageToken);
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

  const handleToggleStar = useCallback((id: string) => {
    setEmails((prev) =>
      prev.map((e) => (e.id === id ? { ...e, starred: !e.starred } : e))
    );
  }, []);

  const handleMarkAllRead = useCallback(() => {
    setEmails((prev) => prev.map((e) => ({ ...e, read: true })));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const currentIndex = emails.findIndex((e) => e.id === selectedId);

      switch (e.key) {
        case "j":
        case "ArrowDown":
          e.preventDefault();
          if (currentIndex < emails.length - 1) {
            setSelectedId(emails[currentIndex + 1].id);
          }
          break;
        case "k":
        case "ArrowUp":
          e.preventDefault();
          if (currentIndex > 0) {
            setSelectedId(emails[currentIndex - 1].id);
          }
          break;
        case "Enter":
          if (selectedId) {
            setEmails((prev) =>
              prev.map((e) =>
                e.id === selectedId ? { ...e, read: true } : e
              )
            );
          }
          break;
        case "s":
          if (selectedId) {
            handleToggleStar(selectedId);
          }
          break;
        case "c":
          e.preventDefault();
          setComposeOpen(true);
          break;
        case "r":
          if (selectedEmail) {
            setReplyTo({
              name: selectedEmail.from.name,
              email: selectedEmail.from.email,
              subject: selectedEmail.subject,
            });
            setComposeOpen(true);
          }
          break;
        case "Escape":
          setComposeOpen(false);
          break;
        case "1":
          setActiveFilter("P1");
          break;
        case "2":
          setActiveFilter("P2");
          break;
        case "3":
          setActiveFilter("P3");
          break;
        case "0":
          setActiveFilter("all");
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, emails, selectedEmail, handleToggleStar]);

  // Select first email on mount
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!initializedRef.current && emails.length > 0 && !loading) {
      initializedRef.current = true;
      setSelectedId(emails[0].id);
    }
  }, [emails, loading]);

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
        <Button size="sm" onClick={() => setComposeOpen(true)}>
          <Pencil className="size-4 mr-1" />
          Compose
        </Button>
      </div>

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

      {/* Main content: split view */}
      <div className="flex flex-1 overflow-hidden">
        {/* Email list - 40% */}
        <div className="w-2/5 border-r border-border overflow-hidden">
          <EmailList
            emails={emails}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onToggleStar={handleToggleStar}
            loading={loading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
          />
        </div>

        {/* Thread view - 60% */}
        <div className="w-3/5 overflow-hidden">
          {selectedEmail ? (
            <ThreadView
              email={selectedEmail}
              onToggleStar={handleToggleStar}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <p className="text-sm">Select an email to view</p>
            </div>
          )}
        </div>
      </div>

      {/* Compose modal */}
      <ComposeModal
        open={composeOpen}
        onOpenChange={(open) => {
          setComposeOpen(open);
          if (!open) setReplyTo(undefined);
        }}
        replyTo={replyTo}
      />
    </div>
  );
}
