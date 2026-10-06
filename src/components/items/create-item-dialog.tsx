"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Code,
  Sparkles,
  Terminal,
  StickyNote,
  Link as LinkIcon,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createItem as createItemAction } from "@/actions/items";
import { cn } from "@/lib/utils";

export type CreateItemType = "snippet" | "prompt" | "command" | "note" | "link";

interface ItemTypeOption {
  type: CreateItemType;
  label: string;
  icon: React.ElementType;
  color: string;
  description: string;
}

const itemTypeOptions: ItemTypeOption[] = [
  {
    type: "snippet",
    label: "Snippet",
    icon: Code,
    color: "#3b82f6",
    description: "Code snippets & boilerplates",
  },
  {
    type: "prompt",
    label: "Prompt",
    icon: Sparkles,
    color: "#a855f7",
    description: "AI prompts & system instructions",
  },
  {
    type: "command",
    label: "Command",
    icon: Terminal,
    color: "#f97316",
    description: "CLI commands & terminal scripts",
  },
  {
    type: "note",
    label: "Note",
    icon: StickyNote,
    color: "#eab308",
    description: "Thoughts & scratchpad memos",
  },
  {
    type: "link",
    label: "Link",
    icon: LinkIcon,
    color: "#ec4899",
    description: "Web links & documentation",
  },
];

const commonLanguages = [
  "typescript",
  "javascript",
  "python",
  "html",
  "css",
  "json",
  "sql",
  "bash",
  "rust",
  "go",
  "csharp",
  "cpp",
  "java",
  "markdown",
  "yaml",
];

const commonShells = [
  "bash",
  "zsh",
  "powershell",
  "sh",
  "docker",
  "git",
  "npm",
];

export interface CreateItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: CreateItemType;
}

