"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle2,
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

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const emailHint = searchParams.get("email");

  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Missing token guard
  if (!token) {
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
              Invalid Reset Link
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              The password reset token is missing or has an invalid format
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 border border-destructive/20 text-destructive">
            <AlertCircle className="h-7 w-7" />
          </div>

          <p className="text-sm text-neutral-300">
            This password reset link is invalid or incomplete. Please request a
            new link to reset your password.
          </p>

          <div className="pt-2">
            <Link
              href="/forgot-password"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg h-10 font-medium bg-white text-black hover:bg-neutral-200 cursor-pointer transition-colors text-sm shadow-xs"
            >
              <span>Request New Reset Link</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </CardContent>

        <CardFooter className="flex justify-center border-t border-border pt-4 text-center">
          <Link
            href="/sign-in"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
          >
            Back to Sign In
          </Link>
        </CardFooter>
      </Card>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);

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
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsSuccess(true);
      } else {
        setErrorMessage(
          data.error || "Failed to reset password. The link may have expired.",
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

  // Success State
  if (isSuccess) {
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
              Password Reset Complete
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              Your password has been successfully updated
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="h-7 w-7" />
          </div>

          <p className="text-sm text-neutral-300">
            You can now sign in with your new credentials.
          </p>

          <div className="pt-2">
            <Button
              type="button"
              onClick={() => router.push("/sign-in?reset=true")}
              className="w-full h-10 font-medium bg-white text-black hover:bg-neutral-200 cursor-pointer"
            >
              <span>Sign In with New Password</span>
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Reset Password Form
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
            Reset Your Password
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-1">
            {emailHint
              ? `Enter a new password for ${emailHint}`
              : "Choose a strong password with at least 8 characters"}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error Banner */}
        {errorMessage && (
          <div className="flex flex-col gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>{errorMessage}</p>
            </div>
            {errorMessage.toLowerCase().includes("expired") ||
            errorMessage.toLowerCase().includes("invalid") ? (
              <Link
                href="/forgot-password"
                className="self-start text-xs font-medium text-destructive underline underline-offset-4 hover:opacity-80 transition-opacity"
              >
                Request a new reset link
              </Link>
            ) : null}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                disabled={isLoading}
                className="pl-9 pr-9 h-9"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                disabled={isLoading}
                className="pl-9 pr-9 h-9"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
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
                <span>Resetting password...</span>
              </>
            ) : (
              <span>Reset Password</span>
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
