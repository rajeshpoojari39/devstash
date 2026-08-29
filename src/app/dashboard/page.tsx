import {
  getDashboardCollections,
  getDashboardStats,
} from "@/lib/db/collections";
import {
  getDashboardPinnedItems,
  getDashboardRecentItems,
} from "@/lib/db/items";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { CollectionsSection } from "@/components/dashboard/collections-section";
import { PinnedItemsSection } from "@/components/dashboard/pinned-items-section";
import { RecentItemsSection } from "@/components/dashboard/recent-items-section";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [collections, stats, pinnedItems, recentItems] = await Promise.all([
    getDashboardCollections(),
    getDashboardStats(),
    getDashboardPinnedItems(),
    getDashboardRecentItems(undefined, 10),
  ]);

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
      <StatsCards stats={stats} />

      {/* Collections Grid */}
      <CollectionsSection collections={collections} />

      {/* Pinned Items */}
      <PinnedItemsSection items={pinnedItems} />

      {/* Recent Items List */}
      <RecentItemsSection items={recentItems} />
    </div>
  );
}
