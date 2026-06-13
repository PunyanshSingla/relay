import {
  Nav,
  Hero,
  CommandShowcase,
  Demo,
  Features,
  HowItWorks,
  AgentChat,
  WorkflowScore,
  ChiefOfStaff,
  Pricing,
  FAQ,
  CTA,
  Footer,
} from "@/components/landing";

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Layered ambient background */}
      <div className="pointer-events-none absolute inset-0 dot-bg" aria-hidden />
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[900px] w-[1200px] -translate-x-1/2"
        style={{
          background:
            "radial-gradient(ellipse at center top, oklch(0.78 0.16 75 / 0.18), transparent 60%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-40 top-[600px] h-[500px] w-[500px] rounded-full blur-[120px]"
        style={{ background: "oklch(0.7 0.18 35 / 0.15)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-40 top-[1400px] h-[600px] w-[600px] rounded-full blur-[140px]"
        style={{ background: "oklch(0.78 0.16 75 / 0.1)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[400px]"
        style={{
          background: "linear-gradient(180deg, transparent, var(--background))",
        }}
        aria-hidden
      />

      <Nav />
      <Hero />
      <CommandShowcase />
      <Demo />
      <Features />
      <HowItWorks />
      <AgentChat />
      <WorkflowScore />
      <ChiefOfStaff />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}
