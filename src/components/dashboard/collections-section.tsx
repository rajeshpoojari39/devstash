import Link from "next/link";
import { Folder } from "lucide-react";
import { DashboardCollection } from "@/lib/db/collections";
import { CollectionCard } from "./collection-card";

interface CollectionsSectionProps {
  collections?: DashboardCollection[];
}

export function CollectionsSection({ collections = [] }: CollectionsSectionProps) {
  return (
    <section className="space-y-3.5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Collections
        </h2>
        <Link
          href="/collections"
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          View all
        </Link>
      </div>

      {collections.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 px-4 text-center">
          <Folder className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <h3 className="text-sm font-medium text-foreground">No collections yet</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Create your first collection to organize snippets, prompts, commands, and links.
          </p>
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
    </section>
  );
}
