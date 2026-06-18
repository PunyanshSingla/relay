"use client";

import { createContext, use, useState, useEffect, useCallback, useRef } from "react";

interface SyncState {
  phase: "idle" | "syncing" | "classifying" | "complete";
  isInitialSync: boolean;
  totalEmails: number;
  syncedEmails: number;
  classifiedEmails: number;
  totalToClassify: number;
  syncStartedAt: string | null;
  syncCompletedAt: string | null;
  lastSyncAt: string | null;
}

interface SyncStatusContextValue {
  syncState: SyncState | null;
  isSyncing: boolean;
  isInitialSync: boolean;
  progress: number;
}

const SyncStatusContext = createContext<SyncStatusContextValue>({
  syncState: null,
  isSyncing: false,
  isInitialSync: false,
  progress: 0,
});

export function useSyncStatus() {
  return use(SyncStatusContext);
}

export function SyncStatusProvider({ children }: { children: React.ReactNode }) {
  const [syncState, setSyncState] = useState<SyncState | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchSyncStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/sync-status");
      if (!res.ok) return;
      const data = await res.json();
      setSyncState(data);
    } catch {
      // ignore polling errors
    }
  }, []);

  useEffect(() => {
    fetchSyncStatus();
  }, [fetchSyncStatus]);

  useEffect(() => {
    if (syncState && (syncState.phase === "syncing" || syncState.phase === "classifying")) {
      if (intervalRef.current) return;
      intervalRef.current = setInterval(fetchSyncStatus, 3000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [syncState?.phase, fetchSyncStatus]);

  const isSyncing = syncState?.phase === "syncing" || syncState?.phase === "classifying";
  const isInitialSync = syncState?.isInitialSync ?? false;

  let progress = 0;
  if (syncState) {
    if (syncState.phase === "classifying" && syncState.totalToClassify > 0) {
      progress = Math.round((syncState.classifiedEmails / syncState.totalToClassify) * 100);
    } else if (syncState.phase === "complete") {
      progress = 100;
    }
  }

  return (
    <SyncStatusContext.Provider value={{ syncState, isSyncing, isInitialSync, progress }}>
      {children}
    </SyncStatusContext.Provider>
  );
}
