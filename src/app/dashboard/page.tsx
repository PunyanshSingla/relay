"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LogOut, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export default function DashboardPage() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await authClient.signOut();
      router.push("/login");
    } catch (err) {
      console.error("Sign out error:", err);
      setIsSigningOut(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-background text-foreground overflow-hidden">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 dot-bg opacity-50" aria-hidden />
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full blur-[120px]"
        style={{ background: "radial-gradient(circle, oklch(0.78 0.16 75 / 0.1) 0%, transparent 70%)" }}
        aria-hidden
      />

      <div className="relative z-10 text-center space-y-6 max-w-md px-6">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-gradient-primary animate-pulse">
          Dashboard
        </h1>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
          Welcome to your workspace. You have successfully authenticated and entered the Relay AI command center.
        </p>
        <div className="pt-4 flex flex-col items-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors group"
          >
            <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
            Back to landing page
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="border-border bg-background hover:bg-surface text-muted-foreground hover:text-foreground"
          >
            {isSigningOut ? (
              <Loader2 className="size-3.5 animate-spin mr-2" />
            ) : (
              <LogOut className="size-3.5 mr-2" />
            )}
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
