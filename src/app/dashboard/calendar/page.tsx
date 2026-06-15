"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, Users, RefreshCw, Plus, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

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

const statusColors: Record<string, string> = {
  confirmed: "bg-emerald-500",
  tentative: "bg-amber-500",
  cancelled: "bg-red-500",
};

function formatEventTime(start?: { dateTime?: string; date?: string }, end?: { dateTime?: string; date?: string }): string {
  const dateStr = start?.date ?? start?.dateTime;
  const endStr = end?.date ?? end?.dateTime;

  if (!dateStr) return "";

  const s = new Date(dateStr);
  const e = endStr ? new Date(endStr) : null;

  const timeStr = s.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (s.toDateString() === new Date().toDateString()) {
    if (e) return `Today, ${timeStr} – ${e.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
    return `Today, ${timeStr}`;
  }

  const date = s.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  if (e) return `${date}, ${timeStr} – ${e.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  return `${date}, ${timeStr}`;
}

function EventCard({ event }: { event: CalendarEvent }) {
  const color = event.status ? (statusColors[event.status] ?? "bg-muted") : "bg-blue-500";

  return (
    <div className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50">
      <div className={`w-1 h-10 rounded-full shrink-0 ${color}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{event.summary || "(no title)"}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            {formatEventTime(event.start, event.end)}
          </span>
          {event.location && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="size-3" />
              {event.location}
            </span>
          )}
          {event.attendees && event.attendees.length > 0 && (
            <span className="flex items-center gap-1">
              <Users className="size-3" />
              {event.attendees.length}
            </span>
          )}
        </div>
        {(event.status === "cancelled" || event.eventType === "outOfOffice" || event.eventType === "focusTime") && (
          <div className="mt-1">
            {event.status === "cancelled" && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1">Cancelled</Badge>
            )}
            {event.eventType === "outOfOffice" && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1">OOO</Badge>
            )}
            {event.eventType === "focusTime" && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1">Focus</Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/calendar/events?limit=50");
      const data = await res.json();
      if (data.events) setEvents(data.events);
    } catch (err) {
      console.error("Failed to load events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    await fetchEvents();
    setSyncing(false);
  };

  const groupedEvents = events.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
    const dateStr = event.start?.date ?? event.start?.dateTime;
    const label = dateStr ? new Date(dateStr).toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" }) : "Unknown";
    if (!acc[label]) acc[label] = [];
    acc[label].push(event);
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your upcoming events from Google Calendar
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`mr-2 size-4 ${syncing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" asChild>
            <a href="/dashboard/calendar?new=true">
              <Plus className="mr-2 size-4" />
              Create Event
            </a>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar className="size-16 text-muted-foreground/30 mb-4" />
            <h2 className="text-lg font-medium">No upcoming events</h2>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Connect your Google Calendar to see your events here.
            </p>
            <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
              <RefreshCw className={`mr-2 size-4 ${syncing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent className="px-2">
            <ScrollArea>
              <div className="space-y-8">
                {Object.entries(groupedEvents).map(([dateLabel, dayEvents]) => (
                  <div key={dateLabel}>
                    <p className="px-3 text-sm font-medium text-muted-foreground mb-1">{dateLabel}</p>
                    <div className="space-y-1">
                      {dayEvents.map((event, i) => (
                        <EventCard key={event.id ?? i} event={event} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
