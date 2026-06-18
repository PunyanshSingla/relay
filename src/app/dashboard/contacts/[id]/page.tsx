"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Star,
  Mail,
  Calendar,
  Clock,
  MessageSquare,
  MapPin,
  Users as UsersIcon,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "@/lib/format-date";

interface ContactDetail {
  id: string;
  email: string;
  name: string | null;
  emailCount: number;
  meetingCount: number;
  lastInteraction: string | null;
  lastTopic: string | null;
  responsePattern: string | null;
  preferredMeetingTimes: string[];
  relationshipStrength: number;
  vip: boolean;
  createdAt: string;
}

interface Stats {
  emailsExchanged: number;
  emailsSent: number;
  emailsReceived: number;
  meetings: number;
  avgResponseTime: string | null;
  lastEmailSubject: string | null;
  firstInteraction: string;
  activeDays: number;
}

interface EmailSummary {
  id: string;
  subject: string;
  snippet: string | null;
  timestamp: string;
  read: boolean;
  starred: boolean;
  priority: string | null;
  category: string | null;
  isSent: boolean;
}

interface MeetingSummary {
  id: string;
  summary: string;
  location: string | null;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  attendees: Array<{ email: string; displayName?: string; responseStatus?: string }>;
  status: string;
}

interface TimelineItem {
  type: "email" | "meeting";
  date: string;
  title: string;
  detail: string;
  sent?: boolean;
}

type TabId = "overview" | "emails" | "meetings" | "activity";

