"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, ArrowLeft, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmailList } from "@/components/inbox/email-list";
import type { Email } from "@/types/email";

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(!!initialQuery);
  const [error, setError] = useState<string | null>(null);

  const doSearch = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    setError(null);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
      if (!res.ok) {
        setError("Search failed. Try a different query.");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setEmails(data.emails ?? []);
      setLoading(false);
    } catch {
      setError("Search failed. Try a different query.");
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") doSearch(query);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1 flex items-center gap-2">
          <Sparkles className="size-4 text-primary shrink-0" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search with AI — try 'sponsorship conversations' or 'emails about the hackathon'"
            className="border-0 focus-visible:ring-0 h-8 px-0 py-1 text-sm flex-1"
            autoFocus
          />
          <Button
            size="sm"
            onClick={() => doSearch(query)}
            disabled={!query.trim() || loading}
          >
            {loading ? (
              <RefreshCw className="size-4 animate-spin" />
            ) : (
              "Search"
            )}
          </Button>
        </div>
      </div>

      {/* Search mode indicator */}
      <div className="px-4 py-2 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-medium bg-primary/10 text-primary border-primary/20">
            <Sparkles className="size-3 mr-1" />
            Semantic
          </Badge>
          <span className="text-xs text-muted-foreground">
            AI-powered meaning search — finds relevant emails even without exact keyword matches
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <RefreshCw className="size-6 mb-3 animate-spin" />
            <p className="text-sm">Searching with AI...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p className="text-sm mb-3">{error}</p>
            <Button variant="outline" size="sm" onClick={() => doSearch(query)}>
              Retry
            </Button>
          </div>
        ) : searched ? (
          emails.length > 0 ? (
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
              onArchive={(id) => {
                setEmails((prev) => prev.filter((e) => e.id !== id));
                fetch(`/api/emails/${id}/action`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "archive" }),
                });
              }}
              onTrash={(id) => {
                setEmails((prev) => prev.filter((e) => e.id !== id));
                fetch(`/api/emails/${id}/action`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "trash" }),
                });
              }}
              loading={false}
              loadingMore={false}
              hasMore={false}
              onLoadMore={() => {}}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Search className="size-8 mb-3 opacity-50" />
              <p className="text-sm">No emails match &quot;{query}&quot;</p>
              <p className="text-xs mt-1">Try different words or check your spelling</p>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Sparkles className="size-8 mb-3 opacity-50" />
            <p className="text-sm">Search your emails with AI</p>
            <p className="text-xs mt-1">Try &quot;sponsorship conversations&quot; or &quot;investor discussions&quot;</p>
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
