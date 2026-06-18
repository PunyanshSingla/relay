"use client";

import { cn } from "@/lib/utils";
import type { CalendarEvent } from "./calendar-types";
import {
  getMonthDays,
  indexEventsByDay,
  dayKey,
  isToday,
  isCurrentMonth,
  isSameDay,
  isAllDayEvent,
  getBarColor,
  getEventDateSpan,
  formatTime,
} from "./calendar-utils";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface MonthViewProps {
  events: CalendarEvent[];
  currentDate: Date;
  selectedDate: Date | null;
  onDayClick: (date: Date) => void;
  onDayDoubleClick: (date: Date) => void;
}

export function MonthView({ events, currentDate, selectedDate, onDayClick, onDayDoubleClick }: MonthViewProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = getMonthDays(year, month);
  const { allDayByDay, timedByDay } = indexEventsByDay(events);

  const maxEvents = 2;
  const maxAllDay = 2;

  return (
    <div className="space-y-0">
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
              type="button"
              key={dKey}
              onClick={() => onDayClick(day)}
              onDoubleClick={() => onDayDoubleClick(day)}
              className={cn(
                "group relative flex flex-col border-r border-b border-border p-1 transition-colors",
                "min-h-[5rem] sm:min-h-[6.5rem]",
                i % 7 === 0 && "border-l",
                curMonth ? "hover:bg-muted/30" : "opacity-40 hover:opacity-60",
                isSelected && "ring-1 ring-inset ring-primary/30 bg-primary/5",
              )}
            >
              {/* Day number */}
              <div className="flex items-center gap-1.5 px-0.5">
                <span
                  className={cn(
                    "inline-flex size-6 shrink-0 items-center justify-center rounded-full text-xs tabular-nums",
                    today && "bg-primary text-primary-foreground font-semibold",
                    !today && !curMonth && "text-muted-foreground",
                    !today && curMonth && "text-foreground",
                  )}
                >
                  {day.getDate()}
                </span>
                {totalEvents > maxEvents + maxAllDay && curMonth && (
                  <span className="text-[10px] text-muted-foreground">{totalEvents}</span>
                )}
              </div>

              {/* All-day events */}
              {allDayEvents.length > 0 && (
                <div className="mt-0.5 w-full space-y-0.5">
                  {allDayEvents.slice(0, maxAllDay).map((ev, j) => {
                    const span = getEventDateSpan(ev);
                    const isFirst = span[0] && isSameDay(span[0], day);
                    return (
                      <div
                        key={`a-${j}`}
                        className={cn(
                          "flex items-center rounded-sm px-1 py-px text-[10px] leading-tight",
                          getBarColor(ev.status),
                          "text-primary-foreground",
                        )}
                      >
                        <span className="truncate">{isFirst ? (ev.summary || "Busy") : ""}</span>
                      </div>
                    );
                  })}
                  {allDayEvents.length > maxAllDay && (
                    <span className="px-1 text-[10px] text-muted-foreground">
                      +{allDayEvents.length - maxAllDay}
                    </span>
                  )}
                </div>
              )}

              {/* Timed events */}
              <div className="mt-0.5 flex w-full flex-col gap-0.5">
                {timedEvents.slice(0, maxEvents).map((ev, j) => {
                  const span = getEventDateSpan(ev);
                  const isFirst = span[0] && isSameDay(span[0], day);
                  const isContinuation = !isFirst;

                  return (
                    <div
                      key={`t-${j}`}
                      className={cn(
                        "flex items-center gap-1 rounded-sm px-1 py-0.5 text-left text-[11px] leading-tight",
                        "hover:brightness-90",
                        isFirst && getBarColor(ev.status),
                        isFirst && "text-primary-foreground",
                        isContinuation && "bg-muted",
                      )}
                    >
                      <span className={cn("h-2.5 w-0.5 shrink-0 rounded-full", getBarColor(ev.status), isFirst && "bg-white/50")} />
                      <div className="flex min-w-0 gap-1">
                        {formatTime(ev.start, ev.end) && (
                          <span className="shrink-0 font-medium">{formatTime(ev.start, ev.end)}</span>
                        )}
                        <span className="truncate">{isFirst ? (ev.summary || "(no title)") : "↳"}</span>
                      </div>
                    </div>
                  );
                })}
                {timedEvents.length > maxEvents && (
                  <span className="px-1 text-[10px] text-muted-foreground">
                    +{timedEvents.length - maxEvents} more
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
