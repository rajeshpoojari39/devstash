import { Pin } from "lucide-react";
import { mockItems } from "@/lib/mock-data";
import { ItemCard } from "./item-card";

export function PinnedItemsSection() {
  const pinnedItems = mockItems.filter((item) => item.isPinned);

  if (pinnedItems.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Pin className="h-4 w-4 rotate-45" />
        <h2 className="text-sm font-semibold tracking-tight text-muted-foreground uppercase">
          Pinned
        </h2>
      </div>

      <div className="space-y-2.5">
        {pinnedItems.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
