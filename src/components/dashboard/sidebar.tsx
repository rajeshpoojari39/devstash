"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type {
  SidebarItemType,
  SidebarCollection,
  SidebarUser,
} from "@/lib/db/items";
import { useSidebar } from "./sidebar-context";
import { SidebarContent } from "./sidebar-content";

interface SidebarProps {
  itemTypes?: SidebarItemType[];
  collections?: SidebarCollection[];
  user?: SidebarUser | null;
}

export function Sidebar({
  itemTypes = [],
  collections = [],
  user,
}: SidebarProps) {
  const { isCollapsed } = useSidebar();

  return (
    <aside
      className={cn(
        "relative hidden h-full shrink-0 flex-col border-r border-border bg-background transition-[width] duration-300 ease-in-out md:flex z-10",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="h-full w-full flex flex-col overflow-hidden">
        <SidebarContent
          itemTypes={itemTypes}
          collections={collections}
          user={user}
        />
      </div>
    </aside>
  );
}
