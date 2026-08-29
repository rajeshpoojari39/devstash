import Link from "next/link";
import { Clock } from "lucide-react";
import { DashboardItem } from "@/lib/db/items";
import { ItemCard } from "./item-card";

interface RecentItemsSectionProps {
  items: DashboardItem[];
}

export function RecentItemsSection({ items }: RecentItemsSectionProps) {
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

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/80 p-8 text-center">
          <p className="text-sm text-muted-foreground">No items created yet.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
