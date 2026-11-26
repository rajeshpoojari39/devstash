import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight, Folder, Inbox, Star } from "lucide-react";
import {
  getAuthenticatedUserId,
  requireAuthenticatedUserId,
} from "@/lib/auth";
import { getCollectionById } from "@/lib/db/collections";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ItemCard } from "@/components/dashboard/item-card";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface CollectionDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: CollectionDetailPageProps) {
  const { id } = await params;
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return {
      title: "Collection | DevStash",
    };
  }

  const collection = await getCollectionById(id, userId);

  if (!collection) {
    return {
      title: "Collection Not Found | DevStash",
    };
  }

  return {
    title: `${collection.name} | DevStash`,
    description:
      collection.description ||
      `Browse items inside the ${collection.name} collection.`,
  };
}

export default async function CollectionDetailPage({
  params,
}: CollectionDetailPageProps) {
  const { id } = await params;
  const targetUserId = await requireAuthenticatedUserId(`/collections/${id}`);

  const collection = await getCollectionById(id, targetUserId);

  if (!collection) {
    notFound();
  }

  const iconAccentClasses: Record<string, string> = {
    blue: "text-blue-500 border-blue-500/30",
    purple: "text-purple-500 border-purple-500/30",
    orange: "text-orange-500 border-orange-500/30",
    yellow: "text-amber-400 border-amber-500/30",
    emerald: "text-emerald-500 border-emerald-500/30",
    pink: "text-pink-500 border-pink-500/30",
    neutral: "text-amber-400 border-border/80",
  };

  const iconBoxClass =
    iconAccentClasses[collection.accentColor] || iconAccentClasses.neutral;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header Section */}
      <div className="space-y-4">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <Link
            href="/dashboard"
            className="hover:text-foreground transition-colors"
          >
            Dashboard
          </Link>
          <ChevronRight className="h-3.5 w-3.5 opacity-50 shrink-0" />
          <Link
            href="/collections"
            className="hover:text-foreground transition-colors"
          >
            Collections
          </Link>
          <ChevronRight className="h-3.5 w-3.5 opacity-50 shrink-0" />
          <span className="text-foreground font-medium truncate">
            {collection.name}
          </span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/60">
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border bg-muted/40 shadow-xs",
                iconBoxClass,
              )}
            >
              <Folder className="h-6 w-6" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {collection.name}
                </h1>
                {collection.isFavorite && (
                  <Star
                    className="h-5 w-5 fill-amber-400 text-amber-400 shrink-0"
                    aria-label="Favorite collection"
                  />
                )}
                <Badge
                  variant="outline"
                  className="h-5 px-2 text-xs font-mono text-muted-foreground border-border/80"
                >
                  {collection.itemCount}{" "}
                  {collection.itemCount === 1 ? "item" : "items"}
                </Badge>
              </div>

              {collection.description ? (
                <p className="text-sm text-muted-foreground mt-1">
                  {collection.description}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">
                  Items assigned to this collection
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Items Grid or Empty State */}
      {collection.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/30 p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border/60 bg-muted/40 text-muted-foreground shadow-xs mb-4">
            <Inbox className="h-8 w-8 opacity-80" />
          </div>

          <h2 className="text-lg font-semibold text-foreground">
            No items in this collection yet
          </h2>

          <p className="text-sm text-muted-foreground mt-1.5 max-w-sm">
            Create a new item or edit an existing item to assign it to{" "}
            <span className="text-foreground font-medium">
              {collection.name}
            </span>
            .
          </p>

          <div className="mt-6 flex items-center gap-3">
            <Link
              href="/collections"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "flex items-center gap-2",
              )}
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Collections</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collection.items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
