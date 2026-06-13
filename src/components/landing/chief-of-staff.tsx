import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

const RESPONSIBILITIES = [
  { icon: "⚡", text: "Prioritize work" },
  { icon: "💡", text: "Suggest actions" },
  { icon: "📋", text: "Prepare meetings" },
  { icon: "🔄", text: "Manage follow-ups" },
  { icon: "🧠", text: "Discover automations" },
  { icon: "⏱️", text: "Reduce repetitive work" },
] as const;

export function ChiefOfStaff() {
  return (
    <section className="relative z-10 mx-auto max-w-6xl px-6 py-24">
      <div className="grid items-center gap-10 md:grid-cols-2">
        {/* Chat preview */}
        <div className="order-2 md:order-1">
          <Card className="overflow-hidden border-border shadow-[var(--shadow-elegant)]">
            <div className="flex items-center gap-2 border-b border-border bg-surface/60 px-4 py-3 text-xs">
              <Sparkles className="size-4 text-primary" />
              <span className="font-medium">Relay AI</span>
              <Badge variant="secondary" className="ml-auto bg-primary/15 px-2 py-0.5 text-[10px] text-primary">
                Chief of Staff
              </Badge>
            </div>
            <CardContent className="space-y-3 p-5">
              <div className="rounded-2xl rounded-bl-sm border border-border bg-surface px-4 py-3 text-sm">
                <p className="mb-2 font-medium">Good morning.</p>
                <div className="space-y-1.5 text-muted-foreground">
                  <p>You have 2 urgent conversations.</p>
                  <p>1 investor waiting for a reply.</p>
                  <p>3 meetings today.</p>
                </div>
                <div className="mt-3 rounded-lg bg-primary/10 px-3 py-2 text-sm">
                  <span className="font-medium text-primary">Recommended:</span>{" "}
                  Reply to the investor email.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <div className="order-1 md:order-2">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
            The vision
          </span>
          <h2 className="mt-3 text-balance text-4xl font-semibold tracking-tight md:text-5xl">
            <span className="text-gradient">Your AI </span>
            <span className="font-display italic">Chief of Staff.</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Instead of being another email client, Relay becomes a proactive
            assistant that manages your email, calendar, and workflows so you
            can focus on what matters.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {RESPONSIBILITIES.map((r) => (
              <div
                key={r.text}
                className="flex items-center gap-2 rounded-lg border border-border bg-surface/40 px-3 py-2 text-sm text-foreground/85"
              >
                <span>{r.icon}</span>
                {r.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
