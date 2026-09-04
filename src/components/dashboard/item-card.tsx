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
  Pin,
  Star,
  Copy,
  Check,
  MoreHorizontal,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DashboardItem } from "@/lib/db/items";

export type Item = DashboardItem;

interface ItemCardProps {
  item: DashboardItem;
}

const typeIconMap: Record<string, React.ElementType> = {
  snippet: Code,
  code: Code,
  prompt: Sparkles,
  sparkles: Sparkles,
  command: Terminal,
  terminal: Terminal,
  note: StickyNote,
  stickynote: StickyNote,
  file: File,
  image: ImageIcon,
  link: LinkIcon,
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function ItemCard({ item }: ItemCardProps) {
  const [copied, setCopied] = React.useState(false);

  const itemType = item.itemType || {
    name: "snippet",
    icon: "Code",
    color: "#3b82f6",
  };

  const iconKey = (itemType.icon || itemType.name || "code").toLowerCase();
  const Icon =
    typeIconMap[iconKey] || typeIconMap[itemType.name.toLowerCase()] || Code;

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const textToCopy = item.content || item.url || item.title;
    if (
      !textToCopy ||
      typeof navigator === "undefined" ||
      !navigator.clipboard
    ) {
      return;
    }
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text to clipboard:", err);
    }
  };

  return (
    <div className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-border/80 bg-card/60 p-4 backdrop-blur transition-all duration-200 hover:border-border hover:bg-card/90">
      {/* Left side: Type Icon + Title, Description, Tags */}
      <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
        {/* Type Icon Container */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-muted/40"
          style={{ color: itemType.color }}
        >
          <Icon className="h-5 w-5" />
        </div>

        {/* Info Area */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/items/${item.id}`}
              className="font-medium text-sm sm:text-base text-foreground hover:text-primary transition-colors line-clamp-1"
            >
              {item.title}
            </Link>

            {item.isPinned && (
              <Pin className="h-3.5 w-3.5 text-muted-foreground rotate-45 shrink-0" />
            )}

            {item.isFavorite && (
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />
            )}
          </div>

          {item.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {item.description}
            </p>
          )}

          {/* Tags */}
          {item.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-md bg-muted/80 px-2 py-0.5 text-[11px] font-normal text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
              {item.language && (
                <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-mono text-primary/80">
                  {item.language}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right side: Date and Quick Actions */}
      <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
        <span className="text-xs text-muted-foreground font-mono">
          {formatDate(item.createdAt)}
        </span>

        {/* Copy Button */}
        {(item.content || item.url) && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground opacity-80 group-hover:opacity-100 transition-opacity cursor-pointer"
            onClick={handleCopy}
            title={copied ? "Copied!" : "Copy content"}
            aria-label="Copy item content"
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        )}

        {/* Action Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Item actions"
              />
            }
          >
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem>
              <Link
                href={`/items/${item.id}`}
                className="flex w-full items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                <span>View</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleCopy}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              <span>Copy</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              className="flex items-center gap-2 text-destructive"
            >
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
