"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Mail, Loader2, ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/common/logo";
import { authClient } from "@/lib/auth-client";

function VerifySentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const email = searchParams.get("email") || "your email address";
  const type = searchParams.get("type") || "signup";
  
  const [resendTimer, setResendTimer] = useState(30);
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  useEffect(() => {
    if (resendTimer === 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const isReset = type === "reset";

  const handleResend = async () => {
    setIsResending(true);
    setResendStatus(null);
    
    try {
      if (isReset) {
        const { error } = await authClient.requestPasswordReset({
          email: email.toLowerCase(),
          redirectTo: "/reset-password",
        });
        if (error) throw error;
        setResendStatus("Password reset link resent successfully. Check your inbox and console.");
      } else {
        const { error } = await authClient.sendVerificationEmail({
          email: email.toLowerCase(),
          callbackURL: "/dashboard",
        });
        if (error) throw error;
        setResendStatus("Verification email resent successfully. Check your inbox and console.");
      }
      setResendTimer(30);
    } catch (err: unknown) {
      console.error("Resend error:", err);
      const message = err instanceof Error ? err.message : "Failed to resend. Please try again.";
      setResendStatus(message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12">
      {/* Background patterns */}
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
        {/* Logo and Branding */}
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        {/* Header Text */}
        <div className="mb-8 text-center space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {isReset ? "Reset link sent" : "Check your inbox"}
          </h1>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {isReset 
              ? `We&apos;ve sent a password reset link to ${email}.`
              : `We&apos;ve sent a verification link to ${email}.`
            }
          </p>
        </div>

        {/* Card Component */}
        <Card className="border-border">
          <CardContent className="p-6 space-y-6">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="relative flex size-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 animate-pulse">
                <Mail className="size-6 text-primary" />
                <div className="absolute -inset-1 rounded-2xl bg-primary/15 blur opacity-50" />
              </div>
            </div>

            {resendStatus && (
              <div className="rounded-lg border border-border bg-surface/30 p-3 text-center text-xs text-muted-foreground font-medium">
                {resendStatus}
              </div>
            )}

            <div className="space-y-3">
              {/* Open Webmail Options */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  asChild
                  variant="outline"
                  className="h-11 border-border bg-background hover:bg-surface text-xs font-semibold"
                >
                  <a href="https://mail.google.com" target="_blank" rel="noopener noreferrer">
                    Gmail <ExternalLink className="size-3 ml-1" />
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-11 border-border bg-background hover:bg-surface text-xs font-semibold"
                >
                  <a href="https://outlook.live.com" target="_blank" rel="noopener noreferrer">
                    Outlook <ExternalLink className="size-3 ml-1" />
                  </a>
                </Button>
              </div>

              {/* Enter Code Redirect Button */}
              {!isReset && (
                <Button
                  onClick={() => router.push(`/verify-email?email=${encodeURIComponent(email)}`)}
                  className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary"
                >
                  Enter Verification Code
                  <ArrowRight className="size-4 ml-1.5" />
                </Button>
              )}
            </div>

            <div className="flex flex-col items-center gap-3 text-xs text-muted-foreground">
              <div>
                Didn&apos;t get the email?{" "}
                {resendTimer > 0 ? (
                  <span className="font-semibold text-primary">
                    Resend in {resendTimer}s
                  </span>
                ) : (
                  <button
                    onClick={handleResend}
                    disabled={isResending}
                    className="font-semibold text-primary hover:underline focus:outline-none"
                  >
                    {isResending ? "Resending..." : "Resend email"}
                  </button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Link */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function VerifySentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
          <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <Loader2 className="size-8 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground font-medium">
              Loading verification details...
            </span>
          </div>
        </div>
      }
    >
      <VerifySentContent />
    </Suspense>
  );
}
