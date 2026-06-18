"use client";

import { cn } from "@/lib/utils";
import type { CalendarEvent, PositionedEvent } from "./calendar-types";
import { HOUR_HEIGHT, GRID_START_HOUR, GRID_END_HOUR } from "./calendar-types";
import { getBarColorHex, isAllDayEvent, formatTimeShort } from "./calendar-utils";

interface TimeGridEventProps {
  event: CalendarEvent;
  onClick?: (event: CalendarEvent) => void;
}

export function TimeGridEvent({ event, onClick }: TimeGridEventProps) {
  const { top, height, left, width } = useEventPosition(event);

  const color = getBarColorHex(event.status);
  const startStr = event.start?.dateTime;
  const endStr = event.end?.dateTime;
  const startTime = startStr ? new Date(startStr) : null;
  const endTime = endStr ? new Date(endStr) : null;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(event);
      }}
      className="absolute rounded-sm text-left text-[11px] leading-tight overflow-hidden transition-opacity hover:opacity-90 cursor-pointer group"
      style={{
        top: `${top}px`,
        height: `${height}px`,
        left: `${left}%`,
        width: `${width}%`,
        backgroundColor: color,
        color: "#fff",
        zIndex: 10,
      }}
    >
      <div className="flex flex-col h-full p-1">
        <span className="font-medium truncate text-[11px]">{event.summary || "(no title)"}</span>
        {startTime && endTime && height > 30 && (
          <span className="text-[10px] opacity-80 truncate">
            {formatTimeShort(startTime)} – {formatTimeShort(endTime)}
          </span>
        )}
        {event.location && height > 50 && (
          <span className="text-[10px] opacity-70 truncate">📍 {event.location}</span>
        )}
      </div>
    </button>
  );
}

function useEventPosition(event: CalendarEvent) {
  const startStr = event.start?.dateTime;
  if (!startStr) return { top: 0, height: 30, left: 0, width: 100 };

  const start = new Date(startStr);
  const endStr = event.end?.dateTime;
  const end = endStr ? new Date(endStr) : new Date(start.getTime() + 60 * 60 * 1000);

  const startHour = start.getHours() + start.getMinutes() / 60;
  const endHour = end.getHours() + end.getMinutes() / 60;

  const top = Math.max(0, (startHour - GRID_START_HOUR) * HOUR_HEIGHT);
  const height = Math.max(((endHour - startHour) * HOUR_HEIGHT), 20);

  return { top, height, left: 0, width: 100 };
}

// Overlap layout algorithm
export function layoutEvents(events: CalendarEvent[]): PositionedEvent[] {
  if (events.length === 0) return [];

  // Sort by start time, then by duration (longer first)
  const sorted = events.toSorted((a, b) => {
    const aStart = a.start?.dateTime ?? a.start?.date ?? "";
    const bStart = b.start?.dateTime ?? b.start?.date ?? "";
    const cmp = aStart.localeCompare(bStart);
    if (cmp !== 0) return cmp;
    const aDur = getDuration(a);
    const bDur = getDuration(b);
    return bDur - aDur;
  });

  // Find collision groups
  const groups: CalendarEvent[][] = [];
  let currentGroup: CalendarEvent[] = [sorted[0]];
  let groupEnd = getEndTime(sorted[0]);

  for (let i = 1; i < sorted.length; i++) {
    const ev = sorted[i];
    const evStart = getStartTime(ev);

    if (evStart < groupEnd) {
      // Overlaps with current group
      currentGroup.push(ev);
      groupEnd = Math.max(groupEnd, getEndTime(ev));
    } else {
      groups.push(currentGroup);
      currentGroup = [ev];
      groupEnd = getEndTime(ev);
    }
  }
  groups.push(currentGroup);

  // Assign columns within each group
  const result: PositionedEvent[] = [];

  for (const group of groups) {
    const columns: CalendarEvent[][] = [];

    for (const ev of group) {
      const evStart = getStartTime(ev);
      let placed = false;

      for (let col = 0; col < columns.length; col++) {
        const lastInCol = columns[col][columns[col].length - 1];
        if (evStart >= getEndTime(lastInCol)) {
          columns[col].push(ev);
          placed = true;
          break;
        }
      }

      if (!placed) {
        columns.push([ev]);
      }
    }

    const totalColumns = columns.length;

    for (let col = 0; col < columns.length; col++) {
      for (const ev of columns[col]) {
        const startStr = ev.start?.dateTime;
        const endStr = ev.end?.dateTime;
        if (!startStr) continue;

        const start = new Date(startStr);
        const end = endStr ? new Date(endStr) : new Date(start.getTime() + 60 * 60 * 1000);

        const startHour = start.getHours() + start.getMinutes() / 60;
        const endHour = end.getHours() + end.getMinutes() / 60;

        const top = Math.max(0, (startHour - GRID_START_HOUR) * HOUR_HEIGHT);
        const height = Math.max((endHour - startHour) * HOUR_HEIGHT, 20);
        const width = 100 / totalColumns;
        const left = col * width;

        result.push({
          event: ev,
          top,
          height,
          left,
          width,
          column: col,
          totalColumns,
        });
      }
    }
  }

  return result;
}

function getStartTime(event: CalendarEvent): number {
  const str = event.start?.dateTime ?? event.start?.date;
  if (!str) return 0;
  const d = new Date(str);
  return d.getHours() + d.getMinutes() / 60;
}

function getEndTime(event: CalendarEvent): number {
  const str = event.end?.dateTime ?? event.end?.date;
  if (!str) return getStartTime(event) + 1;
  const d = new Date(str);
  return d.getHours() + d.getMinutes() / 60;
}

function getDuration(event: CalendarEvent): number {
  return getEndTime(event) - getStartTime(event);
}
