import Link from "next/link";
import { Clock } from "lucide-react";
import { mockItems } from "@/lib/mock-data";
import { ItemCard } from "./item-card";

export function RecentItemsSection() {
  const recentItems = [...mockItems]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 10);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-foreground">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold tracking-tight">Recent Items</h2>
        </div>
        <Link
          href="/items"
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          View all items
        </Link>
      </div>

      <div className="space-y-2.5">
        {recentItems.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
