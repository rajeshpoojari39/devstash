"use client";

import * as React from "react";
import {
  Check,
  ChevronDown,
  Folder as FolderIcon,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface CollectionOption {
  id: string;
  name: string;
  itemCount?: number;
  accentColor?: string;
}

export interface CollectionSelectorProps {
  id?: string;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  initialCollections?: CollectionOption[];
  disabled?: boolean;
}

const ACCENT_DOT_COLORS: Record<string, string> = {
  blue: "bg-blue-500",
  purple: "bg-purple-500",
  orange: "bg-orange-500",
  yellow: "bg-yellow-400",
  emerald: "bg-emerald-500",
  pink: "bg-pink-500",
  neutral: "bg-muted-foreground",
};

export function CollectionSelector({
  id,
  selectedIds,
  onChange,
  initialCollections = [],
  disabled = false,
}: CollectionSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [fetchedCollections, setFetchedCollections] = React.useState<
    CollectionOption[]
  >([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const fetchCollectionsList = React.useCallback(
    async (signal?: AbortSignal): Promise<CollectionOption[]> => {
      const response = await fetch("/api/collections?limit=50", { signal });
      if (!response.ok) {
        const errData = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(errData?.error || "Failed to load collections");
      }
      const data = (await response.json()) as {
        collections?: CollectionOption[];
      };
      return Array.isArray(data.collections) ? data.collections : [];
    },
    [],
  );

  React.useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    fetchCollectionsList(controller.signal)
      .then((collections) => {
        if (!ignore) {
          setFetchedCollections(collections);
          setFetchError(null);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        if (!ignore) {
          setFetchError(
            err instanceof Error ? err.message : "Failed to load collections",
          );
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [fetchCollectionsList]);

  const handleRetry = () => {
    setIsLoading(true);
    setFetchError(null);
    fetchCollectionsList()
      .then((collections) => {
        setFetchedCollections(collections);
      })
      .catch((err: unknown) => {
        setFetchError(
          err instanceof Error ? err.message : "Failed to load collections",
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  React.useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Merge fetched collections with any pre-existing item collections so nothing disappears
  const allCollections = React.useMemo(() => {
    const map = new Map<string, CollectionOption>();
    for (const col of fetchedCollections) {
      map.set(col.id, col);
    }
    for (const col of initialCollections) {
      if (!map.has(col.id)) {
        map.set(col.id, col);
      }
    }
    return Array.from(map.values());
  }, [fetchedCollections, initialCollections]);

  const selectedCollections = React.useMemo(() => {
    const lookup = new Map(allCollections.map((col) => [col.id, col]));
    return selectedIds
      .map((colId) => lookup.get(colId))
      .filter((col): col is CollectionOption => Boolean(col));
  }, [allCollections, selectedIds]);

  const filteredCollections = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return allCollections;
    return allCollections.filter((col) =>
      col.name.toLowerCase().includes(query),
    );
  }, [allCollections, searchQuery]);

  const toggleCollection = (collectionId: string) => {
    if (disabled) return;
    if (selectedIds.includes(collectionId)) {
      onChange(selectedIds.filter((existingId) => existingId !== collectionId));
    } else {
      onChange([...selectedIds, collectionId]);
    }
  };

  const removeCollection = (collectionId: string) => {
    if (disabled) return;
    onChange(selectedIds.filter((existingId) => existingId !== collectionId));
  };

  return (
    <div ref={containerRef} className="space-y-2">
      {/* Selected Collection Chips */}
      {selectedCollections.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedCollections.map((col) => {
            const dotClass =
              ACCENT_DOT_COLORS[col.accentColor || "neutral"] ||
              ACCENT_DOT_COLORS.neutral;

            return (
              <span
                key={col.id}
                className="inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-muted/60 px-2 py-1 text-xs font-medium text-foreground"
              >
                <span
                  className={cn("h-1.5 w-1.5 rounded-full shrink-0", dotClass)}
                  aria-hidden="true"
                />
                <span className="truncate max-w-[180px]">{col.name}</span>
                <button
                  type="button"
                  onClick={() => removeCollection(col.id)}
                  disabled={disabled}
                  aria-label={`Remove ${col.name}`}
                  className="ml-0.5 rounded-sm p-0.5 text-muted-foreground hover:bg-background/60 hover:text-foreground transition-colors cursor-pointer disabled:pointer-events-none disabled:opacity-50"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-xs sm:text-sm shadow-xs transition-colors",
          "hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
          isOpen && "border-ring ring-1 ring-ring/40",
        )}
      >
        <span className="flex items-center gap-2 text-muted-foreground truncate">
          <FolderIcon className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">
            {selectedIds.length === 0
              ? "Select collections..."
              : `${selectedIds.length} ${selectedIds.length === 1 ? "collection" : "collections"} selected`}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {/* Inline Expandable Selection Panel */}
      {isOpen && (
        <div
          role="listbox"
          aria-multiselectable="true"
          className="rounded-lg border border-border bg-popover text-popover-foreground shadow-md overflow-hidden"
        >
          {allCollections.length > 5 && (
            <div className="flex items-center gap-2 border-b border-border/70 px-2.5 py-2">
              <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter collections..."
                aria-label="Filter collections"
                className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-5 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Loading collections...</span>
            </div>
          ) : fetchError ? (
            <div className="flex flex-col items-center gap-2 py-4 px-3 text-center">
              <p className="text-xs text-destructive">{fetchError}</p>
              <button
                type="button"
                onClick={handleRetry}
                className="text-xs font-medium text-primary hover:underline cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : allCollections.length === 0 ? (
            <div className="py-4 px-3 text-center text-xs text-muted-foreground">
              No collections yet. Create one from the top bar using{" "}
              <span className="font-medium text-foreground">New Collection</span>.
            </div>
          ) : filteredCollections.length === 0 ? (
            <div className="py-4 px-3 text-center text-xs text-muted-foreground">
              No matching collections found.
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto p-1 space-y-0.5">
              {filteredCollections.map((col) => {
                const isSelected = selectedIds.includes(col.id);
                const dotClass =
                  ACCENT_DOT_COLORS[col.accentColor || "neutral"] ||
                  ACCENT_DOT_COLORS.neutral;

                return (
                  <button
                    key={col.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => toggleCollection(col.id)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-xs transition-colors cursor-pointer",
                      isSelected
                        ? "bg-accent/80 text-accent-foreground font-medium"
                        : "text-foreground hover:bg-muted/60",
                    )}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/40 bg-transparent",
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </span>
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full shrink-0",
                          dotClass,
                        )}
                        aria-hidden="true"
                      />
                      <span className="truncate">{col.name}</span>
                    </span>
                    {typeof col.itemCount === "number" && (
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {col.itemCount}{" "}
                        {col.itemCount === 1 ? "item" : "items"}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
