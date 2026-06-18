"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { X, Plus, Video } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function toDateInputValue(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toTimeInputValue(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const EVENT_COLORS = [
  { id: "1", name: "Lavender", color: "#7986cb" },
  { id: "2", name: "Sage", color: "#33b679" },
  { id: "3", name: "Grape", color: "#8e24aa" },
  { id: "4", name: "Flamingo", color: "#e67c73" },
  { id: "5", name: "Banana", color: "#f6bf26" },
  { id: "6", name: "Tangerine", color: "#f4511e" },
  { id: "7", name: "Peacock", color: "#039be5" },
  { id: "9", name: "Blueberry", color: "#616161" },
  { id: "11", name: "Basil", color: "#0b8043" },
  { id: "13", name: "Tomato", color: "#d50000" },
];

interface EventFormData {
  summary: string;
  description: string;
  location: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  attendees: string[];
  colorId: string;
  addMeet: boolean;
}

function getInitialFormData(prefillDate?: Date | null): EventFormData {
  if (prefillDate) {
    const start = new Date(prefillDate);
    start.setHours(9, 0, 0, 0);
    const end = new Date(prefillDate);
    end.setHours(10, 0, 0, 0);
    return {
      summary: "",
      description: "",
      location: "",
      startDate: toDateInputValue(prefillDate),
      startTime: toTimeInputValue(start),
      endDate: toDateInputValue(prefillDate),
      endTime: toTimeInputValue(end),
      attendees: [],
      colorId: "",
      addMeet: true,
    };
  }
  return {
    summary: "",
    description: "",
    location: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    attendees: [],
    colorId: "",
    addMeet: true,
  };
}

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefillDate?: Date | null;
  editEvent?: {
    id: string;
    summary?: string;
    description?: string;
    location?: string;
    start?: { dateTime?: string; date?: string };
    end?: { dateTime?: string; date?: string };
    attendees?: Array<{ email?: string }>;
    colorId?: string;
  } | null;
  onSaved?: () => void;
}

