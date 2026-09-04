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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type {
  SidebarItemType,
  SidebarCollection,
  SidebarUser,
} from "@/lib/db/items";
import { useSidebar } from "./sidebar-context";

interface SidebarContentProps {
  itemTypes?: SidebarItemType[];
  collections?: SidebarCollection[];
  user?: SidebarUser | null;
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

export function SidebarContent({
  itemTypes = [],
  collections = [],
  user,
  onNavigate,
  isMobileDrawer = false,
}: SidebarContentProps) {
  const pathname = usePathname();
  const { isCollapsed } = useSidebar();
  const [typesExpanded, setTypesExpanded] = React.useState(true);
  const [collectionsExpanded, setCollectionsExpanded] = React.useState(true);

  // In mobile drawer, always render full expanded view
  const collapsed = isMobileDrawer ? false : isCollapsed;

  const favoriteCollections = collections.filter((c) => c.isFavorite);
  const recentCollections = collections.filter((c) => !c.isFavorite);

  const userName = user?.name || "Demo User";
  const userEmail = user?.email || "demo@devstash.io";
  const initials =
    userName
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "U";

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
                {itemTypes.map((itemType) => {
                  const href = `/items/${itemType.name.toLowerCase()}`;
                  const isActive =
                    pathname === href || pathname.startsWith(`${href}/`);
                  const Icon = typeIconMap[itemType.icon] || Code;
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
                                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                            )}
                          >
                            <Icon
                              className="h-4 w-4 shrink-0"
                              style={{ color: itemType.color }}
                            />
                          </Link>
                        }
                      />
                      <TooltipContent side="right">
                        <div className="flex items-center gap-1.5">
                          <span>{title}</span>
                          {isProType(itemType.name) && (
                            <Badge
                              variant="secondary"
                              className="h-3.5 px-1 text-[9px] font-semibold tracking-wider text-muted-foreground uppercase border border-border/40"
                            >
                              PRO
                            </Badge>
                          )}
                          <span className="font-mono text-muted-foreground">
                            ({itemType.count})
                          </span>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>

              <div className="h-px w-8 bg-border shrink-0" />

              {/* Collections Icons */}
              <div className="flex flex-col items-center gap-1 w-full">
                {collections.map((col) => {
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
                                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                            )}
                          >
                            {col.isFavorite ? (
                              <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" />
                            ) : (
                              <span
                                className="h-2.5 w-2.5 rounded-full ring-1 ring-background"
                                style={{ backgroundColor: col.dominantColor }}
                              />
                            )}
                          </Link>
                        }
                      />
                      <TooltipContent side="right">
                        <span>{col.name}</span>
                        <span className="ml-1.5 font-mono text-muted-foreground">
                          ({col.itemCount})
                        </span>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}

                {/* View all collections icon button */}
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Link
                        href="/collections"
                        onClick={onNavigate}
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-lg transition-colors mt-1",
                          pathname === "/collections"
                            ? "bg-accent text-foreground font-medium shadow-xs"
                            : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                        )}
                      >
                        <Folder className="h-4 w-4 opacity-50" />
                      </Link>
                    }
                  />
                  <TooltipContent side="right">
                    <span>View all collections</span>
                  </TooltipContent>
                </Tooltip>
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
                    {itemTypes.map((itemType) => {
                      const href = `/items/${itemType.name.toLowerCase()}`;
                      const isActive =
                        pathname === href || pathname.startsWith(`${href}/`);
                      const Icon = typeIconMap[itemType.icon] || Code;
                      const title = getItemTypeTitle(itemType.name);

                      return (
                        <Link
                          key={itemType.id}
                          href={href}
                          onClick={onNavigate}
                          className={cn(
                            "group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm font-normal transition-colors",
                            isActive
                              ? "bg-accent text-foreground font-medium"
                              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon
                              className="h-4 w-4 shrink-0"
                              style={{ color: itemType.color }}
                            />
                            <span className="truncate">{title}</span>
                            {isProType(itemType.name) && (
                              <Badge
                                variant="secondary"
                                className="h-4 px-1.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase border border-border/40"
                              >
                                PRO
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground/70 font-mono">
                            {itemType.count}
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
                                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                                )}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
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

                    {/* Recent / Other Collections Subgroup */}
                    {recentCollections.length > 0 && (
                      <div className="space-y-1">
                        <div className="px-2.5 text-[10px] font-semibold tracking-wider text-muted-foreground/60 uppercase">
                          Recents
                        </div>
                        <nav
                          className="space-y-0.5"
                          aria-label="Recent collections"
                        >
                          {recentCollections.map((col) => {
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
                                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                                )}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="flex h-3.5 w-3.5 items-center justify-center shrink-0">
                                    <span
                                      className="h-2 w-2 rounded-full ring-1 ring-background"
                                      style={{
                                        backgroundColor: col.dominantColor,
                                      }}
                                      title={
                                        col.dominantTypeName
                                          ? `Most used: ${col.dominantTypeName}`
                                          : undefined
                                      }
                                    />
                                  </div>
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

                    {/* View All Collections Link */}
                    <div className="pt-1">
                      <Link
                        href="/collections"
                        onClick={onNavigate}
                        className={cn(
                          "flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                          pathname === "/collections"
                            ? "bg-accent text-foreground font-semibold"
                            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                        )}
                      >
                        <span>View all collections</span>
                        <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </ScrollArea>

        {/* User Profile Footer */}
        <div className="mt-auto border-t border-border p-2 shrink-0">
          {collapsed ? (
            <div className="flex flex-col items-center gap-2 py-1">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <div className="flex items-center justify-center cursor-pointer">
                      <Avatar
                        size="sm"
                        className="bg-neutral-100 dark:bg-neutral-800"
                      >
                        <AvatarImage src={user?.image || ""} alt={userName} />
                        <AvatarFallback className="bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200 text-[10px] font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  }
                />
                <TooltipContent side="right">
                  <p className="font-medium">{userName}</p>
                  <p className="text-xs text-muted-foreground">{userEmail}</p>
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
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  }
                />
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
                  <AvatarImage src={user?.image || ""} alt={userName} />
                  <AvatarFallback className="bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200 text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground leading-snug">
                    {userName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {userEmail}
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
