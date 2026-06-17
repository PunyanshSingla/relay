"use client";

import { useMemo } from "react";
import type { CalendarEvent } from "./calendar-types";
import { TimeGrid } from "./time-grid";
import { getWeekDays, indexEventsByDay, isToday, dayKey, isAllDayEvent, getBarColor, getEventDateSpan, isSameDay } from "./calendar-utils";

interface WeekViewProps {
  events: CalendarEvent[];
  currentDate: Date;
  onEventClick?: (event: CalendarEvent) => void;
  onTimeSlotClick?: (date: Date, hour: number) => void;
}

export function WeekView({ events, currentDate, onEventClick, onTimeSlotClick }: WeekViewProps) {
  const days = useMemo(() => getWeekDays(currentDate), [currentDate]);
  const { allDayByDay, timedByDay } = useMemo(() => indexEventsByDay(events), [events]);

  // Collect all unique all-day events across the week
  const allDayEvents = useMemo(() => {
    const seen = new Set<string>();
    const result: CalendarEvent[] = [];
    for (const day of days) {
      const key = dayKey(day);
      const events = allDayByDay.get(key) ?? [];
      for (const ev of events) {
        const id = ev.id ?? ev.summary;
        if (!seen.has(id)) {
          seen.add(id);
          result.push(ev);
        }
      }
    }
    return result;
  }, [days, allDayByDay]);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* All-day events row */}
      {allDayEvents.length > 0 && (
        <div className="flex border-b border-border shrink-0">
          <div className="w-16 shrink-0 flex items-center justify-end pr-2">
            <span className="text-[10px] text-muted-foreground">All day</span>
          </div>
          <div className="flex-1 flex">
            {days.map((day, i) => {
              const key = dayKey(day);
              const dayEvents = allDayByDay.get(key) ?? [];
              return (
                <div key={i} className="flex-1 border-l border-border p-0.5 space-y-0.5 min-h-[28px]">
                  {dayEvents.slice(0, 2).map((ev, j) => {
                    const span = getEventDateSpan(ev);
                    const isFirst = span[0] && isSameDay(span[0], day);
                    return (
                      <div
                        key={j}
                        className={`rounded-sm px-1 py-px text-[10px] leading-tight truncate ${getBarColor(ev.status)} text-white`}
                      >
                        {isFirst ? (ev.summary || "Busy") : ""}
                      </div>
                    );
                  })}
                  {dayEvents.length > 2 && (
                    <span className="text-[10px] text-muted-foreground px-1">
                      +{dayEvents.length - 2}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Time grid */}
      <TimeGrid
        days={days}
        timedByDay={timedByDay}
        onEventClick={onEventClick}
        onTimeSlotClick={onTimeSlotClick}
      />
    </div>
  );
}
