"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Pin,
  Star,
  Copy,
  Check,
  MoreHorizontal,
  Trash2,
  Download,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { formatFileSize, getFileIconInfo } from "@/lib/item-utils";
import { cn } from "@/lib/utils";

interface FileListItemProps {
  item: DashboardItem;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function FileListItem({ item }: FileListItemProps) {
  const router = useRouter();
  const { openDrawer } = useItemDrawer();
  const [copied, setCopied] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const itemType = item.itemType || {
    name: "file",
    icon: "File",
    color: "#6366f1",
  };

  const iconInfo = getFileIconInfo(item.fileName || item.fileUrl || item.title);
  const Icon = iconInfo.icon;

  const downloadUrl = item.fileUrl
    ? `/api/download?key=${encodeURIComponent(item.fileUrl)}&filename=${encodeURIComponent(item.fileName || item.title)}`
    : undefined;

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
      toast.success("Copied to clipboard");
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
        toast.success("File deleted successfully");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete file");
      }
    } catch (err) {
      console.error("Failed to delete file:", err);
      toast.error("An unexpected error occurred while deleting the file.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRowClick = () => {
    openDrawer(item.id);
  };

  return (
    <>
      <div
        onClick={handleRowClick}
        className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:px-4 sm:py-3 gap-2.5 sm:gap-4 rounded-xl border border-border/80 border-l-2 bg-card/60 backdrop-blur transition-all duration-150 hover:bg-card/90 hover:border-border cursor-pointer select-none overflow-hidden"
        style={{ borderLeftColor: itemType.color || "#6366f1" }}
      >
        {/* Top/Main Container on Mobile & Desktop */}
        <div className="flex items-center justify-between sm:justify-start gap-3 min-w-0 flex-1">
          {/* File Extension Icon */}
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-transform duration-150 group-hover:scale-105",
              iconInfo.bgClass,
            )}
            title={iconInfo.category}
          >
            <Icon className={cn("h-5 w-5", iconInfo.colorClass)} />
          </div>

          {/* Name & Subtitle / Tags */}
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors truncate">
                {item.title}
              </span>

              {item.isPinned && (
                <Pin className="h-3.5 w-3.5 text-muted-foreground rotate-45 shrink-0" />
              )}

              {item.isFavorite && (
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />
              )}
            </div>

            {/* Secondary info: filename if different, or category */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
              {item.fileName && item.fileName !== item.title ? (
                <span className="truncate text-muted-foreground/80 font-mono text-[11px]">
                  {item.fileName}
                </span>
              ) : (
                <span className="text-[11px] text-muted-foreground/70">
                  {iconInfo.category}
                </span>
              )}

              {item.tags.length > 0 && (
                <div className="hidden md:flex items-center gap-1.5 shrink-0 pl-1">
                  {item.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-md bg-muted/80 px-1.5 py-0.2 text-[10px] font-normal text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                  {item.tags.length > 3 && (
                    <span className="text-[10px] text-muted-foreground/60">
                      +{item.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Right Quick Action: Download button & dropdown on mobile header */}
          <div
            className="flex sm:hidden items-center gap-1 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {downloadUrl ? (
              <a
                href={downloadUrl}
                download={item.fileName || item.title}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon-sm" }),
                  "h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 cursor-pointer",
                )}
                title="Download file"
                aria-label={`Download ${item.fileName || item.title}`}
              >
                <Download className="h-4 w-4" />
              </a>
            ) : null}

            <DropdownMenu>
              <DropdownMenuTrigger
                onClick={(e) => e.stopPropagation()}
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={(e) => e.stopPropagation()}
                    className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 cursor-pointer"
                    aria-label="File options"
                  />
                }
              >
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    openDrawer(item.id);
                  }}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>View Details</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleCopy}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span>{copied ? "Copied" : "Copy Link"}</span>
                </DropdownMenuItem>
                {downloadUrl && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
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

        {/* Desktop Metadata Columns: Size & Date */}
        <div className="hidden sm:flex items-center gap-6 shrink-0 text-xs text-muted-foreground">
          {/* File Size */}
          <div className="w-20 text-right font-mono font-medium text-muted-foreground/90">
            {formatFileSize(item.fileSize)}
          </div>

          {/* Upload Date */}
          <div className="w-28 text-right sm:text-left text-muted-foreground/80">
            {formatDate(item.createdAt)}
          </div>

          {/* Actions: Download Button & Dropdown */}
          <div
            className="flex items-center justify-end gap-1.5 shrink-0 w-20"
            onClick={(e) => e.stopPropagation()}
          >
            {downloadUrl ? (
              <a
                href={downloadUrl}
                download={item.fileName || item.title}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon-sm" }),
                  "h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 cursor-pointer transition-colors",
                )}
                title="Download file"
                aria-label={`Download ${item.fileName || item.title}`}
              >
                <Download className="h-4 w-4" />
              </a>
            ) : (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  toast.info("No file attachment available to download.");
                }}
                className="h-8 w-8 rounded-lg text-muted-foreground/40 hover:text-foreground"
                title="No file attachment"
                aria-label="No file attachment"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger
                onClick={(e) => e.stopPropagation()}
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={(e) => e.stopPropagation()}
                    className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 cursor-pointer"
                    aria-label="File options"
                  />
                }
              >
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    openDrawer(item.id);
                  }}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>View Details</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleCopy}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span>{copied ? "Copied" : "Copy Link"}</span>
                </DropdownMenuItem>
                {downloadUrl && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
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

        {/* Mobile Stacked Info (File Size & Upload Date) */}
        <div className="flex sm:hidden items-center justify-between text-[11px] text-muted-foreground pt-1.5 border-t border-border/40 pl-[52px]">
          <div className="flex items-center gap-2">
            <span className="font-mono font-medium text-foreground/80">
              {formatFileSize(item.fileSize)}
            </span>
            <span>•</span>
            <span>{formatDate(item.createdAt)}</span>
          </div>

          {item.tags.length > 0 && (
            <div className="flex items-center gap-1">
              {item.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded bg-muted/80 px-1.5 py-0.2 text-[10px]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog for Deletion */}
      <DeleteItemDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        itemTitle={item.title}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}
