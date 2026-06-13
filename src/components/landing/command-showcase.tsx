import { Check } from "lucide-react";
import { Kbd } from "./kbd";
import { CommandPalette } from "./command-palette";

const BULLETS = [
  "Fuzzy search across the entire inbox in under a second",
  "Local vector index — no Gmail API roundtrips",
  "Natural-language scheduling powered by Corsair MCP",
] as const;

export function CommandShowcase() {
  return (
    <section className="relative z-10 mx-auto max-w-6xl px-6 py-24">
      <div className="grid items-center gap-10 md:grid-cols-2">
        <div>
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
            Command surface
          </span>
          <h2 className="mt-3 text-balance text-4xl font-semibold tracking-tight md:text-5xl">
            <span className="text-gradient">One shortcut. </span>
            <span className="font-display italic">Every action.</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Hit <Kbd>⌘</Kbd>
            <Kbd>K</Kbd> and do anything: draft an email, schedule a meeting,
            snooze a thread, or send a calendar invite. No menus. No mouse. Just
            intent.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-foreground/85">
            {BULLETS.map((t) => (
              <li key={t} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex size-5 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Check className="size-3" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <CommandPalette />
      </div>
    </section>
  );
}
