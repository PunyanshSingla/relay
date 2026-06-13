import {
  Search,
  Inbox,
  Sparkles,
  Send,
  Calendar,
  Clock,
  CornerDownLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Kbd } from "./kbd";
import { Logo } from "@/components/common/logo";

function SidebarItem({
  icon: Icon,
  label,
  count,
  active,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count?: string;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-md px-2 py-1.5 text-sm",
        active ? "bg-surface-2 text-foreground" : "text-muted-foreground"
      )}
    >
      <span className="flex items-center gap-2">
        <Icon className="size-3.5" />
        {label}
      </span>
      {count && (
        <span className="text-[10px] text-muted-foreground">{count}</span>
      )}
    </div>
  );
}

function EmailRow({
  from,
  subject,
  preview,
  time,
  unread,
  priority,
  active,
}: {
  from: string;
  subject: string;
  preview: string;
  time: string;
  unread?: boolean;
  priority?: string;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        "group cursor-pointer border-b border-border px-4 py-3 transition-colors hover:bg-surface/60",
        active && "bg-surface/80"
      )}
    >
      <div className="mb-1 flex items-center justify-between">
        <span
          className={cn(
            "text-sm",
            unread ? "font-semibold text-foreground" : "text-muted-foreground"
          )}
        >
          {from}
        </span>
        <span className="text-[10px] text-muted-foreground">{time}</span>
      </div>
      <div className="flex items-center gap-2">
        {priority && (
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-[9px] font-medium",
              priority === "P1" && "bg-accent/20 text-accent",
              priority === "Cal" && "bg-primary/15 text-primary",
              priority !== "P1" &&
              priority !== "Cal" &&
              "bg-surface-2 text-muted-foreground"
            )}
          >
            {priority}
          </span>
        )}
        <span className="truncate text-xs text-foreground/80">{subject}</span>
      </div>
      <div className="mt-0.5 truncate text-xs text-muted-foreground">
        {preview}
      </div>
    </div>
  );
}

export function AppPreview() {
  return (
    <Card className="overflow-hidden border-border shadow-[var(--shadow-elegant)]">
      {/* Window chrome */}
      <div className="flex items-center justify-between border-b border-border bg-surface/60 px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-[oklch(0.65_0.22_25)]" />
          <span className="size-2.5 rounded-full bg-[oklch(0.82_0.16_75)]" />
          <span className="size-2.5 rounded-full bg-[oklch(0.7_0.15_150)]" />
        </div>
        <div className="flex items-center gap-2 rounded-md border border-border bg-background/60 px-3 py-1 text-xs text-muted-foreground">
          <Search className="size-3" />
          Relay.app — Inbox
          <span className="ml-3 inline-flex items-center gap-1 text-[10px]">
            <Kbd>⌘K</Kbd>
          </span>
        </div>
        <div className="w-16" />
      </div>

      <CardContent className="grid grid-cols-[200px_1fr] p-0 md:grid-cols-[220px_360px_1fr]">
        {/* Sidebar */}
        <aside className="border-r border-border bg-surface/40 p-3">
          <div className="mb-4 flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium">
            <Logo />
            <span>you@Relay.app</span>
          </div>
          <div className="space-y-0.5">
            <SidebarItem icon={Inbox} label="Inbox" count="12" active />
            <SidebarItem icon={Sparkles} label="Priority" count="3" />
            <SidebarItem icon={Send} label="Sent" />
            <SidebarItem icon={Calendar} label="Calendar" />
            <SidebarItem icon={Clock} label="Snoozed" />
          </div>
          <div className="my-3 h-px bg-border" />
          <div className="px-2 text-[10px] uppercase tracking-wider text-muted-foreground">
            Labels
          </div>
          {["Investors", "Hiring", "Customers"].map((l) => (
            <div
              key={l}
              className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground"
            >
              <span className="size-2 rounded-sm bg-primary/70" />
              {l}
            </div>
          ))}
        </aside>

        {/* Email list */}
        <div className="hidden border-r border-border md:block">
          <EmailRow
            from="Hitesh Choudhary"
            subject="Re: Cohort feedback loop"
            preview="Loving the new keyboard nav — one thing…"
            time="9:42"
            unread
            priority="P1"
            active
          />
          <EmailRow
            from="Calendar"
            subject="Tomorrow · Design review with Piyush"
            preview="10:00 – 10:30 · Google Meet"
            time="8:10"
            priority="Cal"
          />
          <EmailRow
            from="Stripe"
            subject="Payout of $4,820.00 sent"
            preview="Your funds are on the way to •••• 1124"
            time="Yes"
          />
          <EmailRow
            from="friend@corsair.dev"
            subject="Thursday sync"
            preview="Sounds great, see you at 9!"
            time="Mon"
            unread
            priority="P2"
          />
          <EmailRow
            from="GitHub"
            subject="New PR · feat/agent-mcp"
            preview="@you was requested as a reviewer"
            time="Sun"
          />
          <EmailRow
            from="Vercel"
            subject="Deployment ready · Relay-app"
            preview="Preview is live at Relay-git…"
            time="Sat"
          />
        </div>

        {/* Reader */}
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
                HC
              </div>
              <div>
                <div className="text-sm font-semibold">Hitesh Choudhary</div>
                <div className="text-[11px] text-muted-foreground">
                  to you · 9:42 AM
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm" className="h-7 border-border bg-surface/60 text-[11px] text-muted-foreground">
                <Kbd>E</Kbd> Archive
              </Button>
              <Button variant="outline" size="sm" className="h-7 border-border bg-surface/60 text-[11px] text-muted-foreground">
                <Kbd>R</Kbd> Reply
              </Button>
            </div>
          </div>
          <h3 className="text-lg font-semibold leading-tight">
            Re: Cohort feedback loop
          </h3>
          <div className="mt-3 space-y-2.5 text-sm leading-relaxed text-foreground/85">
            <p>
              Loving the new keyboard nav — one thing we should consider is
              exposing the agent inside the composer, so users can dictate
              scheduling intents inline.
            </p>
            <p>
              Could we also wire the priority filter to skip newsletters by
              default?
            </p>
          </div>

          <div className="mt-5 rounded-xl border border-border bg-surface/60 p-3">
            <div className="mb-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Sparkles className="size-3 text-primary" />
              Suggested reply · Relay Agent
            </div>
            <p className="text-sm text-foreground/90">
              Great call. I&apos;ll wire the composer dictation behind{" "}
              <span className="font-mono text-primary">⌘;</span> and default
              newsletters to silent. Pushing a preview today.
            </p>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Kbd>Tab</Kbd> accept · <Kbd>⌘</Kbd>
                <Kbd>↵</Kbd> send
              </div>
              <Button size="sm" className="h-7 bg-primary px-2.5 text-[11px] font-medium text-primary-foreground">
                Send <CornerDownLeft className="size-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
