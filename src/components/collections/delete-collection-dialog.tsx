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

export interface DeleteCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionName?: string;
  itemCount?: number;
  onConfirm: () => Promise<void> | void;
  isDeleting?: boolean;
}

export function DeleteCollectionDialog({
  open,
  onOpenChange,
  collectionName,
  itemCount,
  onConfirm,
  isDeleting = false,
}: DeleteCollectionDialogProps) {
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
            <span>Delete Collection</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm leading-relaxed pt-1">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">
              {collectionName ? `"${collectionName}"` : "this collection"}
            </span>
            ? This action cannot be undone.{" "}
            {itemCount !== undefined && itemCount > 0 ? (
              <>
                All{" "}
                <span className="font-medium text-foreground">
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </span>{" "}
                inside will NOT be deleted — they will simply no longer exist in
                this collection.
              </>
            ) : (
              "Items in this collection will NOT be deleted — they will simply no longer exist in this collection."
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            autoFocus
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
