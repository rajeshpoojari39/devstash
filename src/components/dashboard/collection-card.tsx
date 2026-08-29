"use client";

import Link from "next/link";
import {
  Star,
  MoreHorizontal,
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image as ImageIcon,
  Link as LinkIcon,
  Folder,
  Eye,
  Edit2,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export interface CollectionItem {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CollectionCardProps {
  collection: CollectionItem;
  accentColor?: string;
  typeIcons?: string[];
}

// Icon mapping helper
function renderTypeIcon(type: string, key: number) {
  switch (type.toLowerCase()) {
    case "snippet":
    case "code":
      return <Code key={key} className="h-4 w-4 text-blue-500 shrink-0" />;
    case "prompt":
    case "sparkles":
      return (
        <Sparkles key={key} className="h-4 w-4 text-purple-500 shrink-0" />
      );
    case "command":
    case "terminal":
      return (
        <Terminal key={key} className="h-4 w-4 text-orange-500 shrink-0" />
      );
    case "note":
    case "stickynote":
      return (
        <StickyNote key={key} className="h-4 w-4 text-yellow-400 shrink-0" />
      );
    case "file":
      return <File key={key} className="h-4 w-4 text-zinc-400 shrink-0" />;
    case "image":
      return <ImageIcon key={key} className="h-4 w-4 text-pink-500 shrink-0" />;
    case "link":
      return (
        <LinkIcon key={key} className="h-4 w-4 text-emerald-500 shrink-0" />
      );
    case "folder":
    default:
      return <Folder key={key} className="h-4 w-4 text-amber-400 shrink-0" />;
  }
}

export function CollectionCard({
  collection,
  accentColor,
  typeIcons = [],
}: CollectionCardProps) {
  const borderClasses: Record<string, string> = {
    blue: "border-blue-500/60 hover:border-blue-500",
    purple: "border-purple-500/60 hover:border-purple-500",
    yellow: "border-amber-500/60 hover:border-amber-500",
    orange: "border-orange-500/60 hover:border-orange-500",
    emerald: "border-emerald-500/60 hover:border-emerald-500",
    pink: "border-pink-500/60 hover:border-pink-500",
    neutral: "border-border hover:border-zinc-500",
  };

  const selectedBorder = accentColor
    ? borderClasses[accentColor] || "border-border"
    : "border-border";

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-xl border ${selectedBorder} bg-card/60 p-4.5 backdrop-blur transition-all duration-200 hover:shadow-md`}
    >
      <div>
        {/* Header: Title, Favorite Star, and 3-dots Menu */}
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/collections/${collection.id}`}
            className="flex items-center gap-1.5 group/title"
          >
            <h3 className="font-semibold text-base text-foreground group-hover/title:text-primary transition-colors line-clamp-1">
              {collection.name}
            </h3>
            {collection.isFavorite && (
              <Star className="h-4 w-4 fill-amber-400 text-amber-400 shrink-0" />
            )}
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground -mr-1 shrink-0 cursor-pointer"
                  aria-label="Collection actions"
                />
              }
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem>
                <Link
                  href={`/collections/${collection.id}`}
                  className="flex w-full items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  <span>View</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2">
                <Edit2 className="h-4 w-4" />
                <span>Edit</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                className="flex items-center gap-2 text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Item count */}
        <p className="text-xs text-muted-foreground mt-0.5">
          {collection.itemCount} items
        </p>

        {/* Description */}
        <p className="text-xs sm:text-sm text-muted-foreground/90 mt-2.5 line-clamp-2 min-h-[2.5rem]">
          {collection.description}
        </p>
      </div>

      {/* Bottom Type Icons */}
      <div className="flex items-center gap-2 pt-3 mt-1">
        {typeIcons.map((t, idx) => renderTypeIcon(t, idx))}
      </div>
    </div>
  );
}
