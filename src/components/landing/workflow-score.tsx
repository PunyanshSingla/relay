import { Card, CardContent } from "@/components/ui/card";

const METRICS = [
  { value: "4h 12m", label: "Time Saved", sublabel: "this week" },
  { value: "23", label: "Emails Handled", sublabel: "automatically" },
  { value: "18", label: "Meetings Scheduled", sublabel: "via agent" },
  { value: "7", label: "Workflows Discovered", sublabel: "by Relay" },
] as const;

export function WorkflowScore() {
  return (
    <section className="relative z-10 mx-auto max-w-6xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          Productivity
        </span>
        <h2 className="mt-3 text-balance text-4xl font-semibold tracking-tight md:text-5xl">
          <span className="text-gradient">Measure what </span>
          <span className="font-display italic">matters.</span>
        </h2>
        <p className="mt-4 text-muted-foreground">
          Track your productivity gains. The more you use Relay, the more it saves.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-4">
        {METRICS.map((m) => (
          <Card key={m.label} className="border-border p-6 text-center">
            <CardContent className="p-0">
              <div className="font-display text-4xl italic text-gradient-primary">
                {m.value}
              </div>
              <div className="mt-2 text-sm font-medium text-foreground/85">
                {m.label}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {m.sublabel}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
