"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FolderPlus, Loader2, AlertCircle } from "lucide-react";
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

export interface CreateCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCollectionDialog({
  open,
  onOpenChange,
}: CreateCollectionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-dvh sm:h-auto max-h-dvh sm:max-h-[90vh] max-w-full sm:max-w-lg rounded-none sm:rounded-xl border-0 sm:border border-border left-0 top-0 translate-x-0 translate-y-0 sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 p-0 flex flex-col gap-0 overflow-hidden">
        {open && <CreateCollectionForm onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

interface CreateCollectionFormProps {
  onClose: () => void;
}

function CreateCollectionForm({ onClose }: CreateCollectionFormProps) {
  const router = useRouter();

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage("Please enter a name for the collection.");
      return;
    }

    if (trimmedName.length > 100) {
      setErrorMessage("Collection name must be 100 characters or less.");
      return;
    }

    const trimmedDescription = description.trim();
    if (trimmedDescription.length > 1000) {
      setErrorMessage("Description must be 1000 characters or less.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          description: trimmedDescription || undefined,
        }),
      });

      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        const msg = data?.error || "Failed to create collection.";
        setErrorMessage(msg);
        toast.error(msg);
        return;
      }

      toast.success("Collection created successfully!");
      onClose();
      router.refresh();
    } catch (err) {
      console.error("Error creating collection:", err);
      const msg =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while creating the collection.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <DialogHeader className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-border shrink-0 pr-12">
        <DialogTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold">
          <FolderPlus className="h-5 w-5 text-primary shrink-0" />
          <span>Create New Collection</span>
        </DialogTitle>
        <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
          Group related snippets, prompts, commands, and links together.
        </DialogDescription>
      </DialogHeader>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col flex-1 min-h-0 overflow-hidden"
      >
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5">
          {errorMessage && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Collection Name */}
          <div className="space-y-1.5">
            <Label htmlFor="collection-name" className="text-xs sm:text-sm">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="collection-name"
              type="text"
              placeholder="e.g., React Patterns"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              maxLength={100}
              required
              autoFocus
            />
          </div>

          {/* Collection Description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="collection-description"
                className="text-xs sm:text-sm"
              >
                Description
              </Label>
              <span className="text-[11px] text-muted-foreground">
                Optional
              </span>
            </div>
            <Textarea
              id="collection-description"
              placeholder="Describe what this collection is for..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              rows={3}
              maxLength={1000}
              className="resize-y min-h-[88px]"
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
            disabled={isSubmitting || !name.trim()}
            className="w-full sm:w-auto cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                <span>Creating...</span>
              </>
            ) : (
              <span>Create Collection</span>
            )}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
