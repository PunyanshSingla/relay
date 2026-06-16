"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Sparkles, Copy, Check, CheckCircle2, MailOpen, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ReplyMode = "short" | "professional" | "friendly" | "generate";

interface AIReplyPanelProps {
  emailId: string;
  activeMode: ReplyMode;
  onModeChange: (mode: ReplyMode) => void;
  onInsert?: (reply: string) => void;
}

type ReplyStatus = "idle" | "generating" | "ready" | "no_reply_needed";

const modes: { id: ReplyMode; label: string }[] = [
  { id: "short", label: "Short" },
  { id: "professional", label: "Professional" },
  { id: "friendly", label: "Friendly" },
  { id: "generate", label: "Generate" },
];

const MAX_POLL_ATTEMPTS = 30;

export function AIReplyPanel({ emailId, activeMode, onModeChange, onInsert }: AIReplyPanelProps) {
  const [status, setStatus] = useState<ReplyStatus>("idle");
  const [reply, setReply] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);

  const fetchReply = useCallback(async (mode: ReplyMode) => {
    try {
      const res = await fetch("/api/ai/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailId, mode }),
      });
      if (!res.ok) return false;

      const data = await res.json();

      if (data.status === "ready" && data.reply) {
        setStatus("ready");
        setReply(data.reply);
        return true;
      }

      if (data.status === "no_reply_needed") {
        setStatus("no_reply_needed");
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }, [emailId]);

  const triggerGeneration = useCallback(async (mode: ReplyMode) => {
    setStatus("generating");
    setReply(null);
    setCopied(false);
    pollCountRef.current = 0;

    const done = await fetchReply(mode);
    if (done) return;
  }, [fetchReply]);

  useEffect(() => {
    triggerGeneration(activeMode);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [emailId, activeMode]);

  useEffect(() => {
    if (status !== "generating") {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }

    pollCountRef.current = 0;
    pollRef.current = setInterval(async () => {
      pollCountRef.current++;
      const done = await fetchReply(activeMode);
      if (done || pollCountRef.current >= MAX_POLL_ATTEMPTS) {
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
        if (!done && pollCountRef.current >= MAX_POLL_ATTEMPTS) {
          setStatus("idle");
        }
      }
    }, 2000);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [status, activeMode, fetchReply]);

  const handleModeChange = (mode: ReplyMode) => {
    if (mode === activeMode) return;
    onModeChange(mode);
  };

  const handleCopy = async () => {
    if (!reply) return;
    await navigator.clipboard.writeText(reply);
    setCopied(true);
    toast.success("Reply copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsert = () => {
    if (!reply) return;
    if (onInsert) {
      onInsert(reply);
    } else {
      sessionStorage.setItem("relay-draft-reply", reply);
      const url = new URL(window.location.href);
      url.pathname = "/dashboard/compose";
      url.searchParams.set("mode", "reply");
      url.searchParams.set("replyToId", emailId);
      window.location.href = url.toString();
    }
  };

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          AI Reply
        </CardTitle>
        <div className="flex items-center gap-1">
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => handleModeChange(mode.id)}
              className={cn(
                "px-2 py-1 text-xs font-medium rounded transition-colors",
                activeMode === mode.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {status === "generating" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />
              <span>Generating reply...</span>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded w-full animate-pulse" />
              <div className="h-3 bg-muted rounded w-4/5 animate-pulse" />
              <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
            </div>
          </div>
        )}

        {status === "no_reply_needed" && (
          <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
            <MailOpen className="size-4 shrink-0" />
            This email doesn&apos;t seem to need a reply.
          </div>
        )}

        {status === "ready" && reply && (
          <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
            {reply}
          </div>
        )}

        {status === "idle" && (
          <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
            <Sparkles className="size-4 shrink-0" />
            Click a mode above to generate a reply.
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={status !== "ready" || !reply}
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="size-3 mr-1" />
            ) : (
              <Copy className="size-3 mr-1" />
            )}
            Copy
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={status !== "ready" || !reply}
            onClick={handleInsert}
          >
            <CheckCircle2 className="size-3 mr-1" />
            Insert
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
