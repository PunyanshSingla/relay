"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Clock, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FollowUpItem } from "@/components/follow-ups/follow-up-item";
import type { FollowUp, FollowUpStatus } from "@/types/follow-up";

type FilterStatus = "all" | "pending" | "dismissed";

export default function FollowUpsPage() {
  const router = useRouter();
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("pending");
  const [counts, setCounts] = useState({ pending: 0, dismissed: 0, acted_upon: 0 });

  const fetchFollowUps = useCallback(async (status: FilterStatus) => {
    setLoading(true);
    try {
      const query = status === "all" ? "" : `?status=${status}`;
      const res = await fetch(`/api/follow-ups${query}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setFollowUps(data.followUps);
      setCounts(data.counts);
    } catch {
      setFollowUps([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFollowUps(filter);
  }, [filter, fetchFollowUps]);

  const handleDismiss = async (id: string) => {
    setFollowUps((prev) => prev.filter((f) => f.id !== id));
    setCounts((prev) => ({ ...prev, pending: Math.max(0, prev.pending - 1) }));
    try {
      await fetch(`/api/follow-ups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "dismissed" }),
      });
    } catch {
      fetchFollowUps(filter);
    }
  };

  const handleOpen = (followUp: FollowUp) => {
    router.push(`/dashboard/inbox/${followUp.emailId}`);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Clock className="size-5 text-primary" />
          <div>
            <h1 className="text-lg font-semibold">Follow-ups</h1>
            <p className="text-xs text-muted-foreground">
              Sent emails awaiting a reply
            </p>
          </div>
        </div>
        {counts.pending > 0 && (
          <span className="text-sm text-muted-foreground">
            {counts.pending} pending
          </span>
        )}
      </div>

      <div className="px-4 pt-3">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterStatus)}>
          <TabsList>
            <TabsTrigger value="pending">
              Pending ({counts.pending})
            </TabsTrigger>
            <TabsTrigger value="dismissed">
              Dismissed ({counts.dismissed})
            </TabsTrigger>
            <TabsTrigger value="all">
              All
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading && (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
          ))
        )}

        {!loading && followUps.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Inbox className="size-8 mb-3" />
            <p className="text-sm">
              {filter === "pending"
                ? "No pending follow-ups. All clear!"
                : "No follow-ups found."}
            </p>
          </div>
        )}

        {!loading && followUps.map((fu) => (
          <FollowUpItem
            key={fu.id}
            followUp={fu}
            onDismiss={handleDismiss}
            onOpen={handleOpen}
          />
        ))}
      </div>
    </div>
  );
}
