"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  AlertCircle,
  Mail,
  Loader2,
  ArrowRight,
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

type VerificationStatus = "loading" | "success" | "error" | "idle";

export function VerifyEmailCard() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const emailParam = searchParams.get("email") || "";

  const [status, setStatus] = React.useState<VerificationStatus>(
    token ? "loading" : "idle",
  );
  const [message, setMessage] = React.useState<string>("");
  const [emailInput, setEmailInput] = React.useState(emailParam);
  const [isResending, setIsResending] = React.useState(false);
  const [resendStatus, setResendStatus] = React.useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  const hasExecutedRef = React.useRef(false);

  React.useEffect(() => {
    if (!token || hasExecutedRef.current) return;
    hasExecutedRef.current = true;

    async function executeVerification() {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, email: emailParam }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          setStatus("success");
          setMessage(
            data.message || "Your email has been verified successfully!",
          );
        } else {
          setStatus("error");
          setMessage(
            data.error ||
              "We could not verify your email address. The link may be invalid or expired.",
          );
        }
      } catch {
        setStatus("error");
        setMessage(
          "A network error occurred while verifying your email. Please try again.",
        );
      }
    }

    executeVerification();
  }, [token, emailParam]);

  async function handleResendEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setIsResending(true);
    setResendStatus(null);

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setResendStatus({
          success: true,
          message: data.message || "Verification email sent successfully!",
        });
      } else {
        setResendStatus({
          success: false,
          message:
            data.error ||
            "Failed to send verification email. Please try again.",
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
            {status === "loading" && "Verifying your email"}
            {status === "success" && "Email Verified!"}
            {status === "error" && "Verification Failed"}
            {status === "idle" && "Email Verification"}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-1">
            {status === "loading" &&
              "Please wait while we confirm your email address..."}
            {status === "success" && "Your DevStash account is now active"}
            {status === "error" && "Unable to verify this link"}
            {status === "idle" &&
              "Request a new verification link for your account"}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Loading State */}
        {status === "loading" && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Confirming your email with DevStash...
            </p>
          </div>
        )}

        {/* Success State */}
        {status === "success" && (
          <div className="space-y-4 py-2 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <p className="text-sm text-neutral-300">{message}</p>
            <Link
              href="/sign-in?verified=true"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg h-10 mt-4 font-medium bg-white text-black hover:bg-neutral-200 cursor-pointer transition-colors text-sm"
            >
              <span>Sign in to your account</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {/* Error or Idle State */}
        {(status === "error" || status === "idle") && (
          <div className="space-y-4">
            {status === "error" && (
              <div className="flex items-start gap-2.5 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>{message}</p>
              </div>
            )}

            {/* Resend status alert */}
            {resendStatus && (
              <div
                className={`flex items-start gap-2.5 rounded-lg border p-3 text-sm ${
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

            <form onSubmit={handleResendEmail} className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="resend-email">Enter your email address</Label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="resend-email"
                    type="email"
                    placeholder="developer@devstash.io"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    required
                    autoComplete="email"
                    disabled={isResending}
                    className="pl-9 h-9"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="outline"
                className="w-full h-10 gap-2 border-border/80 bg-background text-foreground hover:bg-muted font-medium cursor-pointer"
                disabled={isResending || !emailInput.trim()}
              >
                {isResending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Sending verification link...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    <span>Resend Verification Email</span>
                  </>
                )}
              </Button>
            </form>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col items-center gap-2 border-t border-border pt-4 text-center">
        <p className="text-xs sm:text-sm text-muted-foreground">
          Ready to sign in?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-foreground underline underline-offset-4 hover:text-primary transition-colors"
          >
            Back to sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
