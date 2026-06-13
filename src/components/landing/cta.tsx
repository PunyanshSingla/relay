"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export function CTA() {
  return (
    <section id="cta" className="relative z-10 mx-auto max-w-5xl px-6 py-24">
      <Card className="relative overflow-hidden border-border p-10 text-center md:p-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(circle at 50% 0%, var(--glow), transparent 60%)",
          }}
        />
        <CardContent className="relative p-0">
          <h2 className="text-balance text-4xl font-semibold tracking-tight md:text-6xl">
            <span className="text-gradient">Stop managing email.</span>
            <br />
            <span className="font-display italic text-gradient-primary">
              Start commanding it.
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-muted-foreground">
            Join the private beta. We&apos;re onboarding teams who live in their
            inbox and want it to keep up.
          </p>
          <form
            className="mx-auto mt-8 flex max-w-md flex-col gap-2 sm:flex-row"
            onSubmit={(e) => e.preventDefault()}
          >
            <Input
              type="email"
              placeholder="you@company.com"
              className="h-11 flex-1 rounded-full border-border bg-background/60 px-5 text-sm placeholder:text-muted-foreground focus:border-primary"
            />
            <Button
              type="submit"
              className="h-11 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground shadow-[0_10px_40px_-10px_var(--glow)] hover:scale-[1.02] hover:bg-primary"
            >
              Request access
              <ArrowRight className="size-4" />
            </Button>
          </form>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Free during beta · No credit card
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
