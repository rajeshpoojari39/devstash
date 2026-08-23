"use client";

import Link from "next/link";
import { PanelLeft, Search, Plus, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DevStashLogo } from "@/components/brand/logo";
import { useSidebar } from "./sidebar-context";

export function TopBar() {
  const { toggleSidebar, toggleMobileOpen } = useSidebar();

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Left side: Logo, Toggle, and Search */}
      <div className="flex h-full items-center min-w-0 flex-1">
        {/* Desktop: Logo container with exact w-64 width matching sidebar */}
        <div className="hidden md:flex h-full w-64 items-center px-5 border-r border-border shrink-0">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 transition-opacity hover:opacity-90"
          >
            <DevStashLogo size="md" showText={true} />
          </Link>
        </div>

        {/* Desktop: Toggle button container with right border */}
        <div className="hidden md:flex h-full w-14 items-center justify-center border-r border-border shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Mobile: Toggle button & Logo with full text */}
        <div className="flex md:hidden items-center gap-2 px-3 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
            onClick={toggleMobileOpen}
            aria-label="Open navigation menu"
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 transition-opacity hover:opacity-90 shrink-0"
          >
            <DevStashLogo size="sm" showText={true} />
          </Link>
        </div>

        {/* Search Input Container */}
        <div className="flex items-center px-2 sm:px-4 min-w-0 flex-1 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
          <div className="relative w-full">
            <Search className="absolute left-2.5 sm:left-3 top-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 -translate-y-1/2 text-muted-foreground/70" />
            <Input
              type="search"
              placeholder="Search items..."
              className="h-8 sm:h-9 w-full rounded-md border border-border/80 bg-muted/30 pl-8 sm:pl-9 pr-8 sm:pr-12 text-xs sm:text-sm placeholder:text-muted-foreground/60 focus-visible:bg-background/80 focus-visible:border-ring focus-visible:ring-1"
              readOnly
            />
            <div className="pointer-events-none absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 hidden sm:block">
              <kbd className="inline-flex h-5 select-none items-center gap-0.5 rounded border border-border/70 bg-muted/60 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Action buttons */}
      <div className="flex items-center gap-1.5 sm:gap-2 pr-3 sm:pr-4 md:pr-6 shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:inline-flex h-9 gap-1.5 rounded-md border-border/80 bg-background text-sm font-normal text-foreground hover:bg-muted"
        >
          <FolderPlus className="h-4 w-4" />
          <span>New Collection</span>
        </Button>
        <Button
          variant="default"
          size="sm"
          className="h-8 sm:h-9 gap-1 sm:gap-1.5 rounded-md bg-white text-black px-2.5 sm:px-3 text-xs sm:text-sm font-medium hover:bg-neutral-200 shrink-0"
        >
          <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden xs:inline">New Item</span>
          <span className="xs:hidden">New</span>
        </Button>
      </div>
    </header>
  );
}
