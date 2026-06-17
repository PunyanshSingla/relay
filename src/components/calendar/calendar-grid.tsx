"use client";

import { useMemo, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CalendarEvent, ViewType } from "./calendar-types";
import { MonthView } from "./month-view";
import { WeekView } from "./week-view";
import { DayView } from "./day-view";

interface CalendarGridProps {
  events: CalendarEvent[];
  currentDate: Date;
  selectedDate: Date | null;
  onDateChange: (date: Date) => void;
  onDayClick: (date: Date) => void;
  onDayDoubleClick: (date: Date) => void;
  view: ViewType;
  onViewChange: (view: ViewType) => void;
  onEventClick?: (event: CalendarEvent) => void;
}

export function CalendarGrid({
  events,
  currentDate,
  selectedDate,
  onDateChange,
  onDayClick,
  onDayDoubleClick,
  view,
  onViewChange,
  onEventClick,
}: CalendarGridProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const clone = new Date(currentDate);

      switch (e.key) {
        case "ArrowLeft":
          clone.setDate(clone.getDate() - 1);
          onDateChange(clone);
          break;
        case "ArrowRight":
          clone.setDate(clone.getDate() + 1);
          onDateChange(clone);
          break;
        case "ArrowUp":
          clone.setDate(clone.getDate() - (view === "month" ? 7 : 1));
          onDateChange(clone);
          break;
        case "ArrowDown":
          clone.setDate(clone.getDate() + (view === "month" ? 7 : 1));
          onDateChange(clone);
          break;
        case "t":
          onDateChange(new Date());
          break;
      }
    },
    [currentDate, view, onDateChange],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Title
  const title = useMemo(() => {
    if (view === "month") {
      return currentDate.toLocaleDateString([], { month: "long", year: "numeric" });
    }
    if (view === "day") {
      return currentDate.toLocaleDateString([], {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
    // week
    const start = new Date(currentDate);
    start.setDate(currentDate.getDate() - currentDate.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const fmt = (d: Date) => d.toLocaleDateString([], { month: "short", day: "numeric" });
    if (start.getMonth() === end.getMonth())
      return `${start.toLocaleDateString([], { month: "long" })} ${start.getDate()} – ${end.getDate()}, ${start.getFullYear()}`;
    return `${fmt(start)} – ${fmt(end)}, ${end.getFullYear()}`;
  }, [currentDate, view]);

  const handlePrev = () => {
    const d = new Date(currentDate);
    if (view === "month") onDateChange(new Date(year, month - 1, 1));
    else if (view === "week") { d.setDate(d.getDate() - 7); onDateChange(d); }
    else { d.setDate(d.getDate() - 1); onDateChange(d); }
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (view === "month") onDateChange(new Date(year, month + 1, 1));
    else if (view === "week") { d.setDate(d.getDate() + 7); onDateChange(d); }
    else { d.setDate(d.getDate() + 1); onDateChange(d); }
  };

  const handleTimeSlotClick = (date: Date, hour: number) => {
    const d = new Date(date);
    d.setHours(hour, 0, 0, 0);
    onDayDoubleClick(d);
  };

  const isTimeGridView = view === "week" || view === "day";

  return (
    <div className={cn("flex flex-col", isTimeGridView ? "h-full min-h-0" : "")}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 shrink-0">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-xs" onClick={handlePrev}>
            <ChevronLeft className="size-4" />
          </Button>
          <h2 className="min-w-36 text-center font-display text-base font-semibold">{title}</h2>
          <Button variant="ghost" size="icon-xs" onClick={handleNext}>
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => onDateChange(new Date())}
            className="ml-2 h-6 text-xs text-primary hover:text-primary"
          >
            Today
          </Button>
        </div>
        <div className="flex rounded-lg bg-muted p-0.5">
          {(["month", "week", "day"] as ViewType[]).map((v) => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              className={cn(
                "relative inline-flex items-center justify-center rounded-md px-3 py-1 text-xs font-medium transition-all capitalize",
                view === v
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* View content */}
      {view === "month" && (
        <MonthView
          events={events}
          currentDate={currentDate}
          selectedDate={selectedDate}
          onDayClick={onDayClick}
          onDayDoubleClick={onDayDoubleClick}
        />
      )}
      {view === "week" && (
        <div className="flex-1 min-h-0">
          <WeekView
            events={events}
            currentDate={currentDate}
            onEventClick={onEventClick}
            onTimeSlotClick={handleTimeSlotClick}
          />
        </div>
      )}
      {view === "day" && (
        <div className="flex-1 min-h-0">
          <DayView
            events={events}
            currentDate={currentDate}
            onEventClick={onEventClick}
            onTimeSlotClick={handleTimeSlotClick}
          />
        </div>
      )}

      {/* Keyboard shortcuts (month view only) */}
      {view === "month" && (
        <div className="flex items-center justify-center gap-3 pb-3 text-[10px] text-muted-foreground">
          <span>
            <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">← →</kbd> Navigate
          </span>
          <span>
            <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">↑ ↓</kbd> Jump weeks
          </span>
          <span>
            <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">T</kbd> Today
          </span>
        </div>
      )}
    </div>
  );
}
