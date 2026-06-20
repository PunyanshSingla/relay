"use client";

import { useState, useEffect } from "react";
import {
  Zap,
  Check,
  X,
  Loader2,
  Bot,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ACTION_LABELS, type ActionType } from "@/types/automation";

interface WorkflowSuggestion {
  id: string;
  actionType: ActionType;
  target: string;
  description: string;
  count: number;
  confidence: number;
}

function describeWorkflow(s: WorkflowSuggestion): string {
  const action = ACTION_LABELS[s.actionType] ?? s.actionType;

  if (s.actionType === "ai_reply") {
    return `Automatically draft replies to emails from ${s.target || "detected senders"}`;
  }
  if (s.actionType === "star_email") {
    return `Auto-star emails from ${s.target || "VIP contacts"}`;
  }
  if (s.actionType === "archive_email") {
    return `Auto-archive emails matching ${s.target || "this pattern"}`;
  }
  if (s.actionType === "forward_email") {
    return `Auto-forward emails from ${s.target || "this sender"}`;
  }
  if (s.actionType === "apply_label") {
    return `Auto-label emails from ${s.target || "this sender"}`;
  }
  if (s.actionType === "trash_email") {
    return `Auto-delete emails from ${s.target || "this sender"}`;
  }
  if (s.actionType === "mark_important") {
    return `Auto-mark as important emails from ${s.target || "VIP contacts"}`;
  }
  return `${action} ${s.target ? `for ${s.target}` : ""}`.trim();
}

export default function AutomationsPage() {
  const [suggestions, setSuggestions] = useState<WorkflowSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/automations");
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        if (!cancelled) {
          setSuggestions(data.automations ?? []);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setSuggestions([]);
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAccept = async (id: string) => {
    setActing(id);
    try {
      await fetch(`/api/automations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "enabled" }),
      });
      setSuggestions((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setActing(null);
    }
  };

  const handleDismiss = async (id: string) => {
    setActing(id);
    try {
      await fetch(`/api/automations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "dismissed" }),
      });
      setSuggestions((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setActing(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Zap className="size-5 text-primary" />
          <div>
            <h1 className="text-lg font-semibold">Automations</h1>
            <p className="text-xs text-muted-foreground">
              AI-detected workflows you can enable with one click
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading &&
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 bg-muted rounded-lg animate-pulse" />
          ))}

        {!loading && suggestions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Bot className="size-8 mb-3" />
            <p className="text-sm">No workflow suggestions yet.</p>
            <p className="text-xs mt-1">
              Relay will learn your patterns and suggest automations as you use
              it.
            </p>
          </div>
        )}

        {!loading &&
          suggestions.map((s) => (
            <Card key={s.id} className="border-border">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Sparkles className="size-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm font-medium">
                      {describeWorkflow(s)}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="size-3" />
                        Detected {s.count} time{s.count !== 1 ? "s" : ""} in
                        the last 30 days
                      </span>
                      <Badge
                        variant="secondary"
                        className="text-[10px] h-4 px-1.5"
                      >
                        {Math.round(s.confidence * 100)}% confidence
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-green-600 hover:text-green-700"
                      disabled={acting === s.id}
                      onClick={() => handleAccept(s.id)}
                    >
                      {acting === s.id ? (
                        <Loader2 className="size-3 mr-1 animate-spin" />
                      ) : (
                        <Check className="size-3 mr-1" />
                      )}
                      Enable
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-muted-foreground"
                      disabled={acting === s.id}
                      onClick={() => handleDismiss(s.id)}
                    >
                      <X className="size-3 mr-1" />
                      Dismiss
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}
