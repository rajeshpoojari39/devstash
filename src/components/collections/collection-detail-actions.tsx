"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Edit2, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EditCollectionDialog } from "@/components/collections/edit-collection-dialog";
import { DeleteCollectionDialog } from "@/components/collections/delete-collection-dialog";
import { deleteCollection } from "@/actions/collections";
import { cn } from "@/lib/utils";

export interface CollectionDetailActionsProps {
  collection: {
    id: string;
    name: string;
    description: string | null;
    isFavorite: boolean;
    itemCount: number;
  };
}

export function CollectionDetailActions({
  collection,
}: CollectionDetailActionsProps) {
  const router = useRouter();
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteCollection(collection.id);
      if (result.success) {
        setIsDeleteOpen(false);
        toast.success("Collection deleted successfully");
        router.push("/collections");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete collection");
      }
    } catch (err) {
      console.error("Failed to delete collection:", err);
      toast.error(
        "An unexpected error occurred while deleting the collection.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 shrink-0">
        {/* Favorite Button (UI only — favorite toggle not implemented yet) */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-disabled="true"
          aria-label="Favorite collection (coming soon)"
          title="Favorites coming soon"
          onClick={(e) => e.preventDefault()}
          className={cn(
            "h-8 px-2.5 sm:px-3 opacity-80 cursor-not-allowed",
            collection.isFavorite && "border-amber-500/40 text-amber-400",
          )}
        >
          <Star
            className={cn(
              "h-4 w-4 sm:mr-1.5",
              collection.isFavorite && "fill-amber-400 text-amber-400",
            )}
          />
          <span className="hidden sm:inline">Favorite</span>
        </Button>

        {/* Edit Metadata Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsEditOpen(true)}
          aria-label="Edit collection"
          className="h-8 px-2.5 sm:px-3 cursor-pointer"
        >
          <Edit2 className="h-4 w-4 sm:mr-1.5" />
          <span className="hidden sm:inline">Edit</span>
        </Button>

        {/* Delete Collection Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsDeleteOpen(true)}
          aria-label="Delete collection"
          className="h-8 px-2.5 sm:px-3 text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/40 cursor-pointer"
        >
          <Trash2 className="h-4 w-4 sm:mr-1.5" />
          <span className="hidden sm:inline">Delete</span>
        </Button>
      </div>

      <EditCollectionDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        collection={{
          id: collection.id,
          name: collection.name,
          description: collection.description,
        }}
      />

      <DeleteCollectionDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        collectionName={collection.name}
        itemCount={collection.itemCount}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}
