"use client";

import * as React from "react";
import { signOut } from "next-auth/react";
import { Trash2, AlertTriangle, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface DeleteAccountDialogProps {
  userEmail?: string | null;
}

export function DeleteAccountDialog({ userEmail }: DeleteAccountDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [confirmText, setConfirmText] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isDemoUser = userEmail?.toLowerCase() === "demo@devstash.io";

  function resetForm() {
    setConfirmText("");
    setError(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      resetForm();
    }
  }

  async function handleDelete() {
    if (confirmText !== "DELETE") {
      setError('Please type "DELETE" to confirm.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/user/account", {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to delete account. Please try again.");
        setIsLoading(false);
        return;
      }

      // Automatically sign out and redirect to sign-in page
      await signOut({ callbackUrl: "/sign-in" });
    } catch {
      setError("A network error occurred. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            variant="destructive"
            size="sm"
            className="gap-2 text-xs sm:text-sm cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete Account</span>
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md border-destructive/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span>Delete Account</span>
          </DialogTitle>
          <DialogDescription>
            This action is irreversible and will permanently delete your
            account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive leading-relaxed space-y-1">
            <p className="font-semibold">Warning: This cannot be undone.</p>
            <p className="text-muted-foreground">
              All your items (snippets, prompts, commands, notes, links, files,
              and images), custom types, and collections will be deleted
              permanently.
            </p>
          </div>

          {isDemoUser && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-400">
              Demo account protection: The shared demo user account cannot be
              deleted.
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="confirmDelete" className="text-xs">
              To verify, type{" "}
              <span className="font-mono font-bold">DELETE</span> below:
            </Label>
            <Input
              id="confirmDelete"
              type="text"
              placeholder="DELETE"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              disabled={isLoading || isDemoUser}
              className="font-mono text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={confirmText !== "DELETE" || isLoading || isDemoUser}
            onClick={handleDelete}
            className="cursor-pointer"
          >
            {isLoading && (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            )}
            <span>{isLoading ? "Deleting..." : "Permanently Delete"}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
