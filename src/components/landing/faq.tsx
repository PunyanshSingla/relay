"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";

const FAQS = [
  {
    q: "Is Relay a Gmail clone?",
    a: "No. Relay uses Gmail and Calendar as data sources via Corsair, but the workflow, UI, and shortcuts are designed from scratch around keyboard-first triage.",
  },
  {
    q: "How does the agent work?",
    a: "Corsair exposes Gmail and Calendar as MCP tools. Any agent — Claude, GPT, your own — can read, draft, schedule, and send on your behalf with full audit logs.",
  },
  {
    q: "Where is my data stored?",
    a: "In your own Postgres instance. Emails and events are cached locally via Corsair webhooks so search runs in under a second without hitting Google.",
  },
  {
    q: "Is it open source?",
    a: "Yes. The full Relay codebase is MIT-licensed on GitHub. Fork it, self-host it, or extend the command palette with your own plugins.",
  },
] as const;

export function FAQ() {
  return (
    <section className="relative z-10 mx-auto max-w-3xl px-6 py-24">
      <div className="text-center">
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          Questions
        </span>
        <h2 className="mt-3 text-balance text-4xl font-semibold tracking-tight md:text-5xl">
          <span className="text-gradient">Frequently </span>
          <span className="font-display italic">asked.</span>
        </h2>
      </div>
      <Card className="mt-12 overflow-hidden border-border">
        <Accordion type="multiple" className="w-full">
          {FAQS.map((f) => (
            <AccordionItem key={f.q} value={f.q} className="border-border px-6">
              <AccordionTrigger className="py-5 text-base font-medium hover:no-underline [&>svg]:text-muted-foreground">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Card>
    </section>
  );
}
