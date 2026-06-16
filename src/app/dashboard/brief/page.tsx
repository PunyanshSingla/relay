"use client";

import { useState, useEffect } from "react";
import { Mail, Calendar, Clock, AlertTriangle, Sun, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "@/lib/format-date";

interface Brief {
  id: string;
  date: string;
  summary: string;
  emailCount: number;
  meetingCount: number;
  followUpCount: number;
  overdueCount: number;
  createdAt: string;
}

export default function BriefPage() {
  const [brief, setBrief] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBrief = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/brief");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setBrief(data.brief);
    } catch {
      setBrief(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrief();
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Sun className="size-5 text-primary" />
          <div>
            <h1 className="text-lg font-semibold">Daily Brief</h1>
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchBrief}>
          <RefreshCw className="size-4 mr-1" />
          Refresh
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading && (
          <div className="space-y-4">
            <div className="h-32 bg-muted rounded-lg animate-pulse" />
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        )}

        {!loading && !brief && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Sun className="size-8 mb-3" />
            <p className="text-sm">No brief generated for today yet.</p>
            <p className="text-xs mt-1">Briefs are generated daily at 7:30 AM.</p>
          </div>
        )}

        {!loading && brief && (
          <>
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
                <p className="text-xs text-muted-foreground mt-3">
                  Generated {formatDistanceToNow(new Date(brief.createdAt))} ago
                </p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="border-border">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                    <Mail className="size-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{brief.emailCount}</p>
                    <p className="text-xs text-muted-foreground">Important emails</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/10">
                    <Calendar className="size-4 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{brief.meetingCount}</p>
                    <p className="text-xs text-muted-foreground">Meetings today</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                    <Clock className="size-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{brief.followUpCount}</p>
                    <p className="text-xs text-muted-foreground">Pending follow-ups</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
                    <AlertTriangle className="size-4 text-red-500" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{brief.overdueCount}</p>
                    <p className="text-xs text-muted-foreground">Overdue items</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
