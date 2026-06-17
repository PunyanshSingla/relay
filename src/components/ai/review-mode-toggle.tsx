"use client";

import { Eye, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReviewMode } from "@/hooks/use-chat";

interface ReviewModeToggleProps {
  mode: ReviewMode;
  onChange: (mode: ReviewMode) => void;
}

export function ReviewModeToggle({ mode, onChange }: ReviewModeToggleProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/50 p-0.5">
      <button
        onClick={() => onChange("review")}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all",
          mode === "review"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
        title="Review mode: AI drafts emails for your review before sending"
      >
        <Eye className="size-3" />
        Review
      </button>
      <button
        onClick={() => onChange("auto")}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all",
          mode === "auto"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
        title="Auto-send mode: AI sends emails immediately"
      >
        <Zap className="size-3" />
        Auto-Send
      </button>
    </div>
  );
}