const PRIORITY_BADGES: Record<string, string> = {
  P1: "bg-red-500/10 text-red-500 border-red-500/20",
  P2: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  P3: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string): string {
  const colors = [
    "bg-red-500/20 text-red-500",
    "bg-blue-500/20 text-blue-500",
    "bg-emerald-500/20 text-emerald-500",
    "bg-purple-500/20 text-purple-500",
    "bg-amber-500/20 text-amber-500",
    "bg-pink-500/20 text-pink-500",
    "bg-indigo-500/20 text-indigo-500",
    "bg-teal-500/20 text-teal-500",
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getEventDuration(start: string, end: string): string {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return remainMins > 0 ? `${hours}h ${remainMins}m` : `${hours}h`;
}

function getStatusBadge(status: string | undefined): { label: string; color: string } {
  switch (status) {
    case "accepted":
      return { label: "Accepted", color: "bg-emerald-500/10 text-emerald-500" };
    case "declined":
      return { label: "Declined", color: "bg-red-500/10 text-red-500" };
    case "tentative":
      return { label: "Maybe", color: "bg-amber-500/10 text-amber-500" };
    default:
      return { label: "Pending", color: "bg-gray-500/10 text-gray-500" };
  }
}

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contactId = params.id as string;

  const [contact, setContact] = useState<ContactDetail | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentEmails, setRecentEmails] = useState<EmailSummary[]>([]);
  const [meetings, setMeetings] = useState<MeetingSummary[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [togglingVip, setTogglingVip] = useState(false);

  const fetchContact = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/contacts/${contactId}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load contact");
      }
      const data = await res.json();
      setContact(data.contact);
      setStats(data.stats);
      setRecentEmails(data.recentEmails);
      setMeetings(data.meetings);
      setTimeline(data.activityTimeline);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load contact");
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    fetchContact();
  }, [fetchContact]);

  const toggleVip = async () => {
    if (!contact || togglingVip) return;
    setTogglingVip(true);
    try {
      await fetch(`/api/contacts/${contactId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vip: !contact.vip }),
      });
      setContact({ ...contact, vip: !contact.vip });
    } catch {
      // silent
    } finally {
      setTogglingVip(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-sm text-muted-foreground">{error || "Contact not found"}</p>
        <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/contacts")}>
          <ArrowLeft className="size-4 mr-1" />
          Back to Contacts
        </Button>
      </div>
    );
  }

  const displayName = contact.name || contact.email;
  const avatarColor = getAvatarColor(displayName);
  const strengthPercent = Math.round(contact.relationshipStrength * 100);

  const tabs: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "overview", label: "Overview", icon: UsersIcon },
    { id: "emails", label: `Emails (${stats?.emailsExchanged || 0})`, icon: Mail },
    { id: "meetings", label: `Meetings (${stats?.meetings || 0})`, icon: Calendar },
    { id: "activity", label: "Activity", icon: Clock },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/contacts")}
          >
            <ArrowLeft className="size-4 mr-1" />
            Contacts
          </Button>
          <span className="text-muted-foreground text-sm">/</span>
          <span className="text-sm text-muted-foreground truncate">{displayName}</span>
        </div>

        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div
            className={cn(
              "flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-medium",
              avatarColor
            )}
          >
            {getInitials(displayName)}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">{displayName}</h1>
              {contact.vip && (
                <Star className="size-4 fill-amber-500 text-amber-500" />
              )}
              {contact.relationshipStrength >= 0.6 && !contact.vip && (
                <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-500 border-purple-500/20">
                  Close
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{contact.email}</p>

            {/* Quick stats */}
            <div className="flex items-center gap-5 mt-3">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Mail className="size-3.5" />
                <span>{stats?.emailsExchanged || 0} emails</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="size-3.5" />
                <span>{stats?.meetings || 0} meetings</span>
              </div>
              {stats?.avgResponseTime && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="size-3.5" />
                  <span>{stats.avgResponseTime} avg response</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <span>{stats?.activeDays || 0} active days</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleVip}
              disabled={togglingVip}
            >
              <Star className={cn("size-4 mr-1", contact.vip && "fill-amber-500 text-amber-500")} />
              {contact.vip ? "VIP" : "Set VIP"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/dashboard/inbox?sender=${encodeURIComponent(contact.email)}`)}
            >
              <ExternalLink className="size-4 mr-1" />
              View in Inbox
            </Button>
          </div>
        </div>

        {/* Relationship strength bar */}
        <div className="flex items-center gap-3 mt-4">
          <span className="text-xs text-muted-foreground">Relationship</span>
          <div className="flex-1 max-w-xs h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${strengthPercent}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground font-medium">{strengthPercent}%</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 border-b border-border bg-card px-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="size-3.5" />
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "overview" && (
          <OverviewTab contact={contact} stats={stats} />
        )}
        {activeTab === "emails" && (
          <EmailsTab emails={recentEmails} router={router} />
        )}
        {activeTab === "meetings" && (
          <MeetingsTab meetings={meetings} />
        )}
        {activeTab === "activity" && (
          <ActivityTab timeline={timeline} />
        )}
      </div>
    </div>
  );
}

