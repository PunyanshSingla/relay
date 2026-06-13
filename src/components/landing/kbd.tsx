export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-border bg-surface-2 px-1.5 font-mono text-[11px] font-medium text-muted-foreground shadow-[0_2px_0_oklch(0_0_0/0.4)]">
      {children}
    </kbd>
  );
}
