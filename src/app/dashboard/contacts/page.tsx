"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Users, RefreshCw, Star, Zap, Clock, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ContactItem, ContactSkeletonList } from "@/components/contacts/contact-item";
import { ContactsFilterBar, type ContactFilterId } from "@/components/contacts/filter-bar";
import { cn } from "@/lib/utils";

interface ContactData {
  id: string;
  email: string;
  name: string | null;
  emailCount: number;
  meetingCount: number;
  lastInteraction: string | null;
  lastTopic: string | null;
  relationshipStrength: number;
  vip: boolean;
}

interface Counts {
  total: number;
  vip: number;
  frequent: number;
  recent: number;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<ContactData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<ContactFilterId>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [counts, setCounts] = useState<Counts>({ total: 0, vip: 0, frequent: 0, recent: 0 });

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/contacts");
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch contacts");
      }
      const data = await response.json();
      setContacts(data.contacts);
      setCounts(data.counts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch contacts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const filteredContacts = useMemo(() => {
    let result = contacts;

    if (activeFilter === "vip") {
      result = result.filter((c) => c.vip);
    } else if (activeFilter === "frequent") {
      result = result.filter((c) => c.emailCount >= 10);
    } else if (activeFilter === "recent") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      result = result.filter((c) => {
        if (!c.lastInteraction) return false;
        return new Date(c.lastInteraction) >= thirtyDaysAgo;
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          (c.name?.toLowerCase().includes(query)) ||
          c.email.toLowerCase().includes(query)
      );
    }

    return result;
  }, [contacts, activeFilter, searchQuery]);

  const computedCounts = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return {
      all: contacts.length,
      vip: contacts.filter((c) => c.vip).length,
      frequent: contacts.filter((c) => c.emailCount >= 10).length,
      recent: contacts.filter((c) => {
        if (!c.lastInteraction) return false;
        return new Date(c.lastInteraction) >= thirtyDaysAgo;
      }).length,
    };
  }, [contacts]);

  const filters = [
    { id: "all" as ContactFilterId, label: "All", count: computedCounts.all },
    { id: "vip" as ContactFilterId, label: "VIP", count: computedCounts.vip },
    { id: "frequent" as ContactFilterId, label: "Frequent", count: computedCounts.frequent },
    { id: "recent" as ContactFilterId, label: "Recent", count: computedCounts.recent },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold tracking-tight">Contacts</h1>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium px-2.5">
              {counts.total}
            </span>
            {counts.vip > 0 && (
              <span className="inline-flex items-center gap-1 h-6 rounded-full bg-amber-500/10 text-amber-500 text-xs font-medium px-2">
                <Star className="size-3" />
                {counts.vip}
              </span>
            )}
            {counts.frequent > 0 && (
              <span className="inline-flex items-center gap-1 h-6 rounded-full bg-purple-500/10 text-purple-500 text-xs font-medium px-2">
                <Zap className="size-3" />
                {counts.frequent}
              </span>
            )}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchContacts} disabled={loading}>
          <RefreshCw className={cn("size-4 mr-1", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Filter bar */}
      <ContactsFilterBar
        filters={filters}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Error state */}
      {error && (
        <div className="px-4 py-3 bg-destructive/10 text-destructive text-sm border-b border-border">
          {error}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="h-full overflow-y-auto">
            <ContactSkeletonList count={6} />
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            {contacts.length === 0 ? (
              <>
                <div className="size-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <Users className="size-8 text-muted-foreground/30" />
                </div>
                <p className="text-sm font-medium">No contacts yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Connect your email to start building your contact list.
                </p>
              </>
            ) : (
              <>
                <div className="size-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <SearchX className="size-8 text-muted-foreground/30" />
                </div>
                <p className="text-sm font-medium">No contacts match your search</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try adjusting your filter or search query.
                </p>
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 text-xs"
                    onClick={() => setSearchQuery("")}
                  >
                    Clear search
                  </Button>
                )}
              </>
            )}
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="divide-y divide-border">
              {filteredContacts.map((contact) => (
                <ContactItem key={contact.id} contact={contact} />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
