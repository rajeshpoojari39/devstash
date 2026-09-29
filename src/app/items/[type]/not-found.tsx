import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ItemTypeNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 max-w-md mx-auto">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/10 text-destructive mb-4 shadow-xs">
        <AlertCircle className="h-8 w-8" />
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        Category Not Found
      </h1>

      <p className="text-sm text-muted-foreground mt-2">
        The item category you requested does not exist or you don&apos;t have
        permission to view it.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <Link
          href="/dashboard"
          className={cn(
            buttonVariants({ variant: "outline", size: "default" }),
            "flex items-center gap-2",
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
