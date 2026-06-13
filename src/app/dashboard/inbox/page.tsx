"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Pencil, RefreshCw, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilterBar } from "@/components/inbox/filter-bar";
import { EmailList } from "@/components/inbox/email-list";
import { ThreadView } from "@/components/inbox/thread-view";
import { ComposeModal } from "@/components/inbox/compose-modal";
import { dummyEmails } from "@/lib/dummy/emails";
import type { Email, FilterOption } from "@/types/email";

type FilterId = FilterOption["id"];

function getFilteredEmails(emails: Email[], filter: FilterId): Email[] {
  switch (filter) {
    case "unread":
      return emails.filter((e) => !e.read);
    case "P1":
      return emails.filter((e) => e.priority === "P1");
    case "P2":
      return emails.filter((e) => e.priority === "P2");
    case "P3":
      return emails.filter((e) => e.priority === "P3");
    default:
      return emails;
  }
}

export default function InboxPage() {
  const [emails, setEmails] = useState(dummyEmails);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<{ name: string; email: string; subject: string } | undefined>();

  const filteredEmails = getFilteredEmails(emails, activeFilter);
  const selectedEmail = emails.find((e) => e.id === selectedId) || null;

  const filters: FilterOption[] = [
    { id: "all", label: "All", count: emails.length },
    { id: "unread", label: "Unread", count: emails.filter((e) => !e.read).length },
    { id: "P1", label: "P1 Critical", count: emails.filter((e) => e.priority === "P1").length },
    { id: "P2", label: "P2 Important", count: emails.filter((e) => e.priority === "P2").length },
    { id: "P3", label: "P3 Low", count: emails.filter((e) => e.priority === "P3").length },
  ];

  const handleToggleStar = useCallback((id: string) => {
    setEmails((prev) =>
      prev.map((e) => (e.id === id ? { ...e, starred: !e.starred } : e))
    );
  }, []);

  const handleMarkAllRead = useCallback(() => {
    setEmails((prev) => prev.map((e) => ({ ...e, read: true })));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const currentIndex = filteredEmails.findIndex((e) => e.id === selectedId);

      switch (e.key) {
        case "j":
        case "ArrowDown":
          e.preventDefault();
          if (currentIndex < filteredEmails.length - 1) {
            setSelectedId(filteredEmails[currentIndex + 1].id);
          }
          break;
        case "k":
        case "ArrowUp":
          e.preventDefault();
          if (currentIndex > 0) {
            setSelectedId(filteredEmails[currentIndex - 1].id);
          }
          break;
        case "Enter":
          if (selectedId) {
            setEmails((prev) =>
              prev.map((e) =>
                e.id === selectedId ? { ...e, read: true } : e
              )
            );
          }
          break;
        case "s":
          if (selectedId) {
            handleToggleStar(selectedId);
          }
          break;
        case "c":
          e.preventDefault();
          setComposeOpen(true);
          break;
        case "r":
          if (selectedEmail) {
            setReplyTo({
              name: selectedEmail.from.name,
              email: selectedEmail.from.email,
              subject: selectedEmail.subject,
            });
            setComposeOpen(true);
          }
          break;
        case "Escape":
          setComposeOpen(false);
          break;
        case "1":
          setActiveFilter("P1");
          break;
        case "2":
          setActiveFilter("P2");
          break;
        case "3":
          setActiveFilter("P3");
          break;
        case "0":
          setActiveFilter("all");
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, filteredEmails, selectedEmail, handleToggleStar]);

  // Select first email on mount
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!initializedRef.current && filteredEmails.length > 0) {
      initializedRef.current = true;
      setSelectedId(filteredEmails[0].id);
    }
  }, [filteredEmails]);

  return (
    <div className="flex flex-col h-full">
      {/* Action bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="size-4 mr-1" />
            Mark all read
          </Button>
          <Button variant="ghost" size="sm">
            <RefreshCw className="size-4 mr-1" />
            Refresh
          </Button>
        </div>
        <Button size="sm" onClick={() => setComposeOpen(true)}>
          <Pencil className="size-4 mr-1" />
          Compose
        </Button>
      </div>

      {/* Filter bar */}
      <FilterBar
        filters={filters}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* Main content: split view */}
      <div className="flex flex-1 overflow-hidden">
        {/* Email list - 40% */}
        <div className="w-2/5 border-r border-border overflow-hidden">
          <EmailList
            emails={filteredEmails}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onToggleStar={handleToggleStar}
          />
        </div>

        {/* Thread view - 60% */}
        <div className="w-3/5 overflow-hidden">
          {selectedEmail ? (
            <ThreadView
              email={selectedEmail}
              onToggleStar={handleToggleStar}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <p className="text-sm">Select an email to view</p>
            </div>
          )}
        </div>
      </div>

      {/* Compose modal */}
      <ComposeModal
        open={composeOpen}
        onOpenChange={(open) => {
          setComposeOpen(open);
          if (!open) setReplyTo(undefined);
        }}
        replyTo={replyTo}
      />
    </div>
  );
}
