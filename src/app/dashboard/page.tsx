"use client";

import { Inbox, Calendar, Sparkles, ArrowRight, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const quickActions = [
  {
    title: "Inbox",
    description: "12 unread emails",
    icon: Inbox,
    href: "/dashboard/inbox",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    title: "Calendar",
    description: "3 meetings today",
    icon: Calendar,
    href: "/dashboard/calendar",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    title: "Contacts",
    description: "24 contacts",
    icon: Users,
    href: "/dashboard/contacts",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    title: "Daily Brief",
    description: "View your summary",
    icon: Sparkles,
    href: "/dashboard/brief",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
];

const recentEmails = [
  { from: "Alex Johnson", subject: "Q2 Planning Meeting", time: "2m ago", unread: true },
  { from: "Sarah Chen", subject: "Re: Project Update", time: "15m ago", unread: true },
  { from: "GitHub", subject: "[Relay] PR #42 merged", time: "1h ago", unread: false },
  { from: "Mike Peters", subject: "Lunch tomorrow?", time: "2h ago", unread: false },
  { from: "Notion", subject: "Weekly digest", time: "3h ago", unread: false },
];

const upcomingEvents = [
  { title: "Team Standup", time: "9:00 AM", duration: "15m", color: "bg-blue-500" },
  { title: "Design Review", time: "11:00 AM", duration: "1h", color: "bg-emerald-500" },
  { title: "1:1 with Manager", time: "2:00 PM", duration: "30m", color: "bg-purple-500" },
];

export default function DashboardPage() {
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
            <div className="space-y-3">
              {recentEmails.map((email, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50 cursor-pointer"
                >
                  <div className={`size-2 rounded-full ${email.unread ? "bg-primary" : "bg-muted"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${email.unread ? "font-medium" : "text-muted-foreground"}`}>
                        {email.from}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{email.subject}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{email.time}</span>
                </div>
              ))}
            </div>
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
            <div className="space-y-3">
              {upcomingEvents.map((event, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
                >
                  <div className={`w-1 h-8 rounded-full ${event.color}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.time} · {event.duration}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

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
