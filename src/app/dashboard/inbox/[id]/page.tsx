"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThreadView } from "@/components/inbox/thread-view";
import { useEmailDetail } from "@/hooks/use-emails";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import type { Email } from "@/types/email";

export default function EmailDetailPage() {
  const params = useParams();
  const router = useRouter();
  const emailId = params.id as string;

  const { email, loading, error, mutate } = useEmailDetail(emailId);

  // Archive handler for keyboard shortcut
  const handleArchive = async () => {
    if (!email) return;
    try {
      await fetch(`/api/emails/${email.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "archive" }),
      });
      router.push("/dashboard/inbox");
    } catch {
      // stay on page on error
    }
  };

  // Wire up keyboard shortcuts
  useKeyboardShortcuts({
    currentEmailId: emailId,
    onArchive: handleArchive,
  });

  useEffect(() => {
    if (email && !email.read) {
      fetch(`/api/emails/${emailId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "read" }),
      });
      mutate({ email: { ...email, read: true } }, { revalidate: false });
    }
  }, [emailId, email, mutate]);

  useEffect(() => {
    if (email?.id) {
      fetch("/api/ai/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailId: email.id }),
      }).catch(() => {});
    }
  }, [email?.id]);

  const handleToggleStar = async (id: string) => {
    if (!email) return;
    const newStarred = !email.starred;

    mutate({ email: { ...email, starred: newStarred } }, { revalidate: false });

    try {
      await fetch(`/api/emails/${id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: newStarred ? "star" : "unstar" }),
      });
    } catch {
      mutate();
    }
  };

  const handleDelete = async () => {
    if (!email) return;
    try {
      await fetch(`/api/emails/${email.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "trash" }),
      });
      router.push("/dashboard/inbox");
    } catch {
      // stay on page on error
    }
  };

  const handleReply = (e: Email) => {
    router.push(`/dashboard/compose?mode=reply&replyToId=${e.id}`);
  };

  const handleReplyAll = (e: Email) => {
    router.push(`/dashboard/compose?mode=replyAll&replyToId=${e.id}`);
  };

  const handleForward = (e: Email) => {
    router.push(`/dashboard/compose?mode=forward&replyToId=${e.id}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 p-4 border-b border-border">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="size-4" />
          </Button>
          <div className="h-4 w-48 bg-muted rounded animate-pulse" />
        </div>
        <div className="flex-1 p-4 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-3 bg-muted rounded animate-pulse" style={{ width: `${80 - i * 5}%` }} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !email) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 p-4 border-b border-border">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="size-4" />
          </Button>
          <span className="text-sm text-muted-foreground">Back to inbox</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
          <p className="text-sm mb-3">{error?.message || "Email not found"}</p>
          <Button variant="outline" size="sm" onClick={() => mutate()}>
            <RefreshCw className="size-4 mr-1" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="size-4" />
        </Button>
        <span className="text-sm text-muted-foreground">Back to inbox</span>
      </div>
      <div className="flex-1 overflow-hidden">
        <ThreadView
          email={email}
          onToggleStar={handleToggleStar}
          onReply={handleReply}
          onReplyAll={handleReplyAll}
          onForward={handleForward}
          onArchive={handleArchive}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
