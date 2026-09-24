"use client";

import * as React from "react";
import Link from "next/link";
import {
  User,
  Mail,
  Lock,
  AlertCircle,
  Loader2,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DevStashLogo } from "@/components/brand/logo";

export function RegisterForm() {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Post-registration verification state
  const [registeredEmail, setRegisteredEmail] = React.useState<string | null>(
    null,
  );
  const [isResending, setIsResending] = React.useState(false);
  const [resendStatus, setResendStatus] = React.useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);

    // Client-side validations
    if (!name.trim()) {
      setErrorMessage("Please enter your name.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(
          data.error || "Failed to create account. Please try again.",
        );
        setIsLoading(false);
        return;
      }

      // Successful registration -> Transition to verification pending view
      setRegisteredEmail(email.trim().toLowerCase());
    } catch {
      setErrorMessage(
        "An unexpected network error occurred. Please try again.",
      );
      setIsLoading(false);
    }
  }

  async function handleResendVerification() {
    if (!registeredEmail) return;

    setIsResending(true);
    setResendStatus(null);

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredEmail }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setResendStatus({
          success: true,
          message: data.message || "A new verification email has been sent!",
        });
      } else {
        setResendStatus({
          success: false,
          message: data.error || "Failed to resend verification email.",
        });
      }
    } catch {
      setResendStatus({
        success: false,
        message: "Network error. Please try again later.",
      });
    } finally {
      setIsResending(false);
    }
  }

  // Render Post-Registration "Check Your Email" State
  if (registeredEmail) {
    return (
      <Card className="w-full max-w-md border-border/80 bg-card/95 shadow-xl backdrop-blur">
        <CardHeader className="space-y-3 text-center pb-4">
          <div className="flex justify-center">
            <Link
              href="/dashboard"
              className="transition-transform hover:scale-105"
            >
              <DevStashLogo size="lg" showText={true} />
            </Link>
          </div>
          <div>
            <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight">
              Check your inbox
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              Verify your email address to get started
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-primary">
            <Mail className="h-7 w-7" />
          </div>

          <div className="space-y-2 text-sm text-neutral-300">
            <p>We&apos;ve sent a verification link to:</p>
            <p className="font-semibold text-foreground bg-muted/60 py-1.5 px-3 rounded-md border border-border inline-block break-all">
              {registeredEmail}
            </p>
            <p className="text-xs text-muted-foreground pt-1">
              Click the link in your email to activate your account. The link
              will expire in 24 hours.
            </p>
          </div>

          {resendStatus && (
            <div
              className={`flex items-start gap-2.5 rounded-lg border p-3 text-sm text-left ${
                resendStatus.success
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-destructive/40 bg-destructive/10 text-destructive"
              }`}
            >
              {resendStatus.success ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              )}
              <p>{resendStatus.message}</p>
            </div>
          )}

          <div className="pt-2 space-y-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleResendVerification}
              disabled={isResending}
              className="w-full h-9 gap-2 border-border/80 bg-background text-foreground hover:bg-muted font-medium cursor-pointer"
            >
              {isResending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Resending link...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Resend verification email</span>
                </>
              )}
            </Button>

            <Link
              href="/sign-in"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg h-10 font-medium bg-white text-black hover:bg-neutral-200 cursor-pointer transition-colors text-sm shadow-xs"
            >
              <span>Go to Sign In</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col items-center gap-2 border-t border-border pt-4 text-center">
          <p className="text-xs text-muted-foreground">
            Entered the wrong email?{" "}
            <button
              type="button"
              onClick={() => {
                setRegisteredEmail(null);
                setIsLoading(false);
              }}
              className="font-medium text-foreground underline underline-offset-4 hover:text-primary transition-colors cursor-pointer"
            >
              Try again
            </button>
          </p>
        </CardFooter>
      </Card>
    );
  }

  // Registration Form
  return (
    <Card className="w-full max-w-md border-border/80 bg-card/95 shadow-xl backdrop-blur">
      <CardHeader className="space-y-3 text-center pb-4">
        <div className="flex justify-center">
          <Link
            href="/dashboard"
            className="transition-transform hover:scale-105"
          >
            <DevStashLogo size="lg" showText={true} />
          </Link>
        </div>
        <div>
          <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight">
            Create an account
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-1">
            Start organizing your developer knowledge hub
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error Banner */}
        {errorMessage && (
          <div className="flex items-start gap-2.5 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                disabled={isLoading}
                className="pl-9 h-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email address</Label>
            <div className="relative">
              <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="developer@devstash.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={isLoading}
                className="pl-9 h-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                disabled={isLoading}
                className="pl-9 h-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                disabled={isLoading}
                className="pl-9 h-9"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-10 mt-2 font-medium bg-white text-black hover:bg-neutral-200 cursor-pointer"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span>Creating account...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col items-center gap-2 border-t border-border pt-4 text-center">
        <p className="text-xs sm:text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-foreground underline underline-offset-4 hover:text-primary transition-colors"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
