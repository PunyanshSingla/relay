"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  RefreshCw,
  Plus,
  Loader2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Loader2 as Loader2Icon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { CreateEventDialog } from "@/components/calendar/create-event-dialog";

interface CalendarEvent {
  id?: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: { dateTime?: string; date?: string; timeZone?: string };
  end?: { dateTime?: string; date?: string; timeZone?: string };
  attendees?: Array<{ email?: string; displayName?: string; responseStatus?: string }>;
  status?: string;
  htmlLink?: string;
  eventType?: string;
}

const responseStatusLabels: Record<string, string> = {
  accepted: "Accepted",
  declined: "Declined",
  tentative: "Maybe",
  needsAction: "Pending",
};

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

function formatEventTime(
  start?: { dateTime?: string; date?: string },
  end?: { dateTime?: string; date?: string }
): string {
  const dateStr = start?.date ?? start?.dateTime;
  const endStr = end?.date ?? end?.dateTime;
  if (!dateStr) return "";

  const s = new Date(dateStr);

  if (start?.date && !start?.dateTime) {
    const fmt = (d: Date) =>
      d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
    if (endStr) {
      const e = new Date(endStr);
      const endActual = new Date(e);
      endActual.setDate(endActual.getDate() - 1);
      if (isSameDay(s, endActual)) return `${fmt(s)} · All day`;
      return `${fmt(s)} – ${fmt(endActual)}`;
    }
    return `${fmt(s)} · All day`;
  }

  const timeStr = s.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (s.toDateString() === new Date().toDateString()) {
    if (endStr) {
      const e = new Date(endStr);
      if (!isSameDay(s, e)) {
        return `Today, ${timeStr} – ${e.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })} ${e.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
      }
      return `Today, ${timeStr} – ${e.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
    }
    return `Today, ${timeStr}`;
  }
  const date = s.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  if (endStr) {
    const e = new Date(endStr);
    if (!isSameDay(s, e)) {
      return `${date}, ${timeStr} – ${e.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })} ${e.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
    }
    return `${date}, ${timeStr} – ${e.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  }
  return `${date}, ${timeStr}`;
}

const statusBarColors: Record<string, string> = {
  confirmed: "bg-emerald-500",
  tentative: "bg-amber-500",
  cancelled: "bg-red-500",
};

function eventSpansDay(event: CalendarEvent, day: Date): boolean {
  const startStr = event.start?.date ?? event.start?.dateTime;
  const endStr = event.end?.date ?? event.end?.dateTime;
  if (!startStr) return false;

  const start = new Date(startStr);
  const isAllDay = !!(event.start?.date && !event.start?.dateTime);
  if (!endStr) return isSameDay(start, day);

  const end = new Date(endStr);
  const lastDay = isAllDay
    ? new Date(end.getFullYear(), end.getMonth(), end.getDate() - 1)
    : end;

  const clean = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayClean = clean(day);
  const startClean = clean(start);
  const endClean = clean(lastDay);
  return dayClean >= startClean && dayClean <= endClean;
}

// Mini calendar navigation
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function makeMiniDays(year: number, monthHint: number): Date[] {
  const startDay = new Date(year, monthHint, 1);
  const offset = startDay.getDay();
  const total = new Date(year, monthHint + 1, 0).getDate();
  const days: Date[] = [];
  for (let i = offset - 1; i >= 0; i--) days.push(new Date(year, monthHint, -i));
  for (let d = 1; d <= total; d++) days.push(new Date(year, monthHint, d));
  const r = 7 - (days.length % 7);
  if (r < 7) for (let i = 1; i <= r; i++) days.push(new Date(year, monthHint + 1, i));
  return days;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [prefillDate, setPrefillDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [meetingPrep, setMeetingPrep] = useState<string | null>(null);
  const [meetingPrepLoading, setMeetingPrepLoading] = useState(false);

  // Mini calendar state
  const [miniYear, setMiniYear] = useState(currentDate.getFullYear());
  const [miniMonth, setMiniMonth] = useState(currentDate.getMonth());

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      // Compute visible date range
      let rangeStart: Date;
      let rangeEnd: Date;

      if (view === "month") {
        rangeStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        rangeStart.setDate(1 - rangeStart.getDay());
        rangeEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        const endPad = 6 - rangeEnd.getDay();
        rangeEnd.setDate(rangeEnd.getDate() + endPad + 1);
      } else if (view === "day") {
        rangeStart = new Date(currentDate);
        rangeStart.setHours(0, 0, 0, 0);
        rangeEnd = new Date(currentDate);
        rangeEnd.setHours(23, 59, 59, 999);
      } else {
        rangeStart = new Date(currentDate);
        rangeStart.setDate(rangeStart.getDate() - rangeStart.getDay());
        rangeEnd = new Date(rangeStart);
        rangeEnd.setDate(rangeEnd.getDate() + 7);
      }

      const params = new URLSearchParams({
        limit: "100",
        timeMin: rangeStart.toISOString(),
        timeMax: rangeEnd.toISOString(),
      });

      const res = await fetch(`/api/calendar/events?${params}`);
      const data = await res.json();
      if (!res.ok) {
        console.error("[calendar] API error:", data.error);
        setEvents([]);
      } else if (data.events) {
        setEvents(data.events);
      }
    } catch (err) {
      console.error("Failed to load events:", err);
    } finally {
      setLoading(false);
      setInitialLoadDone(true);
    }
  }, [currentDate, view]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleRefresh = async () => {
    setSyncing(true);
    await fetchEvents();
    setSyncing(false);
  };

  const handleDayClick = (date: Date) => {
    if (selectedDate && isSameDay(date, selectedDate)) {
      setSelectedDate(null);
      setSelectedEvent(null);
      setMeetingPrep(null);
    } else {
      setSelectedDate(date);
      setSelectedEvent(null);
      setMeetingPrep(null);
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setMeetingPrep(null);
  };

  const handleGeneratePrep = async () => {
    if (!selectedEvent) return;
    setMeetingPrepLoading(true);
    setMeetingPrep(null);
    try {
      const res = await fetch(`/api/calendar/events/${selectedEvent.id}/prep`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: selectedEvent.summary,
          description: selectedEvent.description,
          attendees: (selectedEvent.attendees ?? []).map((a) => ({
            email: a.email ?? "",
            name: a.displayName,
          })),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setMeetingPrep(data.prep);
    } catch {
      setMeetingPrep("Failed to generate meeting prep. Please try again.");
    } finally {
      setMeetingPrepLoading(false);
    }
  };

  const handleDayDoubleClick = (date: Date) => {
    setPrefillDate(date);
    setCreateDialogOpen(true);
  };

  const handleCreateClick = () => {
    setPrefillDate(null);
    setCreateDialogOpen(true);
  };

  const handleCreateDialogClose = () => {
    setCreateDialogOpen(false);
    setPrefillDate(null);
    handleRefresh();
  };

  const jumpToMonth = (year: number, month: number) => {
    setCurrentDate(new Date(year, month, 1));
  };

  const selectedDayEvents =
    selectedDate ? events.filter((ev) => eventSpansDay(ev, selectedDate)) : [];

  const selectedDateLabel = selectedDate
    ? selectedDate.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })
    : "";

  const miniDays = useMemo(() => makeMiniDays(miniYear, miniMonth), [miniYear, miniMonth]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
          <p className="text-sm text-muted-foreground mt-1">Your schedule at a glance</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={syncing}>
            <RefreshCw className={syncing ? "animate-spin" : ""} />
            Refresh
          </Button>
          <Button size="sm" onClick={handleCreateClick}>
            <Plus />
            Create Event
          </Button>
        </div>
      </div>

      {/* Initial loading spinner */}
      {loading && !initialLoadDone ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : !initialLoadDone ? null : events.length === 0 ? (
        /* Only show connect-warning on first empty load */
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar className="size-16 text-muted-foreground/30 mb-4" />
            <h2 className="text-lg font-medium">No upcoming events</h2>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Connect your Google Calendar to see your events here.
            </p>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={syncing}>
              <RefreshCw className={syncing ? "animate-spin" : ""} />
              Refresh
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex gap-6">
          {/* Mini calendar sidebar */}
          <div className="hidden lg:block w-56 shrink-0 space-y-4">
            {/* Mini calendar */}
            <div className="rounded-xl border border-border bg-card p-3">
              <div className="mb-2 flex items-center justify-between">
                <Button variant="ghost" size="icon-xs" onClick={() => {
                  if (miniMonth === 0) { setMiniMonth(11); setMiniYear(miniYear - 1); }
                  else setMiniMonth(miniMonth - 1);
                }}>
                  <ChevronLeft className="size-3" />
                </Button>
                <button
                  onClick={() => jumpToMonth(miniYear, miniMonth)}
                  className="text-xs font-medium hover:text-primary transition-colors"
                >
                  {MONTHS_SHORT[miniMonth]} {miniYear}
                </button>
                <Button variant="ghost" size="icon-xs" onClick={() => {
                  if (miniMonth === 11) { setMiniMonth(0); setMiniYear(miniYear + 1); }
                  else setMiniMonth(miniMonth + 1);
                }}>
                  <ChevronRight className="size-3" />
                </Button>
              </div>
              <div className="grid grid-cols-7 gap-0.5 text-center">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                  <span key={d} className="text-[10px] font-medium text-muted-foreground py-0.5">{d}</span>
                ))}
                {miniDays.map((d, i) => {
                  const hasEvents = events.some((ev) => eventSpansDay(ev, d));
                  return (
                    <button
                      key={i}
                      onClick={() => jumpToMonth(d.getFullYear(), d.getMonth())}
                      className={cn(
                        "flex size-7 items-center justify-center rounded-full text-[11px] transition-colors",
                        "hover:bg-muted",
                        d.getMonth() !== miniMonth && "text-muted-foreground/40",
                        isToday(d) && "bg-primary text-primary-foreground font-semibold hover:bg-primary/80",
                        !isToday(d) && d.getMonth() === miniMonth && "text-foreground",
                      )}
                    >
                      {hasEvents && !isToday(d) ? (
                        <span className="relative">
                          {d.getDate()}
                          <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 size-1 rounded-full bg-primary" />
                        </span>
                      ) : (
                        d.getDate()
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Keyboard shortcuts */}
            <div className="rounded-xl border border-border bg-card p-3 space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground mb-1">Shortcuts</p>
              {[
                ["← →", "Day"],
                ["↑ ↓", "Week"],
                ["T", "Today"],
                ["Double-click", "New event"],
              ].map(([key, desc]) => (
                <div key={key} className="flex items-center justify-between text-xs">
                  <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">{key}</kbd>
                  <span className="text-muted-foreground">{desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Main calendar */}
          <div className="flex-1 min-w-0">
            <Card className="overflow-hidden">
              <CalendarGrid
                events={events}
                currentDate={currentDate}
                selectedDate={selectedDate}
                onDateChange={setCurrentDate}
                onDayClick={handleDayClick}
                onDayDoubleClick={handleDayDoubleClick}
                view={view}
                onViewChange={setView}
                onEventClick={handleEventClick}
              />
            </Card>
          </div>
        </div>
      )}

      {/* Day detail sheet */}
      <Sheet open={!!selectedDate && selectedDayEvents.length >= 0} onOpenChange={(open) => { if (!open) setSelectedDate(null); }}>
        <SheetContent side="right" className="w-80 sm:w-96 flex flex-col">
          {selectedDate && (
            <>
              <SheetHeader className="pb-4">
                <SheetTitle>{selectedDateLabel}</SheetTitle>
              </SheetHeader>

              {selectedDayEvents.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center text-center">
                  <Calendar className="size-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">No events this day</p>
                  <Button variant="outline" size="sm" onClick={() => handleDayDoubleClick(selectedDate)}>
                    <Plus />
                    Add event
                  </Button>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-4">
                  {selectedDayEvents.map((event, i) => {
                    const barColor =
                      event.status && statusBarColors[event.status]
                        ? statusBarColors[event.status]
                        : "bg-blue-500";
                    return (
                      <div key={event.id ?? i} className="flex gap-3">
                        <div className={barColor + " w-0.5 shrink-0 rounded-full"} />
                        <div className="flex-1 min-w-0 space-y-2">
                          <h3 className="text-sm font-semibold leading-snug">{event.summary || "(no title)"}</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="size-3 shrink-0" />
                            <span>{formatEventTime(event.start, event.end)}</span>
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <MapPin className="size-3 shrink-0" />
                              <span className="truncate">{event.location}</span>
                            </div>
                          )}
                          {event.description && (
                            <p className="text-xs text-muted-foreground leading-relaxed">{event.description}</p>
                          )}
                          <div className="flex flex-wrap gap-1.5">
                            {event.status === "cancelled" && <Badge variant="destructive" className="text-[10px] h-4 px-1">Cancelled</Badge>}
                            {event.eventType === "outOfOffice" && <Badge variant="secondary" className="text-[10px] h-4 px-1">Out of office</Badge>}
                            {event.eventType === "focusTime" && <Badge variant="secondary" className="text-[10px] h-4 px-1">Focus time</Badge>}
                          </div>
                          {event.attendees && event.attendees.length > 0 && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                                <Users className="size-3" />
                                <span>{event.attendees.length} attendee{event.attendees.length !== 1 ? "s" : ""}</span>
                              </div>
                              <div className="space-y-0.5 max-h-24 overflow-y-auto">
                                {event.attendees.slice(0, 8).map((a, j) => (
                                  <div key={j} className="flex items-center justify-between text-[11px]">
                                    <span className="truncate font-medium">{a.displayName || a.email}</span>
                                    {a.responseStatus && (
                                      <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                                        {responseStatusLabels[a.responseStatus] ?? a.responseStatus}
                                      </span>
                                    )}
                                  </div>
                                ))}
                                {event.attendees.length > 8 && (
                                  <p className="text-[10px] text-muted-foreground">+{event.attendees.length - 8} more</p>
                                )}
                              </div>
                            </div>
                          )}
                          {event.htmlLink && (
                            <Button variant="outline" size="xs" className="h-6 text-xs" asChild>
                              <a href={event.htmlLink} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="size-3" />
                                Open in Google Calendar
                              </a>
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="xs"
                            className="h-6 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEventClick(event);
                              handleGeneratePrep();
                            }}
                            disabled={meetingPrepLoading && selectedEvent?.id === event.id}
                          >
                            {meetingPrepLoading && selectedEvent?.id === event.id ? (
                              <Loader2Icon className="size-3 animate-spin" />
                            ) : (
                              <Sparkles className="size-3" />
                            )}
                            {meetingPrepLoading && selectedEvent?.id === event.id ? "Generating..." : "Meeting Prep"}
                          </Button>

                          {selectedEvent?.id === event.id && meetingPrep && (
                            <div className="rounded-lg bg-muted/50 p-3 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                              {meetingPrep}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Create event dialog */}
      <CreateEventDialog
        open={createDialogOpen}
        onOpenChange={handleCreateDialogClose}
        prefillDate={prefillDate}
      />
    </div>
  );
}
