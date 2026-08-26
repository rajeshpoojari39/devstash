import { StatsCards } from "@/components/dashboard/stats-cards";
import { CollectionsSection } from "@/components/dashboard/collections-section";
import { PinnedItemsSection } from "@/components/dashboard/pinned-items-section";
import { RecentItemsSection } from "@/components/dashboard/recent-items-section";

export default function DashboardPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your developer knowledge hub
        </p>
      </div>

      {/* Summary Stats Cards */}
      <StatsCards />

      {/* Collections Grid */}
      <CollectionsSection />

      {/* Pinned Items */}
      <PinnedItemsSection />

      {/* Recent Items List */}
      <RecentItemsSection />
    </div>
  );
}