export function CreateEventDialog({ open, onOpenChange, prefillDate, editEvent, onSaved }: CreateEventDialogProps) {
  const isEditing = !!editEvent;
  const [form, setForm] = useState<EventFormData>(() => getInitialFormData(prefillDate));
  const [newAttendee, setNewAttendee] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (editEvent) {
      const s = editEvent.start?.dateTime ?? editEvent.start?.date;
      const e = editEvent.end?.dateTime ?? editEvent.end?.date;
      const sd = s ? new Date(s) : new Date();
      const ed = e ? new Date(e) : new Date(sd.getTime() + 60 * 60 * 1000);
      const isAllDay = !!editEvent.start?.date && !editEvent.start?.dateTime;

      setForm({
        summary: editEvent.summary ?? "",
        description: editEvent.description ?? "",
        location: editEvent.location ?? "",
        startDate: toDateInputValue(sd),
        startTime: isAllDay ? "" : toTimeInputValue(sd),
        endDate: toDateInputValue(ed),
        endTime: isAllDay ? "" : toTimeInputValue(ed),
        attendees: editEvent.attendees?.map((a) => a.email ?? "").filter(Boolean) ?? [],
        colorId: editEvent.colorId ?? "",
        addMeet: false,
      });
    } else {
      setForm(getInitialFormData(prefillDate));
    }
    setNewAttendee("");
  }, [open, editEvent, prefillDate]);

  const update = <K extends keyof EventFormData>(key: K, value: EventFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const addAttendee = () => {
    const email = newAttendee.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      toast.error("Enter a valid email address");
      return;
    }
    if (form.attendees.includes(email)) {
      toast.error("Already added");
      return;
    }
    update("attendees", [...form.attendees, email]);
    setNewAttendee("");
  };

  const removeAttendee = (email: string) => {
    update("attendees", form.attendees.filter((a) => a !== email));
  };

  const handleSubmit = async () => {
    if (!form.summary.trim()) {
      toast.error("Please enter an event title");
      return;
    }
    if (!form.startDate) {
      toast.error("Please select a start date");
      return;
    }

    // Validate start time is not in the past (for timed events)
    if (form.startTime) {
      const startDt = new Date(`${form.startDate}T${form.startTime}`);
      if (startDt < new Date()) {
        toast.error("Start time cannot be in the past");
        return;
      }
    }

    // Validate end > start
    if (form.startTime && form.endTime) {
      const startDt = new Date(`${form.startDate}T${form.startTime}`);
      const endDate = form.endDate || form.startDate;
      const endDt = new Date(`${endDate}T${form.endTime}`);
      if (endDt <= startDt) {
        toast.error("End time must be after start time");
        return;
      }
    }

    setSubmitting(true);

    try {
      const startIso = form.startTime
        ? new Date(`${form.startDate}T${form.startTime}`).toISOString()
        : undefined;
      const startDate = !form.startTime ? form.startDate : undefined;

      // Default end to start + 1 hour if not explicitly set
      let endIso: string | undefined;
      let endDateVal: string | undefined;
      if (form.endTime && (form.endDate || form.startDate)) {
        endIso = new Date(`${form.endDate || form.startDate}T${form.endTime}`).toISOString();
      } else if (startIso) {
        endIso = new Date(new Date(startIso).getTime() + 60 * 60 * 1000).toISOString();
      } else if (form.startDate) {
        endDateVal = form.startDate;
      }

      const payload: Record<string, unknown> = {
        summary: form.summary.trim(),
        description: form.description.trim() || undefined,
        location: form.location.trim() || undefined,
        start: {
          dateTime: startIso,
          date: startDate,
        },
        end: {
          dateTime: endIso,
          date: endDateVal,
        },
        attendees: form.attendees.length > 0 ? form.attendees : undefined,
        colorId: form.colorId || undefined,
      };

      if (form.addMeet && !isEditing) {
        payload.conferenceDataVersion = 1;
        payload.conferenceData = {
          createRequest: {
            requestId: `meet-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        };
      }

      const url = isEditing
        ? `/api/calendar/events/${editEvent.id}`
        : "/api/calendar/events";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed to ${isEditing ? "update" : "create"} event`);
      }

      toast.success(isEditing ? "Event updated" : "Event created");
      onOpenChange(false);
      onSaved?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Event" : "Create Event"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update your Google Calendar event." : "Add a new event to your Google Calendar."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="event-title">Title</Label>
            <Input
              id="event-title"
              placeholder="Event title"
              value={form.summary}
              onChange={(e) => update("summary", e.target.value)}
            />
          </div>

          {/* Start */}
          <div className="space-y-1.5">
            <Label htmlFor="start-date">When</Label>
            <div className="flex gap-2">
              <Input id="start-date" type="date" value={form.startDate} onChange={(e) => update("startDate", e.target.value)} className="flex-1" />
              <Input id="start-time" type="time" value={form.startTime} onChange={(e) => update("startTime", e.target.value)} className="w-28" />
            </div>
            {/* Quick time presets */}
            {form.startDate && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      update("startTime", t);
                      // Auto-set end time to +1 hour
                      const h = parseInt(t.split(":")[0]) + 1;
                      update("endTime", `${String(h).padStart(2, "0")}:00`);
                    }}
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors",
                      form.startTime === t
                        ? "bg-primary text-primary-foreground border-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted border-border"
                    )}
                  >
                    {parseInt(t) > 12 ? `${parseInt(t) - 12} PM` : t === "12:00" ? "12 PM" : `${parseInt(t)} AM`}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* End */}
          <div className="space-y-1.5">
            <Label htmlFor="end-date">End</Label>
            <div className="flex gap-2">
              <Input id="end-date" type="date" value={form.endDate || form.startDate} onChange={(e) => update("endDate", e.target.value)} className="flex-1" />
              <Input id="end-time" type="time" value={form.endTime} onChange={(e) => update("endTime", e.target.value)} className="w-28" />
            </div>
            {/* Quick duration presets */}
            {form.startTime && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {[30, 60, 90, 120].map((mins) => {
                  const [h, m] = form.startTime.split(":").map(Number);
                  const endMins = h * 60 + m + mins;
                  const eh = Math.floor(endMins / 60);
                  const em = endMins % 60;
                  const endVal = `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
                  return (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => update("endTime", endVal)}
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors",
                        form.endTime === endVal
                          ? "bg-primary text-primary-foreground border-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted border-border"
                      )}
                    >
                      {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <Label htmlFor="event-location">Location</Label>
            <Input id="event-location" placeholder="Add location" value={form.location} onChange={(e) => update("location", e.target.value)} />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="event-description">Description</Label>
            <Textarea id="event-description" placeholder="Add description" rows={3} value={form.description} onChange={(e) => update("description", e.target.value)} />
          </div>

          {/* Attendees */}
          <div className="space-y-1.5">
            <Label>Attendees</Label>
            <div className="flex gap-2">
              <Input
                placeholder="email@example.com"
                value={newAttendee}
                onChange={(e) => setNewAttendee(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addAttendee();
                  }
                }}
              />
              <Button type="button" variant="outline" size="icon" onClick={addAttendee}>
                <Plus className="size-4" />
              </Button>
            </div>
            {form.attendees.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.attendees.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs"
                  >
                    {email}
                    <button onClick={() => removeAttendee(email)} className="hover:text-primary/70">
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Color */}
          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex gap-1.5 flex-wrap">
              {EVENT_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => update("colorId", form.colorId === c.id ? "" : c.id)}
                  className={cn(
                    "size-6 rounded-full border-2 transition-all",
                    form.colorId === c.id ? "border-foreground scale-110" : "border-transparent hover:scale-105",
                  )}
                  style={{ backgroundColor: c.color }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Google Meet */}
          {!isEditing && (
            <div className="flex items-center gap-3 rounded-lg border border-border p-3">
              <button
                type="button"
                onClick={() => update("addMeet", !form.addMeet)}
                className={cn(
                  "size-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0",
                  form.addMeet
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-muted-foreground/30 hover:border-muted-foreground/50"
                )}
              >
                {form.addMeet && (
                  <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <div className="flex items-center gap-2">
                <Video className="size-4 text-emerald-500" />
                <span className="text-sm">Add Google Meet</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (isEditing ? "Saving..." : "Creating...") : (isEditing ? "Save Changes" : "Create Event")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
