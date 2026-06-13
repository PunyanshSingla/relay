"use client";

import { cn } from "@/lib/utils";
import type { FilterOption } from "@/types/email";

interface FilterBarProps {
  filters: FilterOption[];
  activeFilter: FilterOption["id"];
  onFilterChange: (filter: FilterOption["id"]) => void;
}

export function FilterBar({ filters, activeFilter, onFilterChange }: FilterBarProps) {
  return (
    <div className="flex items-center gap-1 border-b border-border bg-card px-4">
      {filters.map((filter) => (
        <button
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
    </div>
  );
}
