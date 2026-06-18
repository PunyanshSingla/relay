"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FollowUpItem } from "@/components/follow-ups/follow-up-item";
import type { FollowUp } from "@/types/follow-up";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type FilterStatus = "all" | "pending" | "dismissed";

export default function FollowUpsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterStatus>("pending");

  const { data, isLoading, mutate } = useSWR(
    `/api/follow-ups${filter === "all" ? "" : `?status=${filter}`}`,
    fetcher
  );

  const followUps: FollowUp[] = data?.followUps ?? [];
  const counts = data?.counts ?? { pending: 0, dismissed: 0, acted_upon: 0 };

  const handleDismiss = async (id: string) => {
    await fetch(`/api/follow-ups/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "dismissed" }),
    });
    mutate();
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
