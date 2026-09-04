"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, Home, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Global application error caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-6 text-foreground text-center">
      <div className="mx-auto max-w-md space-y-6 rounded-2xl border border-destructive/30 bg-card p-8 shadow-lg">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
          <AlertCircle className="h-7 w-7" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Application Error
          </h1>
          <p className="text-sm text-muted-foreground">
            {error.message ||
              "An unexpected error occurred. Please try again or return home."}
          </p>
          {error.digest && (
            <p className="font-mono text-xs text-muted-foreground/60">
              Digest: {error.digest}
            </p>
          )}
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            onClick={() => reset()}
            className="gap-2 cursor-pointer"
            variant="default"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Try again</span>
          </Button>
          <Button
            render={<Link href="/dashboard" />}
            variant="outline"
            className="gap-2 cursor-pointer"
          >
            <Home className="h-4 w-4" />
            <span>Dashboard</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
