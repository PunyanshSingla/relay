import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const STEPS = [
  {
    n: "01",
    title: "Connect with Corsair",
    desc: "One OAuth flow links Gmail and Calendar. Corsair handles tokens, refresh, and rate limits.",
  },
  {
    n: "02",
    title: "Sync to local cache",
    desc: "Emails and events stream into Postgres + pgvector via realtime webhooks. No polling.",
  },
  {
    n: "03",
    title: "Command anything",
    desc: "Triage, search, schedule, and reply from one keyboard surface — or hand it to the agent.",
  },
] as const;

export function HowItWorks() {
  return (
    <section className="relative z-10 mx-auto max-w-6xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          How it works
        </span>
        <h2 className="mt-3 text-balance text-4xl font-semibold tracking-tight md:text-5xl">
          <span className="text-gradient">Three steps from </span>
          <span className="font-display italic">inbox chaos to calm.</span>
        </h2>
      </div>
      <div className="mt-14 grid gap-4 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <Card key={s.n} className="relative overflow-hidden border-border p-6">
            <CardContent className="p-0">
              <div className="mb-6 flex items-center justify-between">
                <span className="text-primary text-3xl font-bold italic">
                  {s.n}
                </span>
                <span className="ml-4 h-px flex-1 bg-border" />
                {i < STEPS.length - 1 && (
                  <ArrowRight className="ml-3 size-4 text-muted-foreground" />
                )}
              </div>
              <h3 className="text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {s.desc}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
