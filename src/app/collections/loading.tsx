import { Skeleton } from "@/components/ui/skeleton";

export default function CollectionsLoading() {
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
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
        </div>
      </div>

      {/* Responsive 3-column Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col justify-between rounded-xl border border-border/80 bg-card/60 p-4.5 space-y-4"
          >
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-7 w-7 rounded-md" />
              </div>
              <Skeleton className="h-3 w-16" />
              <div className="space-y-1.5 pt-1">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-4/5" />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-4 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
