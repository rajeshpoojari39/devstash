"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image as ImageIcon,
  Link as LinkIcon,
  Folder,
  Star,
  ChevronDown,
  ChevronRight,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DevStashLogo } from "@/components/brand/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  mockUser,
  mockItemTypes,
  mockCollections,
  mockItemTypeCounts,
} from "@/lib/mock-data";
import { useSidebar } from "./sidebar-context";

interface SidebarContentProps {
  onNavigate?: () => void;
  isMobileDrawer?: boolean;
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

function getItemTypeSlug(name: string): string {
  const map: Record<string, string> = {
    snippet: "snippets",
    prompt: "prompts",
    command: "commands",
    note: "notes",
    file: "files",
    image: "images",
    link: "links",
  };
  return map[name.toLowerCase()] || `${name.toLowerCase()}s`;
}

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

export function SidebarContent({
  onNavigate,
  isMobileDrawer = false,
}: SidebarContentProps) {
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();
  const [typesExpanded, setTypesExpanded] = React.useState(true);
  const [collectionsExpanded, setCollectionsExpanded] = React.useState(true);

  // In mobile drawer, always render full expanded view
  const collapsed = isMobileDrawer ? false : isCollapsed;

  const favoriteCollections = mockCollections.filter((c) => c.isFavorite);
  const otherCollections = mockCollections.filter((c) => !c.isFavorite);

  const initials = mockUser.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <TooltipProvider delay={100}>
      <div className="flex h-full w-full flex-col text-foreground select-none overflow-hidden">
        {/* Brand Header for Mobile Drawer */}
        {isMobileDrawer && (
          <div className="flex h-14 shrink-0 items-center px-4 border-b border-border">
            <Link
              href="/dashboard"
              onClick={onNavigate}
              className="flex items-center gap-2 transition-opacity hover:opacity-90"
            >
              <DevStashLogo size="md" showText={true} />
            </Link>
          </div>
        )}

        {/* Main Navigation Scrollable Area */}
        <ScrollArea className="flex-1 px-2 py-3">
          {collapsed ? (
            /* Collapsed (Icon-Only) Mode */
            <div className="flex flex-col items-center gap-4">
              {/* Types Icons */}
              <div className="flex flex-col items-center gap-1 w-full">
                {mockItemTypes.map((itemType) => {
                  const slug = getItemTypeSlug(itemType.name);
                  const href = `/items/${slug}`;
                  const isActive = pathname === href;
                  const Icon = typeIconMap[itemType.icon] || Code;
                  const count =
                    mockItemTypeCounts[
                      itemType.name as keyof typeof mockItemTypeCounts
                    ] ?? 0;
                  const title = getItemTypeTitle(itemType.name);

                  return (
                    <Tooltip key={itemType.id}>
                      <TooltipTrigger
                        render={
                          <Link
                            href={href}
                            onClick={onNavigate}
                            className={cn(
                              "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                              isActive
                                ? "bg-accent text-foreground font-medium shadow-xs"
                                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                            )}
                          />
                        }
                      >
                        <Icon
                          className="h-4 w-4 shrink-0"
                          style={{ color: itemType.color }}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <span>{title}</span>
                        <span className="ml-1.5 font-mono text-muted-foreground">
                          ({count})
                        </span>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>

              <div className="h-px w-8 bg-border shrink-0" />

              {/* Collections Icons */}
              <div className="flex flex-col items-center gap-1 w-full">
                {mockCollections.map((col) => {
                  const href = `/collections/${col.id}`;
                  const isActive = pathname === href;

                  return (
                    <Tooltip key={col.id}>
                      <TooltipTrigger
                        render={
                          <Link
                            href={href}
                            onClick={onNavigate}
                            className={cn(
                              "relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                              isActive
                                ? "bg-accent text-foreground font-medium shadow-xs"
                                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                            )}
                          />
                        }
                      >
                        <Folder className="h-4 w-4 text-muted-foreground" />
                        {col.isFavorite && (
                          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-amber-400 ring-1 ring-background" />
                        )}
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <span>{col.name}</span>
                        <span className="ml-1.5 font-mono text-muted-foreground">
                          ({col.itemCount})
                        </span>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Expanded Full Mode */
            <div className="space-y-6 px-1">
              {/* Types Section */}
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setTypesExpanded((prev) => !prev)}
                  className="flex w-full items-center justify-between px-2 py-1.5 text-xs font-semibold text-muted-foreground/80 hover:text-foreground transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Types</span>
                    {typesExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                  </div>
                </button>

                {typesExpanded && (
                  <nav className="space-y-0.5" aria-label="Item types">
                    {mockItemTypes.map((itemType) => {
                      const slug = getItemTypeSlug(itemType.name);
                      const href = `/items/${slug}`;
                      const isActive = pathname === href;
                      const Icon = typeIconMap[itemType.icon] || Code;
                      const count =
                        mockItemTypeCounts[
                          itemType.name as keyof typeof mockItemTypeCounts
                        ] ?? 0;

                      return (
                        <Link
                          key={itemType.id}
                          href={href}
                          onClick={onNavigate}
                          className={cn(
                            "group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm font-normal transition-colors",
                            isActive
                              ? "bg-accent text-foreground font-medium"
                              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon
                              className="h-4 w-4 shrink-0"
                              style={{ color: itemType.color }}
                            />
                            <span className="truncate">
                              {getItemTypeTitle(itemType.name)}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground/70 font-mono">
                            {count}
                          </span>
                        </Link>
                      );
                    })}
                  </nav>
                )}
              </div>

              {/* Collections Section */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setCollectionsExpanded((prev) => !prev)}
                  className="flex w-full items-center justify-between px-2 py-1.5 text-xs font-semibold text-muted-foreground/80 hover:text-foreground transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Collections</span>
                    {collectionsExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                  </div>
                </button>

                {collectionsExpanded && (
                  <div className="space-y-4">
                    {/* Favorites Subgroup */}
                    {favoriteCollections.length > 0 && (
                      <div className="space-y-1">
                        <div className="px-2.5 text-[10px] font-semibold tracking-wider text-muted-foreground/60 uppercase">
                          Favorites
                        </div>
                        <nav
                          className="space-y-0.5"
                          aria-label="Favorite collections"
                        >
                          {favoriteCollections.map((col) => {
                            const href = `/collections/${col.id}`;
                            const isActive = pathname === href;

                            return (
                              <Link
                                key={col.id}
                                href={href}
                                onClick={onNavigate}
                                className={cn(
                                  "group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm font-normal transition-colors",
                                  isActive
                                    ? "bg-accent text-foreground font-medium"
                                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                                )}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
                                  <span className="truncate">{col.name}</span>
                                </div>
                                <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
                              </Link>
                            );
                          })}
                        </nav>
                      </div>
                    )}

                    {/* All Collections Subgroup */}
                    {otherCollections.length > 0 && (
                      <div className="space-y-1">
                        <div className="px-2.5 text-[10px] font-semibold tracking-wider text-muted-foreground/60 uppercase">
                          All Collections
                        </div>
                        <nav
                          className="space-y-0.5"
                          aria-label="All collections"
                        >
                          {otherCollections.map((col) => {
                            const href = `/collections/${col.id}`;
                            const isActive = pathname === href;

                            return (
                              <Link
                                key={col.id}
                                href={href}
                                onClick={onNavigate}
                                className={cn(
                                  "group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm font-normal transition-colors",
                                  isActive
                                    ? "bg-accent text-foreground font-medium"
                                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                                )}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
                                  <span className="truncate">{col.name}</span>
                                </div>
                                <span className="text-xs text-muted-foreground/70 font-mono">
                                  {col.itemCount}
                                </span>
                              </Link>
                            );
                          })}
                        </nav>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </ScrollArea>

        {/* User Profile Footer */}
        <div className="mt-auto border-t border-border p-2">
          {collapsed ? (
            <div className="flex flex-col items-center gap-2 py-1">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <div className="cursor-pointer">
                      <Avatar
                        size="sm"
                        className="bg-neutral-100 dark:bg-neutral-800"
                      />
                    </div>
                  }
                >
                  <AvatarImage src="" alt={mockUser.name} />
                  <AvatarFallback className="bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200 text-[10px] font-semibold">
                    {initials}
                  </AvatarFallback>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p className="font-medium">{mockUser.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {mockUser.email}
                  </p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                      aria-label="User settings"
                    />
                  }
                >
                  <Settings className="h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent side="right">Settings</TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 rounded-lg p-1.5">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar
                  size="default"
                  className="bg-neutral-100 dark:bg-neutral-800"
                >
                  <AvatarImage src="" alt={mockUser.name} />
                  <AvatarFallback className="bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200 text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground leading-snug">
                    {mockUser.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {mockUser.email}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="User settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
