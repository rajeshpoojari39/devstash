import Link from "next/link";
import { mockCollections } from "@/lib/mock-data";
import { CollectionCard } from "./collection-card";

// Collection metadata customization mapping
const collectionMetaMap: Record<
  string,
  {
    accentColor: "blue" | "purple" | "yellow" | "orange" | "neutral";
    typeIcons: (
      | "code"
      | "folder"
      | "link"
      | "sparkles"
      | "terminal"
      | "file"
      | "note"
    )[];
  }
> = {
  coll_1: {
    accentColor: "blue",
    typeIcons: ["code", "folder", "link"],
  },
  coll_2: {
    accentColor: "blue",
    typeIcons: ["code", "folder"],
  },
  coll_3: {
    accentColor: "neutral",
    typeIcons: ["file", "folder"],
  },
  coll_4: {
    accentColor: "yellow",
    typeIcons: ["folder", "code", "link", "sparkles"],
  },
  coll_5: {
    accentColor: "orange",
    typeIcons: ["terminal", "folder"],
  },
  coll_6: {
    accentColor: "purple",
    typeIcons: ["sparkles", "code", "folder"],
  },
};

export function CollectionsSection() {
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockCollections.map((collection) => {
          const meta = collectionMetaMap[collection.id] || {
            accentColor: "neutral",
            typeIcons: ["folder", "code"],
          };
          return (
            <CollectionCard
              key={collection.id}
              collection={collection}
              accentColor={meta.accentColor}
              typeIcons={meta.typeIcons}
            />
          );
        })}
      </div>
    </section>
  );
}
