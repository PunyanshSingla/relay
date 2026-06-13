"use client";

import { Sparkles, Copy, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ReplyMode = "short" | "professional" | "friendly" | "generate";

interface AIReplyPanelProps {
  activeMode: ReplyMode;
  onModeChange: (mode: ReplyMode) => void;
}

const modes: { id: ReplyMode; label: string }[] = [
  { id: "short", label: "Short" },
  { id: "professional", label: "Professional" },
  { id: "friendly", label: "Friendly" },
  { id: "generate", label: "Generate" },
];

export function AIReplyPanel({ activeMode, onModeChange }: AIReplyPanelProps) {
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
              onClick={() => onModeChange(mode.id)}
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
        {/* Skeleton loading placeholder */}
        <div className="space-y-2">
          <div className="h-3 bg-muted rounded w-full animate-pulse" />
          <div className="h-3 bg-muted rounded w-4/5 animate-pulse" />
          <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Button variant="outline" size="sm" disabled>
            <Copy className="size-3 mr-1" />
            Copy
          </Button>
          <Button variant="outline" size="sm" disabled>
            <Check className="size-3 mr-1" />
            Insert
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
