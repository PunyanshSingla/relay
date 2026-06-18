"use client";

import { useState, useEffect } from "react";
import { Mail, Loader2, ArrowRight, Shield, Calendar, CheckCircle2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/common/logo";
import Link from "next/link";

export default function OnboardingPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ gmail: boolean; calendar: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/connect/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus({ gmail: false, calendar: false }));
  }, []);

  const handleConnectBoth = () => {
    setLoading(true);
    window.location.href = "/api/connect/all";
  };

  const bothConnected = status?.gmail && status?.calendar;

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="pointer-events-none absolute inset-0 dot-bg" aria-hidden />
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2"
        style={{
          background:
            "radial-gradient(ellipse at center top, oklch(0.78 0.16 75 / 0.12), transparent 60%)",
        }}
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Connect your accounts
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Relay needs access to your Gmail and Calendar to help you manage your inbox.
          </p>
        </div>

        {/* Gmail Card */}
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="mb-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Mail className="size-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Read & send emails</p>
                  <p className="text-xs text-muted-foreground">
                    Access your inbox to read, compose, and send emails
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Calendar className="size-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">View & manage events</p>
                  <p className="text-xs text-muted-foreground">
                    Access your calendar to view, create, and manage events
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="size-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Encrypted & secure</p>
                  <p className="text-xs text-muted-foreground">
                    Your credentials are encrypted and never shared
                  </p>
                </div>
              </div>
            </div>

            {bothConnected ? (
              <div className="flex items-center gap-2 h-11 px-4 rounded-md bg-green-500/10 border border-green-500/20">
                <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">Both Connected</span>
                <Badge variant="secondary" className="ml-auto text-xs bg-green-500/10 text-green-700 dark:text-green-300 border-0">
                  Ready
                </Badge>
              </div>
            ) : (
              <Button
                onClick={handleConnectBoth}
                disabled={loading}
                className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary"
              >
                {loading ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <svg className="mr-2 size-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                )}
                Connect Gmail & Calendar
                <ArrowRight className="size-4" />
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Continue button */}
        {bothConnected && (
          <div className="mt-6">
            <Button asChild className="h-11 w-full" size="lg">
              <Link href="/dashboard">
                Continue to Dashboard
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
