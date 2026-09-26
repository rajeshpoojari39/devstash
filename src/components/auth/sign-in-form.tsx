"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Mail,
  Lock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
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

function GitHubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const isRegistered = searchParams.get("registered") === "true";
  const isVerified = searchParams.get("verified") === "true";
  const isReset = searchParams.get("reset") === "true";
  const urlError = searchParams.get("error");

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGitHubLoading, setIsGitHubLoading] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);
  const [resendNotification, setResendNotification] = React.useState<
    string | null
  >(null);

  const [errorMessage, setErrorMessage] = React.useState<string | null>(
    urlError === "OAuthAccountNotLinked"
      ? "An account with this email already exists with another provider."
      : urlError === "email_not_verified"
        ? "Please verify your email address before signing in."
        : urlError
          ? "Authentication failed. Please check your credentials."
          : null,
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);
    setResendNotification(null);

    if (!email || !password) {
      setErrorMessage("Please fill in both email and password.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (res?.error) {
        if (
          res.code === "email_not_verified" ||
          res.error.includes("email_not_verified")
        ) {
          setErrorMessage(
            "Your email is not verified yet. Please check your inbox or resend the verification link below.",
          );
        } else {
          setErrorMessage("Invalid email or password.");
        }
        setIsLoading(false);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setErrorMessage("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  }

  async function handleResendVerification() {
    if (!email.trim()) {
      setErrorMessage(
        "Please enter your email address to resend the verification link.",
      );
      return;
    }

    setIsResending(true);
    setResendNotification(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setResendNotification(
          data.message || "Verification email sent! Please check your inbox.",
        );
      } else {
        setErrorMessage(
          data.error || "Failed to send verification email. Please try again.",
        );
      }
    } catch {
      setErrorMessage("Network error. Could not resend verification email.");
    } finally {
      setIsResending(false);
    }
  }

  async function handleGitHubSignIn() {
    try {
      setIsGitHubLoading(true);
      setErrorMessage(null);
      await signIn("github", { callbackUrl });
    } catch {
      setErrorMessage("Could not connect with GitHub. Please try again.");
      setIsGitHubLoading(false);
    }
  }

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
            Welcome back
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-1">
            Sign in to access your developer stash
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Success Banner from Email Verification */}
        {isVerified && !errorMessage && (
          <div className="flex items-start gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <p>
              Email verified successfully! You can now sign in with your
              credentials.
            </p>
          </div>
        )}

        {/* Success Banner from Password Reset */}
        {isReset && !errorMessage && (
          <div className="flex items-start gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <p>
              Password reset successfully! You can now sign in with your new
              password.
            </p>
          </div>
        )}

        {/* Success Banner from Registration */}
        {isRegistered && !isVerified && !isReset && !errorMessage && (
          <div className="flex items-start gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <p>
              Account created successfully! You can now sign in with your
              credentials.
            </p>
          </div>
        )}

        {/* Resend notification success banner */}
        {resendNotification && (
          <div className="flex items-start gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <p>{resendNotification}</p>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="flex flex-col gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>{errorMessage}</p>
            </div>
            {errorMessage.toLowerCase().includes("not verified") && (
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={isResending}
                className="self-start text-xs font-medium text-destructive underline underline-offset-4 hover:opacity-80 transition-opacity cursor-pointer inline-flex items-center gap-1.5 mt-1"
              >
                {isResending ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Resending...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3" />
                    <span>Resend verification email</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* GitHub OAuth Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full h-10 gap-2 border-border/80 bg-background text-foreground hover:bg-muted font-medium cursor-pointer"
          onClick={handleGitHubSignIn}
          disabled={isGitHubLoading || isLoading}
        >
          {isGitHubLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <GitHubIcon className="h-4 w-4" />
          )}
          <span>Sign in with GitHub</span>
        </Button>

        {/* Divider */}
        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground font-mono">
              Or continue with email
            </span>
          </div>
        </div>

        {/* Credentials Form */}
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
                disabled={isLoading || isGitHubLoading}
                className="pl-9 h-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={isLoading || isGitHubLoading}
                className="pl-9 h-9"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-10 mt-2 font-medium bg-white text-black hover:bg-neutral-200 cursor-pointer"
            disabled={isLoading || isGitHubLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col items-center gap-2 border-t border-border pt-4 text-center">
        <p className="text-xs sm:text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-foreground underline underline-offset-4 hover:text-primary transition-colors"
          >
            Create an account
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
