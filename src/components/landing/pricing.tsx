import { Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PricingTier {
  name: string;
  price: string;
  period: string;
  description: string;
  badge?: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
}

const TIERS: PricingTier[] = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    description: "Perfect for trying Relay out.",
    features: [
      "Gmail & Calendar integration",
      "AI Command Center (20 commands/day)",
      "Keyboard shortcuts",
      "Basic search",
      "Community support",
    ],
    cta: "Get started",
  },
  {
    name: "Pro",
    price: "₹999",
    period: "/ month",
    description: "For power users who want the full experience.",
    badge: "Most Popular",
    features: [
      "Everything in Free",
      "Unlimited AI commands",
      "MCP Agent chat",
      "Workflow learning engine",
      "Meeting intelligence",
      "Prompt enhancement (Normal/Improve/Clarify)",
      "Workflow score & analytics",
      "Priority support",
    ],
    cta: "Start free trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For teams that need full control.",
    features: [
      "Everything in Pro",
      "Team workspaces",
      "Shared automations",
      "Dedicated support",
      "Self-hosted option",
    ],
    cta: "Contact sales",
  },
];

export function Pricing() {
  return (
    <section className="relative z-10 mx-auto max-w-6xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          Simple pricing
        </span>
        <h2 className="mt-3 text-balance text-4xl font-semibold tracking-tight md:text-5xl">
          <span className="text-gradient">Start free. </span>
          <span className="font-display italic">Scale when ready.</span>
        </h2>
        <p className="mt-4 text-muted-foreground">
          No credit card required. Free during beta.
        </p>
      </div>

      <div className="mt-14 grid gap-4 md:grid-cols-3">
        {TIERS.map((tier) => (
          <Card
            key={tier.name}
            className={`relative flex flex-col border-border pt-8 pb-6 px-6 overflow-visible ${tier.highlighted
                ? "border-primary shadow-[0_0_0_1px_var(--primary),0_10px_40px_-10px_var(--glow)]"
                : ""
              }`}
          >
            {tier.badge && (
              <Badge
                variant="default"
                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary px-3 py-0.5 text-xs text-primary-foreground"
              >
                {tier.badge}
              </Badge>
            )}
            <CardContent className="flex flex-1 flex-col p-0">
              <div className="mb-4">
                <h3 className="text-lg font-semibold">{tier.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {tier.description}
                </p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-semibold tracking-tight">
                  {tier.price}
                </span>
                {tier.period && (
                  <span className="ml-1 text-sm text-muted-foreground">
                    {tier.period}
                  </span>
                )}
              </div>

              <ul className="mb-8 flex-1 space-y-2.5">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <Check className="size-3" />
                    </span>
                    <span className="text-foreground/85">{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                variant={tier.highlighted ? "default" : "outline"}
                className={`w-full ${tier.highlighted
                    ? "bg-primary text-primary-foreground hover:bg-primary"
                    : "border-border"
                  }`}
              >
                <Link href="/register">{tier.cta}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
