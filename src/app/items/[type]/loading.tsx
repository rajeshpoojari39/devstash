import { Skeleton } from "@/components/ui/skeleton";

export default function ItemsLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-3.5 w-16" />
        <Skeleton className="h-3 w-3 rounded-full" />
        <Skeleton className="h-3.5 w-24" />
      </div>

      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/60">
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-7 w-36" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
        </div>
      </div>

      {/* Responsive 3-column Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col justify-between gap-3.5 rounded-xl border border-border/80 border-l-2 border-l-border/60 bg-card/60 p-4"
          >
            <div className="flex items-start gap-3.5 flex-1 min-w-0 w-full">
              <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-36 sm:w-48" />
                  <Skeleton className="h-4 w-4 rounded-full" />
                </div>
                <Skeleton className="h-3.5 w-3/4 max-w-sm" />
                <div className="flex items-center gap-2 pt-1">
                  <Skeleton className="h-4 w-12 rounded" />
                  <Skeleton className="h-4 w-16 rounded" />
                  <Skeleton className="h-4 w-14 rounded" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end shrink-0">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
