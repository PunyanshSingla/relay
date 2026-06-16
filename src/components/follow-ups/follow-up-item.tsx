"use client";

import { Clock, Mail, Trash2, CheckCircle, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "@/lib/format-date";
import type { FollowUp, FollowUpStatus } from "@/types/follow-up";

const STATUS_CONFIG: Record<FollowUpStatus, { badge: string; label: string }> = {
  pending: { badge: "bg-amber-500/10 text-amber-500 border-amber-500/20", label: "Awaiting Reply" },
  dismissed: { badge: "bg-gray-500/10 text-gray-500 border-gray-500/20", label: "Dismissed" },
  acted_upon: { badge: "bg-green-500/10 text-green-500 border-green-500/20", label: "Replied" },
};

interface FollowUpItemProps {
  followUp: FollowUp;
  onDismiss: (id: string) => void;
  onOpen: (followUp: FollowUp) => void;
}

export function FollowUpItem({ followUp, onDismiss, onOpen }: FollowUpItemProps) {
  const config = STATUS_CONFIG[followUp.status];

  return (
    <Card className="border-border hover:bg-muted/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium truncate">{followUp.subject}</h3>
              <Badge
                variant="outline"
                className={cn("text-[10px] px-1.5 py-0 h-5 font-medium shrink-0", config.badge)}
              >
                {config.label}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Mail className="size-3" />
                To: {followUp.toName || followUp.toEmail}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                {formatDistanceToNow(followUp.sentAt)} ago
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {followUp.status === "pending" && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => onOpen(followUp)}
                >
                  <ExternalLink className="size-3 mr-1" />
                  Open
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={() => onDismiss(followUp.id)}
                >
                  <Trash2 className="size-3 mr-1" />
                  Dismiss
                </Button>
              </>
            )}
            {followUp.status === "acted_upon" && (
              <CheckCircle className="size-4 text-green-500" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
