"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "./calendar-types";
import { HOUR_HEIGHT, GRID_START_HOUR, GRID_END_HOUR, TOTAL_HOURS } from "./calendar-types";
import { TimeGridEvent, layoutEvents } from "./time-grid-event";
import { isToday, dayKey } from "./calendar-utils";

interface TimeGridProps {
  days: Date[];
  timedByDay: Map<string, CalendarEvent[]>;
  onEventClick?: (event: CalendarEvent) => void;
  onTimeSlotClick?: (date: Date, hour: number) => void;
}

export function TimeGrid({ days, timedByDay, onEventClick, onTimeSlotClick }: TimeGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to 8 AM or current time
  useEffect(() => {
    if (!scrollRef.current) return;
    const targetHour = isToday(days[0])
      ? Math.max(GRID_START_HOUR, Math.min(now.getHours() - 1, GRID_END_HOUR - 2))
      : 8;
    const scrollTop = (targetHour - GRID_START_HOUR) * HOUR_HEIGHT;
    scrollRef.current.scrollTop = scrollTop;
  }, [days, now]);

  const hours = useMemo(
    () => Array.from({ length: TOTAL_HOURS }, (_, i) => GRID_START_HOUR + i),
    [],
  );

  const showCurrentTime = days.some(isToday);
  const todayIndex = days.findIndex(isToday);

  const nowTop = useMemo(() => {
    if (!showCurrentTime) return 0;
    const h = now.getHours() + now.getMinutes() / 60;
    return (h - GRID_START_HOUR) * HOUR_HEIGHT;
  }, [now, showCurrentTime]);

  const handleClick = (e: React.MouseEvent, dayIndex: number) => {
    if (!onTimeSlotClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top + (scrollRef.current?.scrollTop ?? 0);
    const hour = Math.floor(y / HOUR_HEIGHT) + GRID_START_HOUR;
    const clamped = Math.max(GRID_START_HOUR, Math.min(hour, GRID_END_HOUR - 1));
    onTimeSlotClick(days[dayIndex], clamped);
  };

  return (
    <div className="flex flex-col min-h-0 flex-1">
      {/* Day headers */}
      <div className="flex border-b border-border shrink-0">
        {/* Time gutter */}
        <div className="w-16 shrink-0" />
        {days.map((day, i) => {
          const today = isToday(day);
          return (
            <div
              key={i}
              className={cn(
                "flex-1 flex flex-col items-center py-2 border-l border-border",
                today && "bg-primary/5",
              )}
            >
              <span className="text-[10px] uppercase text-muted-foreground font-medium">
                {day.toLocaleDateString([], { weekday: "short" })}
              </span>
              <span
                className={cn(
                  "inline-flex size-7 items-center justify-center rounded-full text-sm font-semibold tabular-nums",
                  today && "bg-primary text-primary-foreground",
                  !today && "text-foreground",
                )}
              >
                {day.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Scrollable grid */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
        <div className="flex" style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px` }}>
          {/* Time gutter */}
          <div className="w-16 shrink-0 relative">
            {hours.map((hour) => (
              <div
                key={hour}
                className="absolute left-0 right-0 flex items-start justify-end pr-2 -mt-2"
                style={{ top: `${(hour - GRID_START_HOUR) * HOUR_HEIGHT}px` }}
              >
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {hour === 0
                    ? "12 AM"
                    : hour < 12
                      ? `${hour} AM`
                      : hour === 12
                        ? "12 PM"
                        : `${hour - 12} PM`}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day, dayIndex) => {
            const key = dayKey(day);
            const events = timedByDay.get(key) ?? [];
            const positioned = layoutEvents(events);
            const today = isToday(day);

            return (
              <div
                key={dayIndex}
                className="flex-1 relative border-l border-border"
                onClick={(e) => handleClick(e, dayIndex)}
              >
                {/* Hour lines */}
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="absolute left-0 right-0 border-t border-border"
                    style={{ top: `${(hour - GRID_START_HOUR) * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
                  >
                    {/* Half-hour line */}
                    <div
                      className="absolute left-0 right-0 border-t border-border/50 border-dashed"
                      style={{ top: `${HOUR_HEIGHT / 2}px` }}
                    />
                  </div>
                ))}

                {/* Events */}
                {positioned.map((pe) => (
                  <TimeGridEvent
                    key={pe.event.id ?? pe.top}
                    event={pe.event}
                    onClick={onEventClick}
                  />
                ))}

                {/* Current time indicator */}
                {today && (
                  <div
                    className="absolute left-0 right-0 z-20 pointer-events-none"
                    style={{ top: `${nowTop}px` }}
                  >
                    <div className="relative flex items-center">
                      <div className="size-2.5 rounded-full bg-red-500 -ml-1.5" />
                      <div className="flex-1 h-0.5 bg-red-500" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
