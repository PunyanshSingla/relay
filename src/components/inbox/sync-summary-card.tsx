"use client";

import { useState, useEffect } from "react";
import { CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SyncSummaryCardProps {
  totalEmails: number;
  counts: Record<string, number>;
}

const STORAGE_KEY = "relay_sync_summary_dismissed";

export function SyncSummaryCard({ totalEmails, counts }: SyncSummaryCardProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const wasDismissed = localStorage.getItem(STORAGE_KEY);
    if (wasDismissed) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  if (dismissed || totalEmails === 0) {
    return null;
  }

  return (
    <div className="mx-4 mb-4 rounded-lg border border-green-500/20 bg-green-500/5 p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <CheckCircle className="size-5 text-green-500 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-foreground">
              Sync Complete!
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {totalEmails} emails processed and categorized
            </p>

            <div className="flex flex-wrap gap-3 mt-3">
              {(counts.P1 ?? 0) > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="size-2 rounded-full bg-red-500" />
                  <span className="text-xs text-muted-foreground">
                    P1 Critical: <span className="font-medium text-foreground">{counts.P1}</span>
                  </span>
                </div>
              )}
              {(counts.P2 ?? 0) > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="size-2 rounded-full bg-amber-500" />
                  <span className="text-xs text-muted-foreground">
                    P2 Important: <span className="font-medium text-foreground">{counts.P2}</span>
                  </span>
                </div>
              )}
              {(counts.P3 ?? 0) > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="size-2 rounded-full bg-gray-400" />
                  <span className="text-xs text-muted-foreground">
                    P3 Low: <span className="font-medium text-foreground">{counts.P3}</span>
                  </span>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground/70 mt-3">
              Your inbox is now organized. P1 emails are shown first.
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          onClick={handleDismiss}
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
