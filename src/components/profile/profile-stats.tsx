"use client";

import * as React from "react";
import Link from "next/link";
import {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image as ImageIcon,
  Link as LinkIcon,
  Folder,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProfileStats as ProfileStatsType } from "@/lib/db/profile";
import { cn } from "@/lib/utils";

interface ProfileStatsProps {
  stats: ProfileStatsType;
}

const typeIconMap: Record<string, React.ElementType> = {
  Code: Code,
  Sparkles: Sparkles,
  Terminal: Terminal,
  StickyNote: StickyNote,
  File: File,
  Image: ImageIcon,
  Link: LinkIcon,
};

function getItemTypeTitle(name: string): string {
  const map: Record<string, string> = {
    snippet: "Snippets",
    prompt: "Prompts",
    command: "Commands",
    note: "Notes",
    file: "Files",
    image: "Images",
    link: "Links",
  };
  return (
    map[name.toLowerCase()] || name.charAt(0).toUpperCase() + name.slice(1)
  );
}

function isProType(name: string): boolean {
  const lower = name.toLowerCase();
  return (
    lower === "file" ||
    lower === "files" ||
    lower === "image" ||
    lower === "images"
  );
}

export function ProfileStatsSection({ stats }: ProfileStatsProps) {
  return (
    <div className="space-y-6">
      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-border/70 bg-card/80 shadow-sm">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Total Items
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Layers className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-3xl font-bold font-mono text-foreground">
              {stats.totalItems}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Active developer resources saved
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/80 shadow-sm">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">
                Collections
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Folder className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-3xl font-bold font-mono text-foreground">
              {stats.totalCollections}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Organized project folders & categories
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Item Type Breakdown */}
      <Card className="border-border/70 bg-card/80 shadow-sm">
        <CardHeader className="p-4 pb-2 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Item Types Breakdown
              </h3>
              <p className="text-xs text-muted-foreground">
                Distribution of resources by type category
              </p>
            </div>
            <Badge variant="secondary" className="text-xs font-mono">
              {stats.itemTypeBreakdown.length} types
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {stats.itemTypeBreakdown.map((itemType) => {
              const Icon = typeIconMap[itemType.icon] || Code;
              const title = getItemTypeTitle(itemType.name);
              const href = `/items/${itemType.name.toLowerCase()}`;

              return (
                <Link
                  key={itemType.id}
                  href={href}
                  className={cn(
                    "group relative flex flex-col justify-between rounded-xl border border-border/60 bg-muted/20 p-3.5 hover:bg-muted/40 hover:border-border hover:shadow-xs transition-all cursor-pointer",
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/40 bg-background/80 shadow-xs">
                      <Icon
                        className="h-4 w-4"
                        style={{ color: itemType.color }}
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isProType(itemType.name) && (
                        <Badge
                          variant="secondary"
                          className="h-4 px-1.5 text-[9px] font-bold tracking-wider text-muted-foreground uppercase border border-border/40"
                        >
                          PRO
                        </Badge>
                      )}
                      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors block truncate">
                      {title}
                    </span>
                    <span className="text-lg font-bold font-mono text-foreground">
                      {itemType.count}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
