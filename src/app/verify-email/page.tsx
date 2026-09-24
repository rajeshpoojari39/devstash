import { Suspense } from "react";
import type { Metadata } from "next";
import { VerifyEmailCard } from "@/components/auth/verify-email-card";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Verify Email - DevStash",
  description: "Verify your email address to access your DevStash account",
};

export default function VerifyEmailPage() {
  return (
    <main className="relative flex min-h-screen w-full items-center justify-center p-4 bg-radial-[circle_at_top,_var(--tw-gradient-stops)] from-neutral-900/50 via-background to-background">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293715_1px,transparent_1px),linear-gradient(to_bottom,#1f293715_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="relative z-10 w-full max-w-md">
        <Suspense
          fallback={
            <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 space-y-6">
              <div className="flex justify-center">
                <Skeleton className="h-10 w-36 rounded-lg" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-7 w-48 mx-auto rounded" />
                <Skeleton className="h-4 w-64 mx-auto rounded" />
              </div>
              <div className="space-y-4 pt-4">
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            </div>
          }
        >
          <VerifyEmailCard />
        </Suspense>
      </div>
    </main>
  );
}
