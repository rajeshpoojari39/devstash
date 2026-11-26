import Link from "next/link";
import { ArrowLeft, ChevronRight, Folder } from "lucide-react";
import { requireAuthenticatedUserId } from "@/lib/auth";
import { getAllCollections } from "@/lib/db/collections";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { CollectionCard } from "@/components/dashboard/collection-card";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Collections | DevStash",
  description: "Browse and organize your developer resource collections.",
};

export default async function CollectionsPage() {
  const targetUserId = await requireAuthenticatedUserId("/collections");
  const collections = await getAllCollections(targetUserId);

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
          <span className="text-foreground font-medium">Collections</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/60">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-muted/40 text-amber-400 shadow-xs">
              <Folder className="h-6 w-6" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  Collections
                </h1>
                <Badge
                  variant="outline"
                  className="h-5 px-2 text-xs font-mono text-muted-foreground border-border/80"
                >
                  {collections.length}{" "}
                  {collections.length === 1 ? "collection" : "collections"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Group and organize your snippets, prompts, commands, notes, and
                resources
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Collections Grid or Empty State */}
      {collections.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/30 p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border/60 bg-muted/40 text-amber-400 shadow-xs mb-4">
            <Folder className="h-8 w-8 opacity-80" />
          </div>

          <h2 className="text-lg font-semibold text-foreground">
            No collections yet
          </h2>

          <p className="text-sm text-muted-foreground mt-1.5 max-w-sm">
            Use the &ldquo;New Collection&rdquo; button in the top bar to create
            your first collection and organize your items.
          </p>

          <div className="mt-6 flex items-center gap-3">
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "flex items-center gap-2",
              )}
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((collection) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              accentColor={collection.accentColor}
              typeIcons={collection.typeIcons}
            />
          ))}
        </div>
      )}
    </div>
  );
}
