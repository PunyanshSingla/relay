"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/common/logo";
import { authClient } from "@/lib/auth-client";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const email = searchParams.get("email") || "your email address";
  const token = searchParams.get("token") || "";

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(30);
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Auto-verify if token is present in URL
  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const autoVerifyToken = async (verifyToken: string) => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const { error: verifyError } = await authClient.verifyEmail({
          query: { token: verifyToken },
        });

        if (cancelled) return;

        if (verifyError) {
          setErrorMessage(
            verifyError.message || "Failed to verify email. The link may be expired."
          );
          if (!cancelled) setIsLoading(false);
          return;
        }

        setIsSuccess(true);
        if (!cancelled) setIsLoading(false);
        timeoutId = setTimeout(() => {
          if (!cancelled) router.push("/dashboard");
        }, 2000);
      } catch (err) {
        if (!cancelled) {
          console.error("Auto verify unexpected error:", err);
          setErrorMessage("An unexpected error occurred during email verification.");
          setIsLoading(false);
        }
      }
    };

    if (token) {
      autoVerifyToken(token);
    }

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [token, router]);

  useEffect(() => {
    if (resendTimer === 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleResend = async () => {
    setIsResending(true);
    setResendStatus(null);

    try {
      const { error: resendError } = await authClient.sendVerificationEmail({
        email,
        callbackURL: "/dashboard",
      });

      if (resendError) {
        setErrorMessage(resendError.message || "Failed to resend verification email.");
        setIsResending(false);
        return;
      }

      setResendTimer(30);
      setResendStatus("New verification link sent. Check your inbox and terminal console.");
      setIsResending(false);
    } catch (err) {
      console.error("Resend verification unexpected error:", err);
      setErrorMessage("Failed to resend verification email.");
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
            {isSuccess ? "Verification successful" : "Verify your email"}
          </h1>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            {token
              ? "Validating your verification link..."
              : `We&apos;ve sent a verification link to ${email}.`}
          </p>
        </div>

        {/* Card Component */}
        <Card className="border-border">
          <CardContent className="p-6">
            {isSuccess ? (
              <div className="flex flex-col items-center justify-center text-center space-y-4 py-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="relative flex size-14 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10">
                  <ShieldCheck className="size-8 text-emerald-500" />
                  <div className="absolute -inset-1 rounded-full bg-emerald-500/15 blur opacity-50" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Your email has been verified. Redirecting you to your workspace...
                </p>
                <Loader2 className="size-4 animate-spin text-primary mt-2" />
              </div>
            ) : token && isLoading ? (
              <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Completing verification, please wait...
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {errorMessage && (
                  <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {resendStatus && (
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-center text-xs text-emerald-500 font-medium">
                    {resendStatus}
                  </div>
                )}

                <div className="space-y-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Click the verification link in your email to continue. The
                    link will expire in 24 hours.
                  </p>
                </div>
              </div>
            )}

            {!isSuccess && (
              <div className="mt-6 flex flex-col items-center gap-3 text-xs text-muted-foreground border-t border-border pt-4">
                <div>
                  Didn&apos;t get the email?{" "}
                  {resendTimer > 0 ? (
                    <span className="font-semibold text-primary">
                      Resend in {resendTimer}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={isResending}
                      className="font-semibold text-primary hover:underline focus:outline-none"
                    >
                      {isResending ? "Resending..." : "Resend verification email"}
                    </button>
                  )}
                </div>
              </div>
            )}
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

export default function VerifyEmailPage() {
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
      <VerifyEmailContent />
    </Suspense>
  );
}
