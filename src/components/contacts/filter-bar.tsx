"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type ContactFilterId = "all" | "vip" | "frequent" | "recent";

interface FilterOption {
  id: ContactFilterId;
  label: string;
  count: number;
}

interface ContactsFilterBarProps {
  filters: FilterOption[];
  activeFilter: ContactFilterId;
  onFilterChange: (filter: ContactFilterId) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function ContactsFilterBar({
  filters,
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
}: ContactsFilterBarProps) {
  return (
    <div className="flex items-center gap-1 border-b border-border bg-card px-4">
      {filters.map((filter) => (
        <button
          type="button"
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          className={cn(
            "relative px-3 py-2.5 text-sm font-medium transition-colors",
            activeFilter === filter.id
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <span className="flex items-center gap-1.5">
            {filter.label}
            <span
              className={cn(
                "inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full px-1 text-[10px] font-medium",
                activeFilter === filter.id
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {filter.count}
            </span>
          </span>
          {activeFilter === filter.id && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      ))}

      <div className="flex-1" />

      <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-1.5">
        <Search className="size-4 text-muted-foreground shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search contacts..."
          aria-label="Search contacts"
          className="bg-transparent text-sm outline-none placeholder:text-muted-foreground w-40"
        />
      </div>
    </div>
  );
}
