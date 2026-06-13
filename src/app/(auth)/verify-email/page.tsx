"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/common/logo";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const email = searchParams.get("email") || "your email address";
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(30);
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  useEffect(() => {
    if (resendTimer === 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleChange = (index: number, value: string) => {
    setErrorMessage(null);
    const cleanedValue = value.replace(/[^0-9]/g, ""); // Allow digits only
    if (!cleanedValue) {
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);
      return;
    }

    const digit = cleanedValue[cleanedValue.length - 1];
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-focus next input
    if (index < 5 && digit) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      setErrorMessage(null);
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    const pastedData = e.clipboardData.getData("text").trim();
    if (!/^\d{6}$/.test(pastedData)) {
      setErrorMessage("Please paste a valid 6-digit numeric code.");
      return;
    }

    const digits = pastedData.split("");
    setOtp(digits);
    inputRefs.current[5]?.focus();
  };

  const handleResend = () => {
    setIsResending(true);
    setResendStatus(null);

    setTimeout(() => {
      setIsResending(false);
      setResendTimer(30);
      setResendStatus("New verification code sent.");
    }, 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) return;

    setIsLoading(true);
    setErrorMessage(null);

    setTimeout(() => {
      setIsLoading(false);
      // Simulate verification check
      if (code === "123456" || code === "000000" || code.length === 6) {
        router.push("/dashboard");
      } else {
        setErrorMessage("Invalid code. Please try again.");
      }
    }, 1800);
  };

  const isComplete = otp.every((digit) => digit !== "");

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
          <Link href="/" className="flex items-center gap-2">
            <Logo />
            <span className="text-xl font-semibold tracking-tight">Relay</span>
          </Link>
        </div>

        {/* Header Text */}
        <div className="mb-8 text-center space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Verify your email
          </h1>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            We&apos;ve sent a 6-digit code to <span className="font-semibold text-foreground/80">{email}</span>.
          </p>
        </div>

        {/* Card Component */}
        <Card className="border-border">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
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

              {/* 6 OTP Fields */}
              <div className="flex justify-between gap-2" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    disabled={isLoading}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="size-11 rounded-lg border border-border bg-background text-center text-lg font-bold transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none select-all disabled:opacity-50"
                  />
                ))}
              </div>

              <Button
                type="submit"
                disabled={isLoading || !isComplete}
                className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary"
              >
                {isLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Verify & Continue"
                )}
              </Button>
            </form>

            <div className="mt-6 flex flex-col items-center gap-3 text-xs text-muted-foreground">
              <div>
                Didn&apos;t get the code?{" "}
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
                    {isResending ? "Resending..." : "Resend code"}
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
