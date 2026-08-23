"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-context";
import { SidebarContent } from "./sidebar-content";

export function Sidebar() {
  const { isCollapsed } = useSidebar();

  return (
    <aside
      className={cn(
        "relative hidden min-h-[calc(100vh-3.5rem)] shrink-0 flex-col border-r border-border bg-background transition-[width] duration-300 ease-in-out md:flex z-10",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="h-full w-full flex flex-col overflow-hidden">
        <SidebarContent />
      </div>
    </aside>
  );
}
