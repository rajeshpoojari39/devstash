"use client";

import * as React from "react";
import Link from "next/link";
import {
  Mail,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ArrowLeft,
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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordForm() {
  const [email, setEmail] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsSubmitted(true);
      } else {
        setErrorMessage(
          data.error || "Failed to send reset instructions. Please try again.",
        );
      }
    } catch {
      setErrorMessage(
        "An unexpected network error occurred. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  // Submitted / Success State
  if (isSubmitted) {
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
              Password reset instructions sent
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="h-7 w-7" />
          </div>

          <div className="space-y-2 text-sm text-neutral-300">
            <p>
              If an account exists with this email address, we&apos;ve sent a
              reset link to:
            </p>
            <p className="font-semibold text-foreground bg-muted/60 py-1.5 px-3 rounded-md border border-border inline-block break-all">
              {email.trim()}
            </p>
            <p className="text-xs text-muted-foreground pt-1">
              Click the link in your email to choose a new password. The link
              expires in <strong>1 hour</strong>.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/sign-in"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg h-10 font-medium bg-white text-black hover:bg-neutral-200 cursor-pointer transition-colors text-sm shadow-xs"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col items-center gap-2 border-t border-border pt-4 text-center">
          <p className="text-xs text-muted-foreground">
            Didn&apos;t receive an email or entered the wrong address?{" "}
            <button
              type="button"
              onClick={() => {
                setIsSubmitted(false);
                setErrorMessage(null);
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

  // Initial Request Form
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
            Forgot password?
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-1">
            Enter your email to receive a password reset link
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

          <Button
            type="submit"
            className="w-full h-10 mt-2 font-medium bg-white text-black hover:bg-neutral-200 cursor-pointer"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span>Sending reset link...</span>
              </>
            ) : (
              <span>Send Reset Link</span>
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col items-center gap-2 border-t border-border pt-4 text-center">
        <p className="text-xs sm:text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-foreground underline underline-offset-4 hover:text-primary transition-colors"
          >
            Back to Sign In
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