function OverviewTab({ contact, stats }: { contact: ContactDetail; stats: Stats | null }) {
  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6 max-w-2xl">
        {/* Communication summary */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Communication Summary</h3>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Emails Sent"
              value={stats?.emailsSent || 0}
              icon={<Mail className="size-4 text-blue-500" />}
            />
            <StatCard
              label="Emails Received"
              value={stats?.emailsReceived || 0}
              icon={<Mail className="size-4 text-emerald-500" />}
            />
            <StatCard
              label="Meetings"
              value={stats?.meetings || 0}
              icon={<Calendar className="size-4 text-purple-500" />}
            />
            <StatCard
              label="Active Days"
              value={stats?.activeDays || 0}
              icon={<Clock className="size-4 text-amber-500" />}
            />
          </div>
        </div>

        <Separator />

        {/* Key details */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Details</h3>
          <div className="space-y-2">
            <DetailRow label="First interaction" value={stats?.firstInteraction ? formatDate(stats.firstInteraction) : "Unknown"} />
            <DetailRow label="Last topic" value={contact.lastTopic || "Unknown"} />
            {contact.responsePattern && (
              <DetailRow label="Response pattern" value={contact.responsePattern} />
            )}
            {stats?.avgResponseTime && (
              <DetailRow label="Avg response time" value={stats.avgResponseTime} />
            )}
            {contact.preferredMeetingTimes.length > 0 && (
              <DetailRow
                label="Preferred meeting times"
                value={contact.preferredMeetingTimes.join(", ")}
              />
            )}
            <DetailRow label="Relationship" value={`${Math.round(contact.relationshipStrength * 100)}%`} />
          </div>
        </div>

        <Separator />

        {/* Last email */}
        {stats?.lastEmailSubject && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Last Email</h3>
            <p className="text-sm text-muted-foreground">{stats.lastEmailSubject}</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function EmailsTab({ emails, router }: { emails: EmailSummary[]; router: ReturnType<typeof useRouter> }) {
  if (emails.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        No emails with this contact yet.
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="divide-y divide-border">
        {emails.map((email) => (
          <div
            key={email.id}
            className="flex items-start gap-3 px-6 py-3 hover:bg-muted/30 cursor-pointer transition-colors"
            onClick={() => router.push(`/dashboard/inbox?thread=${email.id}`)}
          >
            <div className={cn(
              "size-2 rounded-full mt-2 shrink-0",
              email.isSent ? "bg-blue-500" : "bg-emerald-500"
            )} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={cn("text-sm font-medium truncate", !email.read && "font-semibold")}>
                  {email.subject}
                </span>
                {email.priority && email.priority !== "P3" && (
                  <Badge
                    variant="outline"
                    className={cn("text-[10px] px-1 py-0 h-4", PRIORITY_BADGES[email.priority])}
                  >
                    {email.priority}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {email.snippet || "No preview"}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {email.starred && <Star className="size-3 fill-amber-500 text-amber-500" />}
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(email.timestamp)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

function MeetingsTab({ meetings }: { meetings: MeetingSummary[] }) {
  if (meetings.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        No meetings with this contact.
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="divide-y divide-border">
        {meetings.map((meeting) => {
          const startStr = meeting.start?.dateTime || meeting.start?.date || "";
          const endStr = meeting.end?.dateTime || meeting.end?.date || "";
          const statusBadge = getStatusBadge(
            meeting.attendees?.find((a) => a.email?.toLowerCase() === meeting.attendees[0]?.email?.toLowerCase())?.responseStatus
          );

          return (
            <div key={meeting.id} className="px-6 py-3 hover:bg-muted/30 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium">{meeting.summary || "(No title)"}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="size-3" />
                      {formatDate(startStr)}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="size-3" />
                      {startStr && endStr && getEventDuration(startStr, endStr)}
                    </span>
                    {meeting.location && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="size-3" />
                        {meeting.location}
                      </span>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className={cn("text-[10px]", statusBadge.color)}>
                  {statusBadge.label}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

function ActivityTab({ timeline }: { timeline: TimelineItem[] }) {
  if (timeline.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        No activity with this contact yet.
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 max-w-2xl">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />

          <div className="space-y-4">
            {timeline.map((item, i) => (
              <div key={i} className="flex gap-3 relative">
                {/* Icon */}
                <div
                  className={cn(
                    "size-6 rounded-full flex items-center justify-center shrink-0 z-10",
                    item.type === "email"
                      ? item.sent
                        ? "bg-blue-500/20 text-blue-500"
                        : "bg-emerald-500/20 text-emerald-500"
                      : "bg-purple-500/20 text-purple-500"
                  )}
                >
                  {item.type === "email" ? (
                    <Mail className="size-3" />
                  ) : (
                    <Calendar className="size-3" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{item.title}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatDateTime(item.date)}
                    </span>
                  </div>
                  {item.detail && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {item.detail}
                    </p>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {item.type === "email" ? (item.sent ? "Sent" : "Received") : "Meeting"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
