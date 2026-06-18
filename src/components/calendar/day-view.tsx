"use client";

import type { CalendarEvent } from "./calendar-types";
import { TimeGrid } from "./time-grid";
import { indexEventsByDay, dayKey, isAllDayEvent, getBarColor, getEventDateSpan, isSameDay } from "./calendar-utils";

interface DayViewProps {
  events: CalendarEvent[];
  currentDate: Date;
  onEventClick?: (event: CalendarEvent) => void;
  onTimeSlotClick?: (date: Date, hour: number) => void;
}

export function DayView({ events, currentDate, onEventClick, onTimeSlotClick }: DayViewProps) {
  const key = dayKey(currentDate);
  const { allDayByDay, timedByDay } = indexEventsByDay(events);
  const dayAllDay = allDayByDay.get(key) ?? [];

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* All-day events row */}
      {dayAllDay.length > 0 && (
        <div className="flex border-b border-border shrink-0">
          <div className="w-16 shrink-0 flex items-center justify-end pr-2">
            <span className="text-[10px] text-muted-foreground">All day</span>
          </div>
          <div className="flex-1 flex p-0.5 gap-1 min-h-[28px]">
            {dayAllDay.map((ev, j) => (
              <div
                key={j}
                className={`rounded-sm px-2 py-1 text-[11px] leading-tight ${getBarColor(ev.status)} text-white`}
              >
                {ev.summary || "Busy"}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Time grid — single column */}
      <TimeGrid
        days={[currentDate]}
        timedByDay={timedByDay}
        onEventClick={onEventClick}
        onTimeSlotClick={onTimeSlotClick}
      />
    </div>
  );
}
