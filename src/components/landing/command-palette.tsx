"use client";

import { useState, useEffect } from "react";
import { Search, Calendar, Mail, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Kbd } from "./kbd";

const RESULTS = [
  { icon: Calendar, label: "Create event · Thursday Jun 18, 9:00 AM", hint: "Calendar" },
  { icon: Mail, label: "Draft email · 'Looking forward to our meeting'", hint: "Gmail" },
  { icon: Bot, label: "Run with Relay Agent", hint: "MCP" },
  { icon: Search, label: "Search 'corsair' across inbox", hint: "Search" },
] as const;

const FULL_TEXT = "Schedule meeting with friend@corsair.dev next Thursday 9am";

export function CommandPalette() {
  const [displayText, setDisplayText] = useState("");
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i <= FULL_TEXT.length) {
        setDisplayText(FULL_TEXT.slice(0, i));
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => setShowResults(true), 300);
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      <div
        className="absolute inset-0 -z-10 blur-3xl"
        style={{ background: "var(--gradient-primary)", opacity: 0.12 }}
      />
      <Card className="overflow-hidden border-border shadow-[var(--shadow-elegant)]">
        <div className="flex items-center gap-2 border-b border-border bg-surface/60 px-4 py-3">
          <Search className="size-4 text-muted-foreground" />
          <span className="text-sm">
            {displayText}
            <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-primary" />
          </span>
          <span className="ml-auto">
            <Kbd>↵</Kbd>
          </span>
        </div>
        <CardContent className="p-2">
          {RESULTS.map((r, i) => (
            <div
              key={r.label}
              className={cn(
                "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-opacity",
                i === 0 && "bg-surface-2",
                showResults ? "opacity-100" : "opacity-0"
              )}
              style={{ transitionDelay: showResults ? `${i * 100}ms` : "0ms" }}
            >
              <span className="flex items-center gap-3">
                <span className="flex size-7 items-center justify-center rounded-md bg-surface-2">
                  <r.icon className="size-3.5 text-primary" />
                </span>
                {r.label}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {r.hint}
              </span>
            </div>
          ))}
        </CardContent>
        <div className="flex items-center justify-between border-t border-border bg-surface/60 px-4 py-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-2">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> navigate
          </span>
          <span className="flex items-center gap-2">
            <Kbd>↵</Kbd> run · <Kbd>esc</Kbd> close
          </span>
        </div>
      </Card>
    </div>
  );
}
