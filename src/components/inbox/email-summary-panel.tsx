"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EmailSummary {
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  sentiment: "positive" | "neutral" | "negative" | "urgent";
}

interface EmailSummaryPanelProps {
  emailId: string;
}

const SENTIMENT_CONFIG = {
  positive: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10", label: "Positive" },
  neutral: { icon: Sparkles, color: "text-blue-500", bg: "bg-blue-500/10", label: "Neutral" },
  negative: { icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-500/10", label: "Concern" },
  urgent: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10", label: "Urgent" },
};

export function EmailSummaryPanel({ emailId }: EmailSummaryPanelProps) {
  const [summary, setSummary] = useState<EmailSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (fetched) return;
    setLoading(true);
    setError(null);

    fetch(`/api/emails/${emailId}/summary`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load summary");
        return res.json();
      })
      .then((data) => {
        setSummary(data.summary);
        setFetched(true);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load summary");
      })
      .finally(() => setLoading(false));
  }, [emailId, fetched]);

  const regenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/emails/${emailId}/summary`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to regenerate");
      const data = await res.json();
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to regenerate");
    } finally {
      setLoading(false);
    }
  };

  // Don't show panel if not loaded yet and not loading
  if (!loading && !summary && !error) return null;

  const sentimentConfig = summary ? SENTIMENT_CONFIG[summary.sentiment] : null;
  const SentimentIcon = sentimentConfig?.icon;

  return (
    <div className="rounded-lg border border-border bg-muted/30 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full px-3 py-2.5 text-left hover:bg-muted/50 transition-colors"
      >
        <Sparkles className="size-4 text-primary shrink-0" />
        <span className="text-sm font-medium">AI Summary</span>

        {summary && sentimentConfig && (
          <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-medium", sentimentConfig.bg, sentimentConfig.color)}>
            {sentimentConfig.label}
          </span>
        )}

        {loading && (
          <Loader2 className="size-3.5 animate-spin text-muted-foreground ml-auto" />
        )}

        {!loading && summary && (
          <button
            onClick={(e) => { e.stopPropagation(); regenerate(); }}
            className="ml-auto p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Regenerate summary"
          >
            <RefreshCw className="size-3" />
          </button>
        )}

        {expanded ? (
          <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
        )}
      </button>

      {/* Content */}
      {expanded && (
        <div className="px-3 pb-3 space-y-3">
          {loading && !summary && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <Loader2 className="size-4 animate-spin" />
              Generating summary...
            </div>
          )}

          {error && !summary && (
            <div className="text-sm text-destructive py-2">{error}</div>
          )}

          {summary && (
            <>
              {/* Summary text */}
              <p className="text-sm text-foreground leading-relaxed">{summary.summary}</p>

              {/* Key Points */}
              {summary.keyPoints.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-1.5">Key Points</h4>
                  <ul className="space-y-1">
                    {summary.keyPoints.map((point, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                        <span className="size-1.5 rounded-full bg-primary/60 mt-1.5 shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Items */}
              {summary.actionItems.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                    <Clock className="size-3" />
                    Action Items
                  </h4>
                  <ul className="space-y-1">
                    {summary.actionItems.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                        <span className="size-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
