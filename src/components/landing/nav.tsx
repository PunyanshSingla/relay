"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/common/logo";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { authClient } from "@/lib/auth-client";

export function Nav() {
  const { data: session } = authClient.useSession();

  return (
    <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
      <Logo />
      <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
        <Link href="#features" className="transition-colors hover:text-foreground">
          Features
        </Link>
        <Link href="#agent" className="transition-colors hover:text-foreground">
          Agent
        </Link>
        <Link href="#shortcuts" className="transition-colors hover:text-foreground">
          Shortcuts
        </Link>
        <Link href="#changelog" className="transition-colors hover:text-foreground">
          Changelog
        </Link>
      </nav>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button
          asChild
          variant="ghost"
          className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline-flex"
        >
          {session ? (
            <Link href="/dashboard">Dashboard</Link>
          ) : (
            <Link href="/login">Sign in</Link>
          )}
        </Button>
        {!session && (
          <Button
            asChild
            className="rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background hover:scale-[1.02] hover:bg-foreground"
          >
            <Link href="/register">
              Get early access
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        )}
      </div>
    </header>
  );
}
