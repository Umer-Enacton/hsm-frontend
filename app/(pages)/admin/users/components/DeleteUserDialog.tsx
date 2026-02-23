"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Loader2 } from "lucide-react";
import { getUserInitials } from "@/lib/user-api";
import { RoleBadge } from "./RoleBadge";
import type { AppUser } from "@/types/user";

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AppUser | null;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
}

export function DeleteUserDialog({
  open,
  onOpenChange,
  user,
  onConfirm,
  isLoading,
}: DeleteUserDialogProps) {
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Reset confirmation when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setIsConfirmed(false);
    }
  }, [open]);

  if (!user) return null;

  const initials = getUserInitials(user.name);

  const handleConfirm = async () => {
    await onConfirm();
    setIsConfirmed(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete User
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. Please confirm you want to delete this
            user.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Preview */}
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{user.name}</p>
              <p className="text-sm text-muted-foreground truncate">
                {user.email}
              </p>
              <div className="mt-1">
                <RoleBadge roleId={user.roleId} />
              </div>
            </div>
          </div>

          {/* Warning Message */}
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <p className="text-sm text-destructive font-medium mb-1">
              Warning: This will permanently delete this user account
            </p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>All user data will be lost</li>
              <li>This action cannot be undone</li>
              <li>Associated bookings/services may be affected</li>
            </ul>
          </div>

          {/* Confirmation Checkbox */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="confirm-delete"
              checked={isConfirmed}
              onCheckedChange={(checked) => setIsConfirmed(checked as boolean)}
            />
            <label
              htmlFor="confirm-delete"
              className="text-sm leading-6 cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I understand that this action cannot be undone and I want to
              delete this user
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isConfirmed || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete User"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DeleteUserDialog;
