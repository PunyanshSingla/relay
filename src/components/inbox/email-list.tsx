"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { EmailItem } from "./email-item";
import type { Email } from "@/types/email";

interface EmailListProps {
  emails: Email[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleStar: (id: string) => void;
}

export function EmailList({ emails, selectedId, onSelect, onToggleStar }: EmailListProps) {
  return (
    <ScrollArea className="h-full">
      <div className="divide-y divide-border">
        {emails.map((email) => (
          <EmailItem
            key={email.id}
            email={email}
            isSelected={email.id === selectedId}
            onSelect={onSelect}
            onToggleStar={onToggleStar}
          />
        ))}
        {emails.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p className="text-sm">No emails match this filter</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
