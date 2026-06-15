"use client";

import { Mail, Loader2 } from "lucide-react";

interface SyncEmptyStateProps {
  phase: "syncing" | "classifying";
  syncedEmails: number;
  totalEmails: number;
  classifiedEmails: number;
  totalToClassify: number;
}

export function SyncEmptyState({
  phase,
  syncedEmails,
  totalEmails,
  classifiedEmails,
  totalToClassify,
}: SyncEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="relative mb-6">
        <div className="size-16 rounded-full bg-muted flex items-center justify-center">
          <Mail className="size-8 text-muted-foreground" />
        </div>
        <Loader2 className="size-6 text-primary absolute -bottom-1 -right-1 animate-spin" />
      </div>

      <h3 className="text-lg font-medium text-foreground mb-2">
        {phase === "syncing"
          ? "We're syncing your emails"
          : "AI is categorizing your emails"}
      </h3>

      <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
        {phase === "syncing"
          ? "This usually takes 1-2 minutes. Your inbox will fill in as emails are found."
          : "Your emails are being organized by priority and category. This won't take long."}
      </p>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {phase === "syncing" && (
          <>
            <span className="font-medium text-foreground">{syncedEmails}</span>
            <span>of</span>
            <span className="font-medium text-foreground">{totalEmails || "..."}</span>
            <span>emails found</span>
          </>
        )}
        {phase === "classifying" && (
          <>
            <span className="font-medium text-foreground">{classifiedEmails}</span>
            <span>of</span>
            <span className="font-medium text-foreground">{totalToClassify}</span>
            <span>classified</span>
          </>
        )}
      </div>

      <p className="text-xs text-muted-foreground/70 mt-6">
        You can safely navigate to other pages — we'll notify you when it's done.
      </p>
    </div>
  );
}
