"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, Command, PanelLeftClose, PanelLeftOpen, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { UserMenu } from "./user-menu";
import { cn } from "@/lib/utils";
import type { Email } from "@/types/email";
import { formatDistanceToNow } from "@/lib/format-date";

interface TopBarProps {
  onCommandPaletteOpen?: () => void;
  sidebarCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export function TopBar({ onCommandPaletteOpen, sidebarCollapsed, onToggleCollapse }: TopBarProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Email[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setSearchLoading(true);
    setShowResults(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
      if (!res.ok) return;
      const data = await res.json();
      setSearchResults(data.emails ?? []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") doSearch(searchQuery);
    if (e.key === "Escape") {
      setShowResults(false);
      inputRef.current?.blur();
    }
    if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onCommandPaletteOpen?.();
    }
  };

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="flex h-14 items-center gap-4 border-b border-border bg-card px-4 lg:px-6">
      {/* Sidebar toggle */}
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-9 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={onToggleCollapse}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={4}>
          {sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        </TooltipContent>
      </Tooltip>

      {/* Search bar with results dropdown */}
      <div className="flex-1 max-w-xl relative" ref={wrapperRef}>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2">
          <Sparkles className="size-4 shrink-0 text-primary" />
          <input
            ref={inputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
            placeholder="Search with AI..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSearchResults([]);
                setShowResults(false);
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-3" />
            </button>
          )}
          <kbd className="hidden pointer-events-none h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium sm:inline-flex">
            <Command className="size-3" />K
          </kbd>
        </div>

        {/* Results dropdown */}
        {showResults && (
          <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-border bg-card shadow-lg z-50 max-h-[70vh] overflow-auto">
            {searchLoading ? (
              <div className="flex items-center justify-center py-6 text-muted-foreground">
                <Search className="size-4 mr-2 animate-spin" />
                <span className="text-sm">Searching...</span>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="py-1">
                <div className="px-3 py-1.5">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-medium bg-primary/10 text-primary border-primary/20">
                    <Sparkles className="size-3 mr-1" />
                    {searchResults.length} results
                  </Badge>
                </div>
                {searchResults.map((email) => (
                  <button
                    key={email.id}
                    onClick={() => {
                      setShowResults(false);
                      router.push(`/dashboard/inbox/${email.id}`);
                    }}
                    className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-medium">
                      {getInitials(email.from.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium truncate">{email.from.name}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {formatDistanceToNow(email.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{email.subject}</p>
                      <p className="text-[10px] text-muted-foreground/70 truncate mt-0.5">{email.preview}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                <Search className="size-5 mb-2 opacity-50" />
                <p className="text-sm">No results found</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        <Button variant="ghost" size="icon" className="relative size-9 text-muted-foreground hover:text-foreground">
          <Bell className="size-4" />
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary" />
        </Button>

        <UserMenu />
      </div>
    </header>
  );
}
