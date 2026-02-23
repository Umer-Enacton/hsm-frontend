"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";
import type { Category } from "@/types/category";

interface DeleteCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
}

export function DeleteCategoryDialog({
  open,
  onOpenChange,
  category,
  onConfirm,
  isLoading = false,
}: DeleteCategoryDialogProps) {
  const handleConfirm = async () => {
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      // Error is handled by parent
      console.error("Failed to delete category:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Category?
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this category? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>

        {category && (
          <div className="py-4">
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Name:
                </span>
                <span className="text-sm font-semibold">{category.name}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                  Description:
                </span>
                <span className="text-sm text-muted-foreground line-clamp-2">
                  {category.description}
                </span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Category"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DeleteCategoryDialog;
