"use client";

import * as React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Dashboard error boundary caught:", error);
  }, [error]);

  return (
    <div className="flex h-full min-h-[400px] w-full flex-col items-center justify-center p-6 text-center">
      <div className="mx-auto max-w-md space-y-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-8 backdrop-blur">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Something went wrong
          </h2>
          <p className="text-sm text-muted-foreground">
            {error.message ||
              "An unexpected error occurred while loading your dashboard data."}
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
            onClick={() => window.location.reload()}
            variant="outline"
            className="cursor-pointer"
          >
            Reload page
          </Button>
        </div>
      </div>
    </div>
  );
}
