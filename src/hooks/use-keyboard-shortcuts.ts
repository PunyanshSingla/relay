"use client";

import { useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

interface KeyboardShortcutOptions {
  currentEmailId?: string | null;
  onArchive?: () => void;
}

export function useKeyboardShortcuts(options: KeyboardShortcutOptions = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentEmailId, onArchive } = options;

  const isOnThreadView = pathname.startsWith("/dashboard/inbox/");
  const isOnInput =
    typeof document !== "undefined" &&
    document.activeElement instanceof HTMLElement &&
    (document.activeElement.tagName === "INPUT" ||
      document.activeElement.tagName === "TEXTAREA" ||
      document.activeElement.isContentEditable);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Skip if user is typing in an input
      if (isOnInput) return;

      // Skip if modifier keys are held (except Shift for Shift+R)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const key = e.key.toLowerCase();

      // C — Compose new email
      if (key === "c") {
        e.preventDefault();
        router.push("/dashboard/compose");
        return;
      }

      // Thread view only shortcuts
      if (isOnThreadView && currentEmailId) {
        // R — Reply
        if (key === "r" && !e.shiftKey) {
          e.preventDefault();
          router.push(
            `/dashboard/compose?mode=reply&replyToId=${currentEmailId}`
          );
          return;
        }

        // Shift+R — Reply All
        if (key === "r" && e.shiftKey) {
          e.preventDefault();
          router.push(
            `/dashboard/compose?mode=replyAll&replyToId=${currentEmailId}`
          );
          return;
        }

        // F — Forward
        if (key === "f") {
          e.preventDefault();
          router.push(
            `/dashboard/compose?mode=forward&replyToId=${currentEmailId}`
          );
          return;
        }

        // E — Archive
        if (key === "e") {
          e.preventDefault();
          if (onArchive) {
            onArchive();
          } else {
            // Fallback: archive via API and navigate back
            fetch(`/api/emails/${currentEmailId}/action`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "archive" }),
            }).then(() => {
              router.push("/dashboard/inbox");
            });
          }
          return;
        }
      }
    },
    [router, isOnThreadView, currentEmailId, isOnInput, onArchive]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
