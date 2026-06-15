"use client";

import { useSyncStatus } from "@/contexts/sync-status-context";
import { cn } from "@/lib/utils";

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

export function SyncIndicator({ collapsed }: { collapsed: boolean }) {
  const { syncState, isSyncing } = useSyncStatus();

  if (!syncState || syncState.phase === "idle") {
    return null;
  }

  const dotColor = isSyncing
    ? "bg-blue-500 animate-pulse"
    : syncState.phase === "complete"
      ? "bg-green-500"
      : "bg-muted";

  if (collapsed) {
    return (
      <div className="flex justify-center py-3 border-t border-border">
        <div className={cn("size-2 rounded-full", dotColor)} />
      </div>
    );
  }

  return (
    <div className="border-t border-border px-3 py-3">
      <div className="flex items-center gap-2">
        <div className={cn("size-2 rounded-full shrink-0", dotColor)} />
        <div className="min-w-0 flex-1">
          {isSyncing && (
            <p className="text-xs text-muted-foreground truncate">
              {syncState.phase === "syncing"
                ? `Syncing... ${syncState.syncedEmails}`
                : `Classifying... ${syncState.classifiedEmails}/${syncState.totalToClassify}`}
            </p>
          )}
          {!isSyncing && syncState.phase === "complete" && (
            <p className="text-xs text-muted-foreground truncate">
              Synced {formatRelativeTime(syncState.syncCompletedAt)}
            </p>
          )}
          {syncState.lastSyncAt && syncState.phase !== "syncing" && syncState.phase !== "classifying" && (
            <p className="text-[10px] text-muted-foreground/70 truncate">
              Last sync {formatRelativeTime(syncState.lastSyncAt)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
