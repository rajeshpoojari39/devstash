"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  File,
  Image as ImageIcon,
  Link as LinkIcon,
  Star,
  Pin,
  Copy,
  Check,
  Pencil,
  Trash2,
  Tag as TagIcon,
  Folder as FolderIcon,
  Calendar,
  ExternalLink,
  Download,
  AlertCircle,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useItemDrawer } from "@/components/items/item-drawer-context";
import {
  updateItem as updateItemAction,
  deleteItem as deleteItemAction,
} from "@/actions/items";
import { DeleteItemDialog } from "@/components/items/delete-item-dialog";
import { ItemDetail } from "@/lib/db/items";
import { formatItemTypeTitle, formatLongDate } from "@/lib/item-utils";
import { cn } from "@/lib/utils";

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

function formatFileSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export function ItemDrawer() {
  const router = useRouter();
  const { isOpen, selectedItemId, closeDrawer } = useItemDrawer();
  const [deleteTargetItem, setDeleteTargetItem] =
    React.useState<ItemDetail | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const isDeleteDialogOpen = Boolean(deleteTargetItem);

  const handleDeleteItem = async () => {
    if (!deleteTargetItem) return;

    setIsDeleting(true);
    try {
      const result = await deleteItemAction(deleteTargetItem.id);

      if (result.success) {
        setDeleteTargetItem(null);
        closeDrawer();
        toast.success("Item deleted successfully");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete item");
      }
    } catch (err) {
      console.error("Failed to delete item:", err);
      toast.error("An unexpected error occurred while deleting the item.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Sheet
        open={isOpen}
        onOpenChange={(open) => {
          if (isDeleteDialogOpen) return;
          if (!open) closeDrawer();
        }}
      >
        <SheetContent
          side="right"
          showCloseButton={!isDeleteDialogOpen}
          className={cn(
            "w-full sm:w-[480px] md:w-[500px] lg:w-[45%] xl:w-[40%] sm:max-w-none md:max-w-none lg:max-w-none xl:max-w-none data-[side=right]:w-full data-[side=right]:sm:w-[480px] data-[side=right]:md:w-[500px] data-[side=right]:lg:w-[45%] data-[side=right]:xl:w-[40%] data-[side=right]:sm:max-w-none data-[side=right]:md:max-w-none data-[side=right]:lg:max-w-none data-[side=right]:xl:max-w-none p-0 gap-0 border-l border-border bg-background text-foreground flex flex-col h-full overflow-hidden",
            isDeleteDialogOpen && "pointer-events-none select-none",
          )}
        >
          {isOpen && selectedItemId && (
            <ItemDrawerContent
              key={selectedItemId}
              itemId={selectedItemId}
              onRequestDelete={(item) => setDeleteTargetItem(item)}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <DeleteItemDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeleteTargetItem(null);
          }
        }}
        itemTitle={deleteTargetItem?.title}
        onConfirm={handleDeleteItem}
        isDeleting={isDeleting}
      />
    </>
  );
}

interface ItemDrawerContentProps {
  itemId: string;
  onRequestDelete?: (item: ItemDetail) => void;
}

function ItemDrawerContent({
  itemId,
  onRequestDelete,
}: ItemDrawerContentProps) {
  const router = useRouter();
  const [item, setItem] = React.useState<ItemDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [isFavorite, setIsFavorite] = React.useState(false);
  const [isPinned, setIsPinned] = React.useState(false);

  // Edit Mode state
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState("");
  const [editDescription, setEditDescription] = React.useState("");
  const [editContent, setEditContent] = React.useState("");
  const [editLanguage, setEditLanguage] = React.useState("");
  const [editUrl, setEditUrl] = React.useState("");
  const [editTags, setEditTags] = React.useState("");

  React.useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    async function loadItem() {
      try {
        const response = await fetch(`/api/items/${itemId}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to load item details");
        }
        const data = await response.json();
        if (!ignore) {
          setItem(data.item);
          setIsFavorite(Boolean(data.item.isFavorite));
          setIsPinned(Boolean(data.item.isPinned));
          setLoading(false);
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        if (!ignore) {
          console.error("Error fetching item in drawer:", err);
          setError(
            err instanceof Error
              ? err.message
              : "An unexpected error occurred while fetching item.",
          );
          setLoading(false);
        }
      }
    }

    loadItem();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [itemId]);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    fetch(`/api/items/${itemId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load item details");
        return res.json();
      })
      .then((data) => {
        setItem(data.item);
        setIsFavorite(Boolean(data.item.isFavorite));
        setIsPinned(Boolean(data.item.isPinned));
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load item.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleCopy = async () => {
    if (!item) return;
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
      console.error("Failed to copy:", err);
    }
  };

  const handleToggleFavorite = () => {
    setIsFavorite((prev) => !prev);
  };

  const handleTogglePin = () => {
    setIsPinned((prev) => !prev);
  };

  const handleStartEdit = () => {
    if (!item) return;
    setEditTitle(item.title);
    setEditDescription(item.description || "");
    setEditContent(item.content || "");
    setEditLanguage(item.language || "");
    setEditUrl(item.url || "");
    setEditTags(item.tags ? item.tags.join(", ") : "");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!item || !editTitle.trim()) return;

    setIsSaving(true);
    try {
      const parsedTags = editTags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const result = await updateItemAction(item.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        content: editContent || null,
        language: editLanguage.trim() || null,
        url: editUrl.trim() || null,
        tags: parsedTags,
      });

      if (result.success && result.data) {
        setItem(result.data);
        setIsFavorite(Boolean(result.data.isFavorite));
        setIsPinned(Boolean(result.data.isPinned));
        setIsEditing(false);
        toast.success("Item updated successfully");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update item");
      }
    } catch (err) {
      console.error("Failed to update item:", err);
      toast.error("An unexpected error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <ItemDrawerSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 p-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-3">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">
          Failed to load item
        </h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-sm">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRetry}
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (!item) {
    return null;
  }

  const itemType = item.itemType || {
    name: "snippet",
    icon: "Code",
    color: "#3b82f6",
  };

  const normalizedTypeName = itemType.name.toLowerCase();
  const iconKey = (itemType.icon || itemType.name || "code").toLowerCase();
  const Icon =
    typeIconMap[iconKey] || typeIconMap[normalizedTypeName] || Code;

  const contentLines = item.content ? item.content.split("\n") : [];

  const hasContentField = [
    "snippet",
    "prompt",
    "command",
    "note",
    "code",
    "sparkles",
    "terminal",
    "stickynote",
  ].includes(normalizedTypeName);

  const hasLanguageField = [
    "snippet",
    "command",
    "code",
    "terminal",
  ].includes(normalizedTypeName);

  const hasUrlField = ["link"].includes(normalizedTypeName);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header Section */}
      <SheetHeader className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-border/60 shrink-0">
        <div className="flex items-start gap-3 sm:gap-3.5 pr-8">
          <div
            className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-lg border border-border/80 bg-muted/40"
            style={{ color: itemType.color }}
          >
            <Icon className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <SheetTitle className="text-lg sm:text-xl font-semibold tracking-tight text-foreground line-clamp-2">
              {isEditing ? `Edit: ${item.title}` : item.title}
            </SheetTitle>
            <SheetDescription className="sr-only">
              {item.description || `Details for ${item.title}`}
            </SheetDescription>

            {/* Badges: Item Type & Language */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="inline-flex items-center rounded-md bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground border border-border/60">
                {formatItemTypeTitle(itemType.name)}
              </span>
              {!isEditing && item.language && (
                <span className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-0.5 text-xs font-mono font-medium text-primary border border-primary/20">
                  {item.language}
                </span>
              )}
            </div>
          </div>
        </div>
      </SheetHeader>

      {/* Action Bar */}
      {isEditing ? (
        <div className="flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3 border-b border-border/60 bg-muted/20 shrink-0">
          <span className="text-xs font-medium text-muted-foreground">
            Edit Mode
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelEdit}
              disabled={isSaving}
              className="h-8 px-2.5 sm:px-3 text-xs sm:text-sm text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-3.5 w-3.5 mr-1 sm:mr-1.5" />
              <span>Cancel</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSaveEdit}
              disabled={isSaving || !editTitle.trim()}
              className="h-8 px-3 text-xs sm:text-sm font-medium bg-white text-black hover:bg-neutral-200 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5 mr-1.5 text-black" />
                  <span>Save</span>
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-6 py-2 sm:py-3 border-b border-border/60 bg-muted/20 shrink-0">
          {/* Favorite Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleFavorite}
            className={cn(
              "px-2 sm:px-2.5 h-8 text-xs sm:text-sm cursor-pointer",
              isFavorite
                ? "text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 font-medium"
                : "text-muted-foreground hover:text-foreground",
            )}
            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
            aria-label="Favorite"
          >
            <Star
              className={cn(
                "h-4 w-4",
                isFavorite && "fill-amber-400 text-amber-400",
                "sm:mr-1.5",
              )}
            />
            <span className="hidden sm:inline">Favorite</span>
          </Button>

          {/* Pin Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleTogglePin}
            className={cn(
              "px-2 sm:px-2.5 h-8 text-xs sm:text-sm cursor-pointer",
              isPinned
                ? "text-foreground font-medium bg-muted/60"
                : "text-muted-foreground hover:text-foreground",
            )}
            title={isPinned ? "Unpin item" : "Pin item"}
            aria-label="Pin"
          >
            <Pin
              className={cn(
                "h-4 w-4",
                isPinned && "rotate-45 text-foreground",
                "sm:mr-1.5",
              )}
            />
            <span className="hidden sm:inline">Pin</span>
          </Button>

          {/* Copy Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="px-2 sm:px-2.5 h-8 text-xs sm:text-sm text-muted-foreground hover:text-foreground cursor-pointer"
            title={copied ? "Copied!" : "Copy content"}
            aria-label="Copy"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-500 sm:mr-1.5" />
                <span className="text-emerald-500 hidden sm:inline">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Copy</span>
              </>
            )}
          </Button>

          {/* Edit Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleStartEdit}
            className="px-2 sm:px-2.5 h-8 text-xs sm:text-sm text-muted-foreground hover:text-foreground cursor-pointer"
            title="Edit item"
            aria-label="Edit"
          >
            <Pencil className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Edit</span>
          </Button>

          {/* Delete Button (Right aligned) */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => item && onRequestDelete?.(item)}
            className="ml-auto h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 cursor-pointer"
            title="Delete item"
            aria-label="Delete item"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Scrollable Content Body */}
      {isEditing ? (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
          {/* Title Input */}
          <div className="space-y-1.5">
            <label
              htmlFor="edit-item-title"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block"
            >
              Title <span className="text-destructive">*</span>
            </label>
            <Input
              id="edit-item-title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Enter item title..."
              className="text-sm font-medium"
              required
            />
          </div>

          {/* Language Input (snippet, command) */}
          {hasLanguageField && (
            <div className="space-y-1.5">
              <label
                htmlFor="edit-item-language"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block"
              >
                Language
              </label>
              <Input
                id="edit-item-language"
                value={editLanguage}
                onChange={(e) => setEditLanguage(e.target.value)}
                placeholder="e.g. typescript, bash, python"
                className="text-sm font-mono"
              />
            </div>
          )}

          {/* URL Input (link) */}
          {hasUrlField && (
            <div className="space-y-1.5">
              <label
                htmlFor="edit-item-url"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block"
              >
                URL
              </label>
              <Input
                id="edit-item-url"
                type="url"
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                placeholder="https://example.com"
                className="text-sm"
              />
            </div>
          )}

          {/* Description Input */}
          <div className="space-y-1.5">
            <label
              htmlFor="edit-item-description"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block"
            >
              Description
            </label>
            <Textarea
              id="edit-item-description"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Add an optional description..."
              rows={3}
              className="text-sm resize-y"
            />
          </div>

          {/* Content Input (snippet, prompt, command, note) */}
          {hasContentField && (
            <div className="space-y-1.5">
              <label
                htmlFor="edit-item-content"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block"
              >
                Content
              </label>
              <Textarea
                id="edit-item-content"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Enter item content..."
                rows={8}
                className="font-mono text-xs leading-relaxed resize-y bg-zinc-950/40 dark:bg-zinc-900/40"
              />
            </div>
          )}

          {/* Tags Input */}
          <div className="space-y-1.5">
            <label
              htmlFor="edit-item-tags"
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              <TagIcon className="h-3.5 w-3.5" />
              <span>Tags</span>
            </label>
            <Input
              id="edit-item-tags"
              value={editTags}
              onChange={(e) => setEditTags(e.target.value)}
              placeholder="react, typescript, ui (comma separated)"
              className="text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              Separate tags with commas.
            </p>
          </div>

          {/* Non-Editable Details (Read-only during edit) */}
          <div className="pt-3 border-t border-border/60 space-y-4">
            {/* File info if present */}
            {(item.fileName || item.fileUrl) && (
              <div className="flex items-center justify-between gap-3 p-3.5 rounded-lg border border-border/80 bg-muted/20 opacity-80">
                <div className="flex items-center gap-2.5 min-w-0">
                  <File className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {item.fileName || "Uploaded File"}
                    </p>
                    {item.fileSize && (
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(item.fileSize)} (Read-only)
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Collections Section */}
            {item.collections && item.collections.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  <FolderIcon className="h-3.5 w-3.5" />
                  <span>Collections (Read-only)</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {item.collections.map((col) => (
                    <span
                      key={col.id}
                      className="inline-flex items-center rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground border border-border/60"
                    >
                      {col.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Timestamps Section */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                <Calendar className="h-3.5 w-3.5" />
                <span>Details</span>
              </div>
              <div className="space-y-1.5 text-xs sm:text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span className="text-foreground/80 font-medium">
                    {formatLongDate(item.createdAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Updated</span>
                  <span className="text-foreground/80 font-medium">
                    {formatLongDate(item.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
          {/* Description Section */}
          {item.description && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Description
              </h4>
              <p className="text-sm text-foreground/90 leading-relaxed">
                {item.description}
              </p>
            </div>
          )}

          {/* Content Section */}
          {(item.content || item.url || item.fileName) && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Content
              </h4>

              {/* Text / Code / Snippet / Command / Note Content */}
              {item.content && (
                <div className="relative rounded-lg border border-border/80 bg-zinc-950 dark:bg-zinc-900 text-zinc-200 font-mono text-xs overflow-x-auto p-4 max-h-96">
                  <div className="table w-full">
                    {contentLines.map((line, idx) => (
                      <div key={idx} className="table-row leading-6">
                        <span className="table-cell pr-4 text-right select-none text-zinc-600 font-mono text-xs w-8">
                          {idx + 1}
                        </span>
                        <span className="table-cell whitespace-pre font-mono text-xs text-zinc-100">
                          {line || " "}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Link / URL Content */}
              {item.url && (
                <div className="flex items-center justify-between gap-3 p-3.5 rounded-lg border border-border/80 bg-muted/30">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary hover:underline truncate"
                    >
                      {item.url}
                    </a>
                  </div>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({ variant: "outline", size: "xs" })}
                  >
                    Visit Link
                  </a>
                </div>
              )}

              {/* File / Image Attachment Details */}
              {(item.fileName || item.fileUrl) && (
                <div className="flex items-center justify-between gap-3 p-3.5 rounded-lg border border-border/80 bg-muted/30">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <File className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {item.fileName || "Uploaded File"}
                      </p>
                      {item.fileSize && (
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(item.fileSize)}
                        </p>
                      )}
                    </div>
                  </div>
                  {item.fileUrl && (
                    <a
                      href={item.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={item.fileName || true}
                      className={buttonVariants({
                        variant: "outline",
                        size: "xs",
                      })}
                    >
                      <Download className="h-3.5 w-3.5 mr-1" />
                      Download
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tags Section */}
          {item.tags && item.tags.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                <TagIcon className="h-3.5 w-3.5" />
                <span>Tags</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-foreground border border-border/60"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Collections Section */}
          {item.collections && item.collections.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                <FolderIcon className="h-3.5 w-3.5" />
                <span>Collections</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {item.collections.map((col) => (
                  <span
                    key={col.id}
                    className="inline-flex items-center rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-foreground border border-border/60"
                  >
                    {col.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Details Section */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>Details</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="text-foreground font-medium">
                  {formatLongDate(item.createdAt)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Updated</span>
                <span className="text-foreground font-medium">
                  {formatLongDate(item.updatedAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ItemDrawerSkeleton() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header Skeleton */}
      <SheetHeader className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-border/60">
        <SheetTitle className="sr-only">Loading item details</SheetTitle>
        <SheetDescription className="sr-only">
          Please wait while the item details are loaded
        </SheetDescription>
        <div className="flex items-start gap-3 sm:gap-3.5 pr-8">
          <Skeleton className="h-10 w-10 sm:h-11 sm:w-11 rounded-lg shrink-0" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-16 rounded-md" />
              <Skeleton className="h-5 w-20 rounded-md" />
            </div>
          </div>
        </div>
      </SheetHeader>

      {/* Action Bar Skeleton */}
      <div className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 border-b border-border/60 bg-muted/20">
        <Skeleton className="h-8 w-8 sm:w-20 rounded-md" />
        <Skeleton className="h-8 w-8 sm:w-16 rounded-md" />
        <Skeleton className="h-8 w-8 sm:w-16 rounded-md" />
        <Skeleton className="h-8 w-8 sm:w-16 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md ml-auto" />
      </div>

      {/* Body Skeleton */}
      <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 flex-1 overflow-y-auto">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-16 rounded-md" />
            <Skeleton className="h-6 w-14 rounded-md" />
            <Skeleton className="h-6 w-18 rounded-md" />
          </div>
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-28 rounded-md" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
