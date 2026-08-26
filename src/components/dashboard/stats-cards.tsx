import { Layers, Folder, Star, BookmarkCheck } from "lucide-react";
import { mockItems, mockCollections } from "@/lib/mock-data";

export function StatsCards() {
  const totalItems = mockItems.length;
  const totalCollections = mockCollections.length;
  const favoriteItems = mockItems.filter((i) => i.isFavorite).length;
  const favoriteCollections = mockCollections.filter(
    (c) => c.isFavorite,
  ).length;

  const stats = [
    {
      label: "Total Items",
      value: totalItems,
      icon: Layers,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
    },
    {
      label: "Total Collections",
      value: totalCollections,
      icon: Folder,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
    },
    {
      label: "Favorite Items",
      value: favoriteItems,
      icon: Star,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
    },
    {
      label: "Favorite Collections",
      value: favoriteCollections,
      icon: BookmarkCheck,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="flex items-center justify-between rounded-xl border border-border bg-card/60 p-4.5 backdrop-blur transition-colors hover:border-border/80"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {stat.label}
              </p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                {stat.value}
              </p>
            </div>
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-lg ${stat.bgColor} ${stat.color} shrink-0`}
            >
              <Icon className="h-5 w-5" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
