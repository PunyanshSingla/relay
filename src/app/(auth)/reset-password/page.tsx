"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Lock, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/common/logo";
import { authClient } from "@/lib/auth-client";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(4);

  // Password strength logic
  const passwordStrength = (() => {
    if (!password) return { score: 0, label: "", colorClass: "bg-muted" };
    
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    let label = "Weak";
    let colorClass = "bg-destructive";
    if (score === 3) {
      label = "Medium";
      colorClass = "bg-amber-500";
    } else if (score === 4) {
      label = "Strong";
      colorClass = "bg-emerald-500";
    }

    return { score, label, colorClass };
  })();

  // Handle countdown redirect on success
  useEffect(() => {
    if (!isSuccess) return;
    if (countdown === 0) {
      router.push("/login");
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isSuccess, countdown, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Reset token is missing from the URL. Please request a new link.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (passwordStrength.score < 3) {
      setError("Please select a stronger password.");
      return;
    }

    setLoading(true);

    try {
      const { error: resetError } = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (resetError) {
        setError(resetError.message || "Failed to reset password. The link may have expired.");
        setLoading(false);
        return;
      }

      setIsSuccess(true);
      setLoading(false);
    } catch (err) {
      console.error("Reset password unexpected error:", err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
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
            Set new password
          </h1>
          <p className="text-sm text-muted-foreground">
            {isSuccess ? "Your password has been reset." : "Choose a strong password for your account."}
          </p>
        </div>

        {/* Card Component */}
        <Card className="border-border">
          <CardContent className="p-6">
            {isSuccess ? (
              <div className="flex flex-col items-center justify-center text-center space-y-6 py-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="relative flex size-14 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10">
                  <ShieldCheck className="size-8 text-emerald-500" />
                  <div className="absolute -inset-1 rounded-full bg-emerald-500/15 blur opacity-50" />
                </div>
                
                <p className="text-sm text-muted-foreground max-w-xs">
                  Your password has been successfully reset. You can now use your new credentials to sign in.
                </p>

                <div className="text-xs text-muted-foreground/80 font-medium">
                  Redirecting to login in <span className="text-primary font-bold">{countdown}s</span>...
                </div>

                <Button
                  asChild
                  className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary"
                >
                  <Link href="/login">Sign In Now</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-foreground/85">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      className="h-11 border-border bg-background pl-10"
                      disabled={loading}
                    />
                  </div>

                  {/* Password Strength Indicator */}
                  {password && (
                    <div className="space-y-1.5 pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="flex justify-between items-center text-[10px] uppercase font-semibold text-muted-foreground">
                        <span>Password Strength</span>
                        <span className="font-bold">{passwordStrength.label}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        {[1, 2, 3, 4].map((step) => (
                          <div
                            key={step}
                            className={`h-1 rounded-full transition-all duration-300 ${
                              step <= passwordStrength.score
                                ? passwordStrength.colorClass
                                : "bg-border dark:bg-border/30"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground/85">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Verify password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="h-11 border-border bg-background pl-10"
                      disabled={loading}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !password || !confirmPassword}
                  className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary"
                >
                  {loading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      Reset Password
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Footer Link */}
        {!isSuccess && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-medium text-primary hover:underline">
              Back to sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
          <div className="flex flex-col items-center justify-center p-8 space-y-4">
            <Loader2 className="size-8 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground font-medium">
              Loading password reset configuration...
            </span>
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