export function CreateItemDialog({
  open,
  onOpenChange,
  defaultType = "snippet",
}: CreateItemDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-dvh sm:h-auto max-h-dvh sm:max-h-[90vh] max-w-full sm:max-w-xl rounded-none sm:rounded-xl border-0 sm:border border-border left-0 top-0 translate-x-0 translate-y-0 sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 p-0 flex flex-col gap-0 overflow-hidden">
        {open && (
          <CreateItemForm
            defaultType={defaultType}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface CreateItemFormProps {
  defaultType: CreateItemType;
  onClose: () => void;
}

function CreateItemForm({ defaultType, onClose }: CreateItemFormProps) {
  const router = useRouter();

  const [selectedType, setSelectedType] =
    React.useState<CreateItemType>(defaultType);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [content, setContent] = React.useState("");
  const [language, setLanguage] = React.useState(
    defaultType === "command" ? "bash" : "typescript",
  );
  const [url, setUrl] = React.useState("");
  const [tagsInput, setTagsInput] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleTypeSelect = (type: CreateItemType) => {
    setSelectedType(type);
    setErrorMessage(null);
    if (type === "command" && (language === "typescript" || !language)) {
      setLanguage("bash");
    } else if (type === "snippet" && (language === "bash" || !language)) {
      setLanguage("typescript");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setErrorMessage("Please enter a title for the item.");
      return;
    }

    if (selectedType === "link") {
      const trimmedUrl = url.trim();
      if (!trimmedUrl) {
        setErrorMessage("Please enter a URL for the link item.");
        return;
      }
      if (!/^(https?:\/\/)/i.test(trimmedUrl)) {
        setErrorMessage(
          "Invalid URL format. URL must start with http:// or https://",
        );
        return;
      }
    }

    const parsedTags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    setIsSubmitting(true);

    try {
      const result = await createItemAction({
        type: selectedType,
        title: trimmedTitle,
        description: description.trim() || undefined,
        content:
          selectedType === "link"
            ? undefined
            : content.trim() || undefined,
        language:
          selectedType === "snippet" || selectedType === "command"
            ? language.trim() || undefined
            : undefined,
        url: selectedType === "link" ? url.trim() : undefined,
        tags: parsedTags.length > 0 ? parsedTags : undefined,
      });

      if (!result.success) {
        setErrorMessage(result.error || "Failed to create item.");
        toast.error(result.error || "Failed to create item.");
        return;
      }

      toast.success("Item created successfully!");
      onClose();
      router.refresh();
    } catch (err) {
      console.error("Error creating item:", err);
      const msg =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while creating item.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeTypeInfo =
    itemTypeOptions.find((opt) => opt.type === selectedType) ||
    itemTypeOptions[0];

  return (
    <>
      <DialogHeader className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-border shrink-0 pr-12">
        <DialogTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold">
          <activeTypeInfo.icon
            className="h-5 w-5 shrink-0"
            style={{ color: activeTypeInfo.color }}
          />
          <span>Create New {activeTypeInfo.label}</span>
        </DialogTitle>
        <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
          {activeTypeInfo.description}
        </DialogDescription>
      </DialogHeader>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col flex-1 min-h-0 overflow-hidden"
      >
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5">
          {/* Type Selector Pills */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground font-medium">
              Item Type
            </Label>
            <div className="grid grid-cols-5 gap-1 sm:gap-2">
              {itemTypeOptions.map((opt) => {
                const isSelected = selectedType === opt.type;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => handleTypeSelect(opt.type)}
                    disabled={isSubmitting}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 py-2 sm:py-2.5 px-0.5 sm:px-1 rounded-lg border text-xs font-medium transition-all cursor-pointer select-none min-w-0",
                      isSelected
                        ? "bg-accent/80 border-primary/50 text-foreground shadow-xs ring-1 ring-primary/40"
                        : "border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                    )}
                  >
                    <Icon
                      className="h-4 w-4 shrink-0 transition-transform"
                      style={{ color: opt.color }}
                    />
                    <span className="text-[10px] sm:text-xs leading-tight truncate max-w-full font-medium">
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error banner */}
          {errorMessage && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Title (Required for all types) */}
          <div className="space-y-1.5">
            <Label htmlFor="item-title" className="text-xs sm:text-sm">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="item-title"
              type="text"
              placeholder={
                selectedType === "snippet"
                  ? "e.g., useDebounce Hook"
                  : selectedType === "prompt"
                    ? "e.g., Senior Code Reviewer"
                    : selectedType === "command"
                      ? "e.g., Docker Container Cleanup"
                      : selectedType === "note"
                        ? "e.g., System Architecture Thoughts"
                        : "e.g., Next.js Documentation"
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              required
              autoFocus
            />
          </div>

          {/* Type-Specific Fields */}
          {/* Link Type: URL */}
          {selectedType === "link" && (
            <div className="space-y-1.5">
              <Label htmlFor="item-url" className="text-xs sm:text-sm">
                URL <span className="text-destructive">*</span>
              </Label>
              <Input
                id="item-url"
                type="url"
                placeholder="https://example.com/docs"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
          )}

          {/* Snippet / Command: Language Selector */}
          {(selectedType === "snippet" || selectedType === "command") && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="item-language" className="text-xs sm:text-sm">
                  {selectedType === "snippet"
                    ? "Programming Language"
                    : "Shell / CLI"}
                </Label>
                <span className="text-[11px] text-muted-foreground">
                  Optional
                </span>
              </div>
              <div className="relative">
                <Input
                  id="item-language"
                  type="text"
                  list={
                    selectedType === "snippet"
                      ? "language-options"
                      : "shell-options"
                  }
                  placeholder={
                    selectedType === "snippet"
                      ? "e.g. typescript, python, rust"
                      : "e.g. bash, zsh, powershell"
                  }
                  value={language}
                  onChange={(e) => setLanguage(e.target.value.toLowerCase())}
                  disabled={isSubmitting}
                  className="[&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:opacity-0"
                />
                <datalist
                  id={
                    selectedType === "snippet"
                      ? "language-options"
                      : "shell-options"
                  }
                >
                  {(selectedType === "snippet"
                    ? commonLanguages
                    : commonShells
                  ).map((lang) => (
                    <option key={lang} value={lang} />
                  ))}
                </datalist>
              </div>
            </div>
          )}

          {/* Content Field (for snippet, prompt, command, note) */}
          {selectedType !== "link" && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="item-content" className="text-xs sm:text-sm">
                  {selectedType === "snippet"
                    ? "Code Content"
                    : selectedType === "command"
                      ? "Command / Script"
                      : selectedType === "prompt"
                        ? "Prompt Text"
                        : "Note Content"}
                </Label>
                <span className="text-[11px] text-muted-foreground">
                  Optional
                </span>
              </div>
              <Textarea
                id="item-content"
                placeholder={
                  selectedType === "snippet"
                    ? "export function useDebounce<T>(value: T, delay: number) {\n  // Code here...\n}"
                    : selectedType === "command"
                      ? "docker system prune -a --volumes -f"
                      : selectedType === "prompt"
                        ? "Act as a principal software engineer. Review the following code for security and performance..."
                        : "Write down your thoughts, ideas, or meeting notes..."
                }
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isSubmitting}
                rows={
                  selectedType === "snippet" || selectedType === "prompt"
                    ? 6
                    : 4
                }
                className={cn(
                  "resize-y min-h-[100px]",
                  (selectedType === "snippet" || selectedType === "command") &&
                    "font-mono text-xs sm:text-sm leading-relaxed",
                )}
              />
            </div>
          )}

          {/* Description (Optional for all types) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="item-description" className="text-xs sm:text-sm">
                Description
              </Label>
              <span className="text-[11px] text-muted-foreground">
                Optional
              </span>
            </div>
            <Input
              id="item-description"
              type="text"
              placeholder="Brief summary or context..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Tags (Optional for all types) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="item-tags" className="text-xs sm:text-sm">
                Tags
              </Label>
              <span className="text-[11px] text-muted-foreground">
                Comma-separated
              </span>
            </div>
            <Input
              id="item-tags"
              type="text"
              placeholder="react, frontend, hooks"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <DialogFooter className="px-5 sm:px-6 py-4 border-t border-border shrink-0 flex flex-col-reverse sm:flex-row gap-2 sm:gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={
              isSubmitting ||
              !title.trim() ||
              (selectedType === "link" && !url.trim())
            }
            className="w-full sm:w-auto cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                <span>Creating...</span>
              </>
            ) : (
              <span>Create Item</span>
            )}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
