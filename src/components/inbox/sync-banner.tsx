"use client";

import { useSyncStatus } from "@/contexts/sync-status-context";
import { cn } from "@/lib/utils";

export function SyncBanner() {
  const { syncState, isSyncing, progress } = useSyncStatus();

  if (!syncState || syncState.phase === "idle") {
    return null;
  }

  const isInitialSync = syncState.isInitialSync;

  if (!isInitialSync && syncState.phase === "syncing") {
    return null;
  }

  // Don't show banner when nothing to classify
  if (syncState.phase === "classifying" && syncState.totalToClassify === 0) {
    return null;
  }

  const displayClassified = Math.min(syncState.classifiedEmails, syncState.totalToClassify);
  const cappedProgress = syncState.totalToClassify > 0
    ? Math.min(progress, 100)
    : progress;

  return (
    <div
      className={cn(
        "px-4 py-3 border-b border-border transition-colors",
        syncState.phase === "syncing" && "bg-blue-500/5",
        syncState.phase === "classifying" && "bg-amber-500/5",
        syncState.phase === "complete" && "bg-green-500/5"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {syncState.phase === "syncing" && (
              <>
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  Syncing your inbox
                </span>
                {syncState.totalEmails > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {syncState.totalEmails} emails in inbox
                  </span>
                )}
              </>
            )}
            {syncState.phase === "classifying" && (
              <>
                <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                  Classifying recent emails
                </span>
                <span className="text-sm text-muted-foreground">
                  {displayClassified} of {syncState.totalToClassify} classified
                </span>
              </>
            )}
            {syncState.phase === "complete" && (
              <>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  Sync complete
                </span>
                <span className="text-sm text-muted-foreground">
                  {syncState.totalEmails} emails processed
                </span>
              </>
            )}
          </div>

          {isSyncing && (
            <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  syncState.phase === "syncing" && "bg-blue-500",
                  syncState.phase === "classifying" && "bg-amber-500"
                )}
                style={{
                  width: syncState.phase === "classifying" && syncState.totalToClassify > 0
                    ? `${Math.max(cappedProgress, 5)}%`
                    : undefined,
                  animation: syncState.phase === "syncing"
                    ? "indeterminate 1.5s ease-in-out infinite"
                    : undefined,
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
