"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Image as ImageIcon,
  Pin,
  Star,
  Copy,
  Check,
  MoreHorizontal,
  ExternalLink,
  Trash2,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteItemDialog } from "@/components/items/delete-item-dialog";
import { deleteItem as deleteItemAction } from "@/actions/items";
import { DashboardItem } from "@/lib/db/items";
import { useItemDrawer } from "@/components/items/item-drawer-context";
import { formatFileSize } from "@/lib/item-utils";

interface ImageThumbnailCardProps {
  item: DashboardItem;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function ImageThumbnailCard({ item }: ImageThumbnailCardProps) {
  const router = useRouter();
  const { openDrawer } = useItemDrawer();
  const [copied, setCopied] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const itemType = item.itemType || {
    name: "image",
    icon: "Image",
    color: "#ec4899",
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const textToCopy = item.fileUrl || item.url || item.content || item.title;
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

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteItemAction(item.id);
      if (result.success) {
        setIsDeleteDialogOpen(false);
        toast.success("Image deleted successfully");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete image");
      }
    } catch (err) {
      console.error("Failed to delete image:", err);
      toast.error("An unexpected error occurred while deleting the image.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCardClick = () => {
    openDrawer(item.id);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative flex flex-col justify-between gap-3 rounded-xl border border-border/80 border-l-2 bg-card/60 p-3.5 backdrop-blur transition-all duration-200 hover:border-border hover:bg-card/90 cursor-pointer overflow-hidden"
      style={{ borderLeftColor: itemType.color || "#ec4899" }}
    >
      {/* 16:9 Aspect Ratio Thumbnail Container */}
      <div className="relative w-full aspect-video overflow-hidden rounded-lg border border-border/60 bg-muted/20 flex items-center justify-center [isolation:isolate] [transform:translateZ(0)]">
        {item.fileUrl ? (
          <Image
            src={item.fileUrl}
            alt={item.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transform-gpu will-change-transform [backface-visibility:hidden] [transform:translateZ(0)] group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-1 text-muted-foreground/50">
            <ImageIcon className="h-8 w-8 stroke-1" />
            <span className="text-[11px] font-medium">No preview available</span>
          </div>
        )}
      </div>

      {/* Info Area: Title, Description, Tags */}
      <div className="min-w-0 w-full space-y-1.5 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm sm:text-base text-foreground group-hover:text-primary transition-colors line-clamp-1 flex-1">
            {item.title}
          </span>

          {item.isPinned && (
            <Pin className="h-3.5 w-3.5 text-muted-foreground rotate-45 shrink-0" />
          )}

          {item.isFavorite && (
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />
          )}
        </div>

        {item.description && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {item.description}
          </p>
        )}

        {/* Tags & File Size */}
        {(item.tags.length > 0 || item.fileSize) && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-md bg-muted/80 px-2 py-0.5 text-[11px] font-normal text-muted-foreground"
              >
                {tag}
              </span>
            ))}
            {item.fileSize && (
              <span className="inline-flex items-center rounded-md bg-muted/80 px-2 py-0.5 text-[11px] font-mono text-muted-foreground">
                {formatFileSize(item.fileSize)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom Action Row: Date, Copy, and Menu */}
      <div
        className="flex items-center justify-between pt-2 border-t border-border/40 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-xs text-muted-foreground font-mono">
          {formatDate(item.createdAt)}
        </span>

        <div className="flex items-center gap-1">
          {/* Quick Copy Button */}
          {(item.fileUrl || item.url || item.content) && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground opacity-80 group-hover:opacity-100 transition-opacity cursor-pointer"
              onClick={handleCopy}
              title={copied ? "Copied!" : "Copy URL"}
              aria-label="Copy image URL"
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
                  aria-label="Image actions"
                />
              }
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  openDrawer(item.id);
                }}
                className="flex items-center gap-2 cursor-pointer"
              >
                <ExternalLink className="h-4 w-4" />
                <span>View</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleCopy}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Copy className="h-4 w-4" />
                <span>Copy</span>
              </DropdownMenuItem>
              {item.fileUrl && (
                <DropdownMenuItem
                  onClick={() => {
                    const downloadUrl = `/api/download?key=${encodeURIComponent(item.fileUrl!)}&filename=${encodeURIComponent(item.fileName || "download")}`;
                    window.open(downloadUrl, "_blank");
                  }}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDeleteDialogOpen(true);
                }}
                className="flex items-center gap-2 text-destructive cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteItemDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        itemTitle={item.title}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
