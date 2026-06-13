import { Card, CardContent } from "@/components/ui/card";
import type { ComponentType } from "react";

interface Feature {
  icon: ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}

const FEATURES: Feature[] = [
  {
    icon: (props) => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
        <path d="m7 10 3 3 7-7" />
      </svg>
    ),
    title: "Workflow Learning",
    desc: "Relay observes your behavior and auto-suggests automations. No manual setup required.",
  },
  {
    icon: (props) => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    title: "Prompt Enhancement",
    desc: "Three modes: Normal, Improve, Clarify. AI refines your intent before execution.",
  },
  {
    icon: (props) => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "Meeting Intelligence",
    desc: "Before every meeting, Relay prepares context from past emails and conversations.",
  },
  {
    icon: (props) => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
    title: "Outcome Mode",
    desc: "Focus on goals, not tasks. Relay suggests multi-step workflows to achieve outcomes.",
  },
  {
    icon: (props) => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    title: "Local Indexing",
    desc: "Real-time sync to a local Postgres + pgvector database ensures sub-second offline search and complete privacy.",
  },
  {
    icon: (props) => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" x2="8" y1="13" y2="13" />
        <line x1="16" x2="8" y1="17" y2="17" />
        <line x1="10" x2="8" y1="9" y2="9" />
      </svg>
    ),
    title: "Open Source",
    desc: "MIT licensed. Fork it, self-host it, and extend it with your own custom plugins.",
  },
];

export function Features() {
  return (
    <section id="features" className="relative z-10 mx-auto max-w-6xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          Why Relay
        </span>
        <h2 className="mt-3 text-balance text-4xl font-semibold tracking-tight md:text-5xl">
          <span className="text-gradient">The workflow Gmail </span>
          <span className="font-display italic">should have shipped.</span>
        </h2>
      </div>
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <Card
            key={f.title}
            className="group relative overflow-hidden border-border p-6 transition-colors hover:border-primary/30"
          >
            <CardContent className="p-0">
              <div className="mb-4 inline-flex size-10 items-center justify-center rounded-lg bg-surface-2">
                <f.icon className="size-5 text-primary" />
              </div>
              <h3 className="text-base font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {f.desc}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
