"use client";

import { useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmailList } from "@/components/inbox/email-list";
import type { Email } from "@/types/email";

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [pageToken, setPageToken] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searched, setSearched] = useState(!!initialQuery);

  const doSearch = useCallback(async (q: string, reset = true) => {
    if (!q.trim()) return;
    setLoading(reset);
    setLoadingMore(!reset);
    setSearched(true);

    try {
      const params = new URLSearchParams({ q: q.trim() });
      if (!reset && pageToken) params.set("pageToken", pageToken);

      const res = await fetch(`/api/emails?${params.toString()}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();

      setEmails((prev) => {
        if (reset) return data.emails;
        const existingIds = new Set(prev.map((e: Email) => e.id));
        return [...prev, ...data.emails.filter((e: Email) => !existingIds.has(e.id))];
      });
      setPageToken(data.nextPageToken);
      setHasMore(!!data.nextPageToken);
    } catch {
      // error handled by state
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [pageToken]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !loadingMore && !loading) {
      doSearch(query, false);
    }
  }, [query, hasMore, loadingMore, loading, doSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      doSearch(query);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1 flex items-center gap-2">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search emails..."
            className="border-0 focus-visible:ring-0 h-8 px-0 py-1 text-sm flex-1"
            autoFocus
          />
          <Button
            size="sm"
            onClick={() => doSearch(query)}
            disabled={!query.trim() || loading}
          >
            Search
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <RefreshCw className="size-4 mr-2 animate-spin" />
            <span className="text-sm">Searching...</span>
          </div>
        ) : searched ? (
          <EmailList
            emails={emails}
            selectedId={null}
            onSelect={(id) => router.push(`/dashboard/inbox/${id}`)}
            onToggleStar={(id) => {
              setEmails((prev) =>
                prev.map((e) => (e.id === id ? { ...e, starred: !e.starred } : e))
              );
              fetch(`/api/emails/${id}/action`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  action: emails.find((e) => e.id === id)?.starred ? "unstar" : "star",
                }),
              });
            }}
            loading={loading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Search className="size-8 mb-3 opacity-50" />
            <p className="text-sm">Type a query and press Enter to search</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <RefreshCw className="size-4 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
