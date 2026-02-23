"use client";

import React from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Phone,
  Calendar,
  User as UserIcon,
  Copy,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { getUserInitials, getRoleLabel } from "@/lib/user-api";
import { RoleBadge } from "./RoleBadge";
import type { AppUser } from "@/types/user";

interface ViewUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AppUser | null;
  onDelete: () => void;
  currentUserId?: number; // Current logged-in admin user ID
}

export function ViewUserDialog({
  open,
  onOpenChange,
  user,
  onDelete,
  currentUserId,
}: ViewUserDialogProps) {
  if (!user) return null;

  const initials = getUserInitials(user.name);
  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  // Prevent deletion of admins or self
  const isAdmin = user.roleId === 3;
  const isSelf = user.id === currentUserId;
  const canDelete = !isAdmin && !isSelf;

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(user.email);
    toast.success("Email copied to clipboard");
  };

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(user.phone);
    toast.success("Phone number copied to clipboard");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
          <DialogDescription>
            View detailed information about this user
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Header */}
          <div className="flex items-center gap-4">
            {user.avatar ? (
              <div className="relative h-16 w-16 overflow-hidden rounded-full ring-2 ring-primary/20">
                <Image
                  src={user.avatar}
                  alt={user.name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xl">
                {initials}
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{user.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <RoleBadge roleId={user.roleId} />
                <Badge variant="outline" className="text-xs">
                  ID: {user.id}
                </Badge>
              </div>
            </div>
          </div>

          {/* User Details */}
          <div className="space-y-4">
            {/* Email */}
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                <Mail className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Email</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground truncate">
                    {user.email}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={handleCopyEmail}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                <Phone className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Phone</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground truncate">
                    {user.phone}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={handleCopyPhone}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Join Date */}
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Member Since</p>
                <p className="text-sm text-muted-foreground">{joinDate}</p>
              </div>
            </div>

            {/* Role */}
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Role</p>
                <p className="text-sm text-muted-foreground">
                  {getRoleLabel(user.roleId)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            variant="destructive"
            onClick={onDelete}
            disabled={!canDelete}
            title={!canDelete ? (isAdmin ? "Cannot delete admin users" : "Cannot delete yourself") : undefined}
          >
            <Trash2 className="h-4 w-4" />
            Delete User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ViewUserDialog;
