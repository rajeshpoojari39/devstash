"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import type {
  SidebarItemType,
  SidebarCollection,
  SidebarUser,
} from "@/lib/db/items";
import { useSidebar } from "./sidebar-context";
import { SidebarContent } from "./sidebar-content";

interface MobileSidebarProps {
  itemTypes?: SidebarItemType[];
  collections?: SidebarCollection[];
  user?: SidebarUser | null;
}

export function MobileSidebar({
  itemTypes = [],
  collections = [],
  user,
}: MobileSidebarProps) {
  const { isMobileOpen, setIsMobileOpen } = useSidebar();

  return (
    <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
      <SheetContent
        side="left"
        className="w-72 p-0 border-r border-border bg-background flex flex-col h-full md:hidden"
        showCloseButton={true}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation Menu</SheetTitle>
          <SheetDescription>
            DevStash sidebar navigation for item types and collections
          </SheetDescription>
        </SheetHeader>
        <SidebarContent
          itemTypes={itemTypes}
          collections={collections}
          user={user}
          isMobileDrawer={true}
          onNavigate={() => setIsMobileOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
