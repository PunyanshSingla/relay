"use client";

import {
  Inbox,
  Calendar,
  Sparkles,
  ArrowRight,
  Users,
  Loader2,
  Clock,
  Sun,
  Mail,
  AlertTriangle,
  Bot,
  Check,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import useSWR from "swr";
import { formatDistanceToNow } from "@/lib/format-date";
import { ACTION_LABELS, type ActionType } from "@/types/automation";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Brief {
  summary: string;
  emailCount: number;
  meetingCount: number;
  followUpCount: number;
  overdueCount: number;
  createdAt: string;
}

interface EmailCount {
  total: number;
  unread: number;
  P1: number;
  P2: number;
  P3: number;
}

interface RecentEmail {
  id: string;
  from: { name: string; email: string };
  subject: string;
  preview: string;
  timestamp: string;
  read: boolean;
  priority: string;
}

interface Automation {
  id: string;
  actionType: ActionType;
  target: string;
  description: string;
  count: number;
}

export default function DashboardPage() {
  const { data: briefData, isLoading: briefLoading } = useSWR("/api/brief", fetcher, { refreshInterval: 300000 });
  const { data: counts } = useSWR<EmailCount>("/api/emails/counts", fetcher, { refreshInterval: 30000 });
  const { data: emailsData, isLoading: emailsLoading } = useSWR("/api/emails?filter=unread", fetcher);
  const { data: eventsData, isLoading: eventsLoading } = useSWR("/api/calendar/events?limit=3", fetcher);
  const { data: followUpData } = useSWR("/api/follow-ups?status=pending", fetcher);
  const { data: automationsData, mutate: mutateAutomations } = useSWR("/api/automations", fetcher);

  const brief = briefData?.brief as Brief | null;
  const recentEmails: RecentEmail[] = (emailsData?.emails ?? [])
    .sort((a: RecentEmail, b: RecentEmail) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);
  const upcomingEvents = eventsData?.events ?? [];
  const followUpCount = followUpData?.counts?.pending ?? 0;
  const automations: Automation[] = automationsData?.automations ?? [];

  const statusColors: Record<string, string> = {
    confirmed: "bg-emerald-500",
    tentative: "bg-amber-500",
    cancelled: "bg-red-500",
  };

  const quickActions = [
    {
      title: "Inbox",
      description: counts ? (counts.unread > 0 ? `${counts.unread} unread` : "All caught up") : "View emails",
      icon: Inbox,
      href: "/dashboard/inbox",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Calendar",
      description: upcomingEvents.length > 0 ? `${upcomingEvents.length} events today` : "No events today",
      icon: Calendar,
      href: "/dashboard/calendar",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Follow-ups",
      description: followUpCount > 0 ? `${followUpCount} pending` : "All clear",
      icon: Clock,
      href: "/dashboard/follow-ups",
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      title: "Contacts",
      description: "Manage relationships",
      icon: Users,
      href: "/dashboard/contacts",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  const handleAcceptAutomation = async (id: string) => {
    await fetch(`/api/automations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "accepted" }),
    });
    mutateAutomations();
  };

  const handleDismissAutomation = async (id: string) => {
    await fetch(`/api/automations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "dismissed" }),
    });
    mutateAutomations();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back. Here&apos;s your overview for today.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/ai">
            <Sparkles className="mr-2 size-4" />
            AI Command Center
          </Link>
        </Button>
      </div>

      {/* Daily Brief */}
      {briefLoading ? (
        <div className="h-32 bg-muted rounded-lg animate-pulse" />
      ) : brief ? (
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sun className="size-4 text-primary" />
              Morning Brief
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
              {brief.summary}
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Mail className="size-3" /> {brief.emailCount} important</span>
              <span className="flex items-center gap-1"><Calendar className="size-3" /> {brief.meetingCount} meetings</span>
              <span className="flex items-center gap-1"><Clock className="size-3" /> {brief.followUpCount} follow-ups</span>
              {brief.overdueCount > 0 && (
                <span className="flex items-center gap-1 text-red-500"><AlertTriangle className="size-3" /> {brief.overdueCount} overdue</span>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border border-dashed">
          <CardContent className="py-6 flex flex-col items-center justify-center text-muted-foreground">
            <Sun className="size-6 mb-2" />
            <p className="text-sm">No brief for today yet.</p>
            <p className="text-xs mt-1">Your morning brief will appear here daily at 7:30 AM.</p>
          </CardContent>
        </Card>
      )}

      {/* Quick actions grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Link key={action.title} href={action.href}>
            <Card className="transition-colors hover:bg-muted/50 cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`flex size-10 items-center justify-center rounded-lg ${action.bgColor}`}>
                    <action.icon className={`size-5 ${action.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{action.title}</p>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent emails */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Recent Emails</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/inbox">
                View all
                <ArrowRight className="ml-2 size-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {emailsLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : recentEmails.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Inbox className="size-10 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No unread emails</p>
                <Link href="/dashboard/inbox" className="text-xs text-primary mt-1 hover:underline">
                  Open inbox
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentEmails.map((email) => {
                  const priorityDot: Record<string, string> = {
                    P1: "bg-red-500",
                    P2: "bg-amber-500",
                    P3: "bg-gray-400",
                  };
                  return (
                    <Link
                      key={email.id}
                      href={`/dashboard/inbox/${email.id}`}
                      className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`size-2 rounded-full ${priorityDot[email.priority] ?? "bg-muted"}`} />
                        <div className={`size-2 rounded-full ${!email.read ? "bg-primary" : "bg-transparent"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm ${!email.read ? "font-medium" : "text-muted-foreground"}`}>
                            {email.from.name || email.from.email}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{email.subject}</p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatDistanceToNow(new Date(email.timestamp))}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Today&apos;s Schedule</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/calendar">
                View all
                <ArrowRight className="ml-2 size-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {eventsLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : upcomingEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Calendar className="size-10 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No upcoming events</p>
                <Link href="/dashboard/calendar" className="text-xs text-primary mt-1 hover:underline">
                  Connect your calendar
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.slice(0, 3).map((event, i) => {
                  const color = event.status ? (statusColors[event.status] ?? "bg-blue-500") : "bg-blue-500";
                  const dateStr = event.start?.date ?? event.start?.dateTime;
                  const time = dateStr
                    ? new Date(dateStr).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
                    : "";
                  return (
                    <div
                      key={event.id ?? i}
                      className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
                    >
                      <div className={`w-1 h-8 rounded-full ${color}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{event.summary || "(no title)"}</p>
                        <p className="text-xs text-muted-foreground">
                          {time}
                          {event.location ? ` · ${event.location}` : ""}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Workflow Suggestions */}
      {automations.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">
              <span className="flex items-center gap-2">
                <Bot className="size-5 text-primary" />
                Workflow Suggestions
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {automations.map((auto) => (
                <div key={auto.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{auto.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {ACTION_LABELS[auto.actionType] ?? auto.actionType} · {auto.count} times
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-green-600"
                      onClick={() => handleAcceptAutomation(auto.id)}
                    >
                      <Check className="size-3 mr-1" />
                      Accept
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-muted-foreground"
                      onClick={() => handleDismissAutomation(auto.id)}
                    >
                      <X className="size-3 mr-1" />
                      Dismiss
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Quick Actions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">
            <span className="flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              AI Quick Actions
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button variant="outline" className="justify-start h-auto p-4" asChild>
              <Link href="/dashboard/ai">
                <div className="text-left">
                  <p className="text-sm font-medium">Draft a reply</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Let AI compose a professional response
                  </p>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="justify-start h-auto p-4" asChild>
              <Link href="/dashboard/ai">
                <div className="text-left">
                  <p className="text-sm font-medium">Schedule a meeting</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Create calendar events with natural language
                  </p>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="justify-start h-auto p-4" asChild>
              <Link href="/dashboard/follow-ups">
                <div className="text-left">
                  <p className="text-sm font-medium">Check follow-ups</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Review pending follow-up suggestions
                  </p>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
