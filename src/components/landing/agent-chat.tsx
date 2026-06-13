import { Bot, Sparkles, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Kbd } from "./kbd";

const CAPABILITIES = [
  "Schedule",
  "Reschedule",
  "Bulk archive",
  "Smart follow-up",
  "Brief me",
] as const;

export function AgentChat() {
  return (
    <section id="agent" className="relative z-10 mx-auto max-w-6xl px-6 py-24">
      <div className="grid items-center gap-10 md:grid-cols-2">
        <div className="order-2 md:order-1">
          <Card className="overflow-hidden border-border shadow-[var(--shadow-elegant)]">
            <div className="flex items-center gap-2 border-b border-border bg-surface/60 px-4 py-3 text-xs">
              <Bot className="size-4 text-primary" />
              <span className="font-medium">Relay Agent</span>
              <Badge variant="secondary" className="ml-auto bg-primary/15 px-2 py-0.5 text-[10px] text-primary">
                MCP · live
              </Badge>
            </div>
            <CardContent className="space-y-3 p-5">
              <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                Send a calendar invite to friend<span>@</span>corsair.dev at 9 AM
                next Thursday. Email him I&apos;m looking forward to it.
              </div>
              <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-border bg-surface px-4 py-3 text-sm">
                <p className="shimmer-text mb-2 font-medium">Working on it…</p>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Check className="size-3 text-primary" /> Created event ·
                    Thursday Jun 18, 9:00–9:30 AM
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-3 text-primary" /> Invite sent to
                    friend<span>@</span>corsair.dev
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-3 text-primary" /> Email drafted
                    &amp; sent · &quot;Looking forward&quot;
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-2 text-sm text-muted-foreground">
                <Sparkles className="size-3.5 text-primary" />
                Message Relay…
                <span className="ml-auto">
                  <Kbd>⌘</Kbd>
                  <Kbd>↵</Kbd>
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="order-1 md:order-2">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
            Agent · MCP
          </span>
          <h2 className="mt-3 text-balance text-4xl font-semibold tracking-tight md:text-5xl">
            <span className="text-gradient">Chat to schedule.</span>
            <br />
            <span className="font-display italic">Chat to send.</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Relay exposes Gmail and Calendar as MCP tools. Any agent — Claude,
            Cursor, your own — can compose multi-step workflows in a single
            sentence. Multi-recipient invites, smart follow-ups, batch replies.
            Done.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {CAPABILITIES.map((t) => (
              <Badge key={t} variant="outline" className="border-border bg-surface px-3 py-1 text-xs text-muted-foreground">
                {t}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
