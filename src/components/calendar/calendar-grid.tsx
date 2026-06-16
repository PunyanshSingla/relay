"use client";

import { useMemo, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CalendarEvent {
  id?: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  location?: string;
  status?: string;
}

interface CalendarGridProps {
  events: CalendarEvent[];
  currentDate: Date;
  selectedDate: Date | null;
  onDateChange: (date: Date) => void;
  onDayClick: (date: Date) => void;
  onDayDoubleClick: (date: Date) => void;
  view: "month" | "week";
  onViewChange: (view: "month" | "week") => void;
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const statusBarColors: Record<string, string> = {
  confirmed: "bg-emerald-500",
  tentative: "bg-amber-500",
  cancelled: "bg-red-500",
};

function getBarColor(status?: string) {
  return status && statusBarColors[status] ? statusBarColors[status] : "bg-blue-500";
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isToday(d: Date) {
  return isSameDay(d, new Date());
}

function isCurrentMonth(d: Date, year: number, month: number) {
  return d.getMonth() === month && d.getFullYear() === year;
}

function getEventDateSpan(event: CalendarEvent): Date[] {
  const startStr = event.start?.date ?? event.start?.dateTime;
  const endStr = event.end?.date ?? event.end?.dateTime;
  if (!startStr) return [];

  const start = new Date(startStr);
  const isAllDay = !!(event.start?.date && !event.start?.dateTime);
  if (!endStr) return [start];

  const end = new Date(endStr);
  const lastDay = isAllDay
    ? new Date(end.getFullYear(), end.getMonth(), end.getDate() - 1)
    : end;
  if (lastDay <= start) return [start];

  const days: Date[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const boundary = new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate());
  while (cursor <= boundary) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function isAllDayEvent(event: CalendarEvent) {
  return !!(event.start?.date && !event.start?.dateTime);
}

function formatTime(start?: { dateTime?: string; date?: string }, end?: { dateTime?: string; date?: string }) {
  const dateStr = start?.date ?? start?.dateTime;
  if (!dateStr) return "";
  if (isAllDayEvent({ start, end })) return "";
  return new Date(dateStr).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();
  const totalDays = lastDay.getDate();
  const days: Date[] = [];

  for (let i = startOffset - 1; i >= 0; i--) days.push(new Date(year, month, -i));
  for (let d = 1; d <= totalDays; d++) days.push(new Date(year, month, d));
  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) days.push(new Date(year, month + 1, i));
  }
  return days;
}

function getWeekDays(date: Date) {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    return new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
  });
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
}: CalendarGridProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const days = useMemo(
    () => (view === "month" ? getMonthDays(year, month) : getWeekDays(currentDate)),
    [year, month, view, currentDate]
  );

  // Index by day key, split into all-day and timed
  const { allDayByDay, timedByDay } = useMemo(() => {
    const allDay = new Map<string, CalendarEvent[]>();
    const timed = new Map<string, CalendarEvent[]>();

    for (const event of events) {
      const spanDays = getEventDateSpan(event);
      const isAllDay = isAllDayEvent(event);
      for (const d of spanDays) {
        const key = dayKey(d);
        const target = isAllDay ? allDay : timed;
        if (!target.has(key)) target.set(key, []);
        target.get(key)!.push(event);
      }
    }

    for (const arr of allDay.values()) arr.sort((a, b) => (a.summary ?? "").localeCompare(b.summary ?? ""));
    for (const arr of timed.values()) arr.sort((a, b) => {
      const aStr = a.start?.dateTime ?? a.start?.date ?? "";
      const bStr = b.start?.dateTime ?? b.start?.date ?? "";
      return aStr.localeCompare(bStr);
    });

    return { allDayByDay: allDay, timedByDay: timed };
  }, [events]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const step = view === "month" ? 7 : 1;
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
          clone.setDate(clone.getDate() - step);
          onDateChange(clone);
          break;
        case "ArrowDown":
          clone.setDate(clone.getDate() + step);
          onDateChange(clone);
          break;
        case "t":
          onDateChange(new Date());
          break;
      }
    },
    [currentDate, view, onDateChange]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const title =
    view === "month"
      ? currentDate.toLocaleDateString([], { month: "long", year: "numeric" })
      : (() => {
          const s = days[0];
          const e = days[6];
          const fmt = (d: Date) => d.toLocaleDateString([], { month: "short", day: "numeric" });
          if (s.getMonth() === e.getMonth())
            return `${s.toLocaleDateString([], { month: "long" })} ${s.getDate()} – ${e.getDate()}, ${e.getFullYear()}`;
          return `${fmt(s)} – ${fmt(e)}, ${e.getFullYear()}`;
        })();

  const handlePrev = () => {
    if (view === "month") onDateChange(new Date(year, month - 1, 1));
    else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      onDateChange(d);
    }
  };

  const handleNext = () => {
    if (view === "month") onDateChange(new Date(year, month + 1, 1));
    else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      onDateChange(d);
    }
  };

  const maxEvents = view === "month" ? 2 : 4;
  const maxAllDay = 2;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-xs" onClick={handlePrev}>
            <ChevronLeft className="size-4" />
          </Button>
          <h2 className="min-w-36 text-center font-display text-base font-semibold">{title}</h2>
          <Button variant="ghost" size="icon-xs" onClick={handleNext}>
            <ChevronRight className="size-4" />
          </Button>
          <Button variant="ghost" size="xs" onClick={() => onDateChange(new Date())} className="ml-2 h-6 text-xs text-primary hover:text-primary">
            Today
          </Button>
        </div>
        <div className="flex rounded-lg bg-muted p-0.5">
          <button onClick={() => onViewChange("month")} className={cn("relative inline-flex items-center justify-center rounded-md px-3 py-1 text-xs font-medium transition-all", view === "month" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            Month
          </button>
          <button onClick={() => onViewChange("week")} className={cn("relative inline-flex items-center justify-center rounded-md px-3 py-1 text-xs font-medium transition-all", view === "week" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            Week
          </button>
        </div>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day} className="flex h-8 items-center justify-center text-xs font-medium text-muted-foreground">
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day[0]}</span>
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const dKey = dayKey(day);
          const allDayEvents = allDayByDay.get(dKey) ?? [];
          const timedEvents = timedByDay.get(dKey) ?? [];
          const totalEvents = allDayEvents.length + timedEvents.length;
          const today = isToday(day);
          const curMonth = isCurrentMonth(day, year, month);
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;

          return (
            <button
              key={i}
              onClick={() => onDayClick(day)}
              onDoubleClick={() => onDayDoubleClick(day)}
              className={cn(
                "group relative flex flex-col border-r border-b border-border p-1 transition-colors",
                "min-h-[5rem] sm:min-h-[6.5rem]",
                i % 7 === 0 && "border-l",
                curMonth ? "hover:bg-muted/30" : "opacity-40 hover:opacity-60",
                isSelected && "ring-1 ring-inset ring-primary/30 bg-primary/5"
              )}
            >
              {/* Day number */}
              <div className="flex items-center gap-1.5 px-0.5">
                <span className={cn(
                  "inline-flex size-6 shrink-0 items-center justify-center rounded-full text-xs tabular-nums",
                  today && "bg-primary text-primary-foreground font-semibold",
                  !today && !curMonth && "text-muted-foreground",
                  !today && curMonth && "text-foreground"
                )}>
                  {day.getDate()}
                </span>
                {totalEvents > (maxEvents + maxAllDay) && curMonth && (
                  <span className="text-[10px] text-muted-foreground">{totalEvents}</span>
                )}
              </div>

              {/* All-day events */}
              {allDayEvents.length > 0 && (
                <div className="mt-0.5 w-full space-y-0.5">
                  {allDayEvents.slice(0, maxAllDay).map((ev, j) => {
                    const spanDays = getEventDateSpan(ev);
                    const isFirst = spanDays[0] && isSameDay(spanDays[0], day);
                    return (
                      <div key={`a-${j}`} className={cn("flex items-center rounded-sm px-1 py-px text-[10px] leading-tight", getBarColor(ev.status), "text-primary-foreground")}>
                        <span className="truncate">{isFirst ? (ev.summary || "Busy") : ""}</span>
                      </div>
                    );
                  })}
                  {allDayEvents.length > maxAllDay && (
                    <span className="px-1 text-[10px] text-muted-foreground">+{allDayEvents.length - maxAllDay}</span>
                  )}
                </div>
              )}

              {/* Timed events */}
              <div className="mt-0.5 flex w-full flex-col gap-0.5">
                {timedEvents.slice(0, maxEvents).map((ev, j) => {
                  const spanDays = getEventDateSpan(ev);
                  const isFirst = spanDays[0] && isSameDay(spanDays[0], day);
                  const isContinuation = !isFirst;

                  return (
                    <div
                      key={`t-${j}`}
                      className={cn(
                        "flex items-center gap-1 rounded-sm px-1 py-0.5 text-left text-[11px] leading-tight",
                        "hover:brightness-90",
                        isFirst && getBarColor(ev.status),
                        isFirst && "text-primary-foreground",
                        isContinuation && "bg-muted"
                      )}
                    >
                      <span className={cn("h-2.5 w-0.5 shrink-0 rounded-full", getBarColor(ev.status), isFirst && "bg-white/50")} />
                      <div className="flex min-w-0 gap-1">
                        {formatTime(ev.start, ev.end) && <span className="shrink-0 font-medium">{formatTime(ev.start, ev.end)}</span>}
                        <span className="truncate">{isFirst ? (ev.summary || "(no title)") : "↳"}</span>
                      </div>
                    </div>
                  );
                })}
                {timedEvents.length > maxEvents && (
                  <span className="px-1 text-[10px] text-muted-foreground">+{timedEvents.length - maxEvents} more</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Keyboard shortcuts hint */}
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
    </div>
  );
}
