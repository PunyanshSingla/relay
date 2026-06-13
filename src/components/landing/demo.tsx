import { Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function Demo() {
  return (
    <section className="relative z-10 mx-auto max-w-6xl px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          See it in action
        </span>
        <h2 className="mt-3 text-balance text-4xl font-semibold tracking-tight md:text-5xl">
          <span className="text-gradient">One sentence. </span>
          <span className="font-display italic">Everything handled.</span>
        </h2>
      </div>

      <div className="mt-14">
        <Card className="overflow-hidden border-border shadow-[var(--shadow-elegant)]">
          <CardContent className="p-0">
            <div className="relative aspect-video bg-surface flex items-center justify-center">
              {/* Video will be embedded here */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10" />
              <Button
                size="lg"
                className="relative z-10 gap-2 bg-primary text-primary-foreground hover:bg-primary shadow-[0_0_40px_-10px_var(--glow)]"
              >
                <Play className="size-5" />
                Watch Demo
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
