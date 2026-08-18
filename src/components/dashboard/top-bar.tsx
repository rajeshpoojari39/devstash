import { PanelLeft, Search, Plus, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TopBarProps {
  onToggleSidebar?: () => void;
}

export function TopBar({ onToggleSidebar }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center">
        {/* Toggle Icon with vertical separation line */}
        <div className="flex h-full w-14 items-center justify-center border-r border-border shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground"
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Search Input Container with generous padding */}
        <div className="flex items-center px-4">
          <div className="relative w-72 md:w-80 lg:w-[380px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
            <Input
              type="search"
              placeholder="Search items..."
              className="h-9 w-full rounded-md border border-border/80 bg-muted/30 pl-9 pr-12 text-sm placeholder:text-muted-foreground/60 focus-visible:bg-background/80 focus-visible:border-ring focus-visible:ring-1"
              readOnly
            />
            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
              <kbd className="inline-flex h-5 select-none items-center gap-0.5 rounded border border-border/70 bg-muted/60 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 pr-4 md:pr-6">
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1.5 rounded-md border-border/80 bg-background text-sm font-normal text-foreground hover:bg-muted"
        >
          <FolderPlus className="h-4 w-4" />
          <span>New Collection</span>
        </Button>
        <Button
          variant="default"
          size="sm"
          className="h-9 gap-1.5 rounded-md bg-white text-black text-sm font-medium hover:bg-neutral-200"
        >
          <Plus className="h-4 w-4" />
          <span>New Item</span>
        </Button>
      </div>
    </header>
  );
}
