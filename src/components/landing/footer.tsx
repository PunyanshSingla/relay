import Link from "next/link";
import { Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/common/logo";

export function Footer() {
  return (
    <footer
      id="changelog"
      className="relative z-10 mx-auto max-w-6xl px-6 py-12"
    >
      <div className="flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Logo />
          <span className="font-semibold text-foreground">Relay</span>
          <span>
            · © 2026 · Built with Corsair for the MacBook Hackathon
          </span>
        </div>
        <div className="flex items-center gap-5 text-sm text-muted-foreground">
          <Button variant="link" asChild className="h-auto p-0 text-muted-foreground hover:text-foreground">
            <Link href="#">Privacy</Link>
          </Button>
          <Button variant="link" asChild className="h-auto p-0 text-muted-foreground hover:text-foreground">
            <Link href="#">Terms</Link>
          </Button>
          <Button variant="link" asChild className="h-auto p-0 text-muted-foreground hover:text-foreground">
            <Link href="#">
              <Code2 className="size-4" /> GitHub
            </Link>
          </Button>
        </div>
      </div>
    </footer>
  );
}
