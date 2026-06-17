export interface CalendarEvent {
  id?: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: { dateTime?: string; date?: string; timeZone?: string };
  end?: { dateTime?: string; date?: string; timeZone?: string };
  status?: string;
  htmlLink?: string;
  attendees?: Array<{ email?: string; displayName?: string; responseStatus?: string }>;
  eventType?: string;
}

export type ViewType = "month" | "week" | "day";

export interface PositionedEvent {
  event: CalendarEvent;
  top: number;
  height: number;
  left: number;
  width: number;
  column: number;
  totalColumns: number;
}

export const HOUR_HEIGHT = 64;
export const GRID_START_HOUR = 6;
export const GRID_END_HOUR = 22;
export const TOTAL_HOURS = GRID_END_HOUR - GRID_START_HOUR;
