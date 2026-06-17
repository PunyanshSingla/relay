import type { CalendarEvent } from "./calendar-types";

export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isToday(d: Date): boolean {
  return isSameDay(d, new Date());
}

export function isCurrentMonth(d: Date, year: number, month: number): boolean {
  return d.getMonth() === month && d.getFullYear() === year;
}

export function isAllDayEvent(event: CalendarEvent): boolean {
  return !!(event.start?.date && !event.start?.dateTime);
}

export function getEventDateSpan(event: CalendarEvent): Date[] {
  const startStr = event.start?.date ?? event.start?.dateTime;
  const endStr = event.end?.date ?? event.end?.dateTime;
  if (!startStr) return [];

  const start = new Date(startStr);
  const allDay = isAllDayEvent(event);
  if (!endStr) return [start];

  const end = new Date(endStr);
  const lastDay = allDay
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

export function getBarColor(status?: string): string {
  const colors: Record<string, string> = {
    confirmed: "bg-emerald-500",
    tentative: "bg-amber-500",
    cancelled: "bg-red-500",
  };
  return colors[status ?? ""] ?? "bg-blue-500";
}

export function getBarColorHex(status?: string): string {
  const colors: Record<string, string> = {
    confirmed: "#22c55e",
    tentative: "#f59e0b",
    cancelled: "#ef4444",
  };
  return colors[status ?? ""] ?? "#3b82f6";
}

export function formatTime(
  start?: { dateTime?: string; date?: string },
  end?: { dateTime?: string; date?: string },
): string {
  const dateStr = start?.dateTime ?? start?.date;
  if (!dateStr) return "";
  if (isAllDayEvent({ start })) return "";
  return new Date(dateStr).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatTimeShort(date: Date): string {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function getMonthDays(year: number, month: number): Date[] {
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

export function getWeekDays(date: Date): Date[] {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    return new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
  });
}

export function indexEventsByDay(events: CalendarEvent[]) {
  const allDayByDay = new Map<string, CalendarEvent[]>();
  const timedByDay = new Map<string, CalendarEvent[]>();

  for (const event of events) {
    const spanDays = getEventDateSpan(event);
    const allDay = isAllDayEvent(event);
    for (const d of spanDays) {
      const key = dayKey(d);
      const target = allDay ? allDayByDay : timedByDay;
      if (!target.has(key)) target.set(key, []);
      target.get(key)!.push(event);
    }
  }

  for (const arr of allDayByDay.values())
    arr.sort((a, b) => (a.summary ?? "").localeCompare(b.summary ?? ""));
  for (const arr of timedByDay.values())
    arr.sort((a, b) => {
      const aStr = a.start?.dateTime ?? a.start?.date ?? "";
      const bStr = b.start?.dateTime ?? b.start?.date ?? "";
      return aStr.localeCompare(bStr);
    });

  return { allDayByDay, timedByDay };
}
