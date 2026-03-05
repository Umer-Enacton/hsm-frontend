"use client";

import React from "react";
import Image from "next/image";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getUserInitials } from "@/lib/user-api";
import { RoleBadge } from "./RoleBadge";
import type { AppUser } from "@/types/user";

interface UserListItemProps {
  user: AppUser;
  onView: (user: AppUser) => void;
  onDelete: (user: AppUser) => void;
  currentUserId?: number; // Current logged-in admin user ID
  className?: string;
}

export function UserListItem({
  user,
  onView,
  onDelete,
  currentUserId,
  className,
}: UserListItemProps) {
  const handleDelete = () => {
    onDelete(user);
  };

  const handleView = () => {
    onView(user);
  };

  const initials = getUserInitials(user.name);
  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString()
    : "N/A";

  // Prevent deletion of admins or self
  const isAdmin = user.roleId === 3;
  const isSelf = user.id === currentUserId;
  const canDelete = !isAdmin && !isSelf;

  return (
    <TableRow className={cn("group", className)}>
      {/* Avatar, Name & Email */}
      <TableCell>
        <div className="flex items-center gap-3">
          {user.avatar ? (
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full ring-2 ring-primary/20">
              <Image
                src={user.avatar}
                alt={user.name}
                fill
                className="object-cover"
                sizes="36px"
              />
            </div>
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </div>
      </TableCell>

      {/* Role */}
      <TableCell>
        <RoleBadge roleId={user.roleId} />
      </TableCell>

      {/* Phone */}
      <TableCell>
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {user.phone}
        </span>
      </TableCell>

      {/* Join Date */}
      <TableCell>
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {joinDate}
        </span>
      </TableCell>

      {/* Actions */}
      <TableCell>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleView}
            className="h-8 w-8 p-0"
          >
            <Eye className="h-4 w-4" />
            <span className="sr-only">View {user.name}</span>
          </Button>
          {/* <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={!canDelete}
            className={canDelete
              ? "h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              : "h-8 w-8 p-0"}
            title={!canDelete ? (isAdmin ? "Cannot delete admin users" : "Cannot delete yourself") : undefined}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete {user.name}</span>
          </Button> */}
        </div>
      </TableCell>
    </TableRow>
  );
}

export default UserListItem;
