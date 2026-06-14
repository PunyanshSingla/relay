"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThreadView } from "@/components/inbox/thread-view";
import type { Email } from "@/types/email";

export default function EmailDetailPage() {
  const params = useParams();
  const router = useRouter();
  const emailId = params.id as string;

  const [email, setEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/emails/${emailId}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load email");
      }
      const data = await res.json();
      setEmail(data.email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load email");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmail();
  }, [emailId]);

  const handleToggleStar = (id: string) => {
    setEmail((prev) =>
      prev && prev.id === id ? { ...prev, starred: !prev.starred } : prev
    );
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
          <p className="text-sm mb-3">{error || "Email not found"}</p>
          <Button variant="outline" size="sm" onClick={fetchEmail}>
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
        <ThreadView email={email} onToggleStar={handleToggleStar} />
      </div>
    </div>
  );
}
