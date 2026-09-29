"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Inbox } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  formatItemTypeTitle,
  itemTypeIconMap,
  type ItemTypeInfo,
} from "@/lib/item-utils";
import { cn } from "@/lib/utils";

interface ItemsEmptyStateProps {
  itemType: ItemTypeInfo;
}

export function ItemsEmptyState({ itemType }: ItemsEmptyStateProps) {
  const title = formatItemTypeTitle(itemType.name);
  const iconKey = (itemType.icon || itemType.name || "code").toLowerCase();
  const Icon =
    itemTypeIconMap[itemType.icon] ||
    itemTypeIconMap[iconKey] ||
    itemTypeIconMap[itemType.name.toLowerCase()] ||
    Inbox;

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/30 p-12 text-center">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border/60 bg-muted/40 shadow-xs mb-4"
        style={{ color: itemType.color }}
      >
        <Icon className="h-8 w-8 opacity-80" />
      </div>

      <h3 className="text-lg font-semibold text-foreground">
        No {title.toLowerCase()} found
      </h3>

      <p className="text-sm text-muted-foreground mt-1.5 max-w-sm">
        You haven&apos;t saved any {title.toLowerCase()} to your stash yet.
        Items you add under this category will appear here.
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
  );
}
