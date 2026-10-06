"use client";

import * as React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface DeleteItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemTitle?: string;
  onConfirm: () => Promise<void> | void;
  isDeleting?: boolean;
}

export function DeleteItemDialog({
  open,
  onOpenChange,
  itemTitle,
  onConfirm,
  isDeleting = false,
}: DeleteItemDialogProps) {
  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md border-destructive/30"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>Delete Item</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm leading-relaxed pt-1">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">
              {itemTitle ? `"${itemTitle}"` : "this item"}
            </span>
            ? This action cannot be undone and will permanently remove this item
            from your stash.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onOpenChange(false);
            }}
            disabled={isDeleting}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="cursor-pointer"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Delete</span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
