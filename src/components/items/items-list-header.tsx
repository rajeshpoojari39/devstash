"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, Code } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  formatItemTypeTitle,
  getItemTypeDescription,
  isProType,
  itemTypeIconMap,
  type ItemTypeInfo,
} from "@/lib/item-utils";

interface ItemsListHeaderProps {
  itemType: ItemTypeInfo;
  count: number;
}

export function ItemsListHeader({ itemType, count }: ItemsListHeaderProps) {
  const title = formatItemTypeTitle(itemType.name);
  const description = getItemTypeDescription(itemType.name);
  const isPro = isProType(itemType.name);

  const iconKey = (itemType.icon || itemType.name || "code").toLowerCase();
  const Icon =
    itemTypeIconMap[itemType.icon] ||
    itemTypeIconMap[iconKey] ||
    itemTypeIconMap[itemType.name.toLowerCase()] ||
    Code;

  return (
    <div className="space-y-4">
      {/* Breadcrumb Navigation */}
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
        <span className="text-foreground font-medium">{title}</span>
      </nav>

      {/* Main Header Container */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/60">
        <div className="flex items-center gap-3.5 min-w-0">
          {/* Item Type Icon Container */}
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-muted/40 shadow-xs"
            style={{ color: itemType.color }}
          >
            <Icon className="h-6 w-6" />
          </div>

          {/* Title & Metadata */}
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {title}
              </h1>

              {isPro && (
                <Badge
                  variant="secondary"
                  className="h-5 px-1.5 text-[10px] font-bold tracking-wider text-muted-foreground uppercase border border-border/60"
                >
                  PRO
                </Badge>
              )}

              <Badge
                variant="outline"
                className="h-5 px-2 text-xs font-mono text-muted-foreground border-border/80"
              >
                {count} {count === 1 ? "item" : "items"}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground mt-1 line-clamp-1 sm:line-clamp-none">
              {description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
