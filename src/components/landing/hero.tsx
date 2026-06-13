import Link from "next/link";
import { ArrowRight, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Kbd } from "./kbd";
import { AppPreview } from "./app-preview";

export function Hero() {
  return (
    <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-16 md:pt-24">
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <Badge
          variant="outline"
          className="mb-6 gap-2 border-border bg-surface/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur"
        >
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
          </span>
          Now in private beta — powered by Corsair
        </Badge>

        <h1 className="text-balance text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
          <span className="text-gradient">Command your</span>
          <br />
          <span className="font-display italic text-gradient-primary">
            inbox &amp; calendar.
          </span>
        </h1>

        <p className="mt-6 max-w-xl text-balance text-base text-muted-foreground md:text-lg">
          Relay is a keyboard-first workspace that collapses Gmail and Google
          Calendar into a single, lightning-fast command surface. Triage,
          schedule, and reply at the speed of thought.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            asChild
            className="h-10 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-[0_0_0_1px_oklch(1_0_0/0.1),0_10px_40px_-10px_var(--glow)] hover:scale-[1.02] hover:bg-primary"
          >
            <Link href="#cta">
              Request invite
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-10 rounded-full border-border bg-surface/60 px-5 text-sm backdrop-blur hover:bg-surface-2"
          >
            <Link href="#agent">
              <Command className="size-4" />
              Try the agent
            </Link>
          </Button>
        </div>

        <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
          Press <Kbd>⌘</Kbd> <Kbd>K</Kbd> anywhere to open the command bar
        </div>
      </div>

      <div className="relative mx-auto mt-20 max-w-5xl">
        <div
          className="pointer-events-none absolute -inset-x-20 -top-10 h-40 blur-3xl"
          style={{ background: "var(--gradient-primary)", opacity: 0.15 }}
          aria-hidden
        />
        <AppPreview />
      </div>
    </section>
  );
}
