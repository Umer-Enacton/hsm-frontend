"use client";

import React from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Trash2, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { getUserInitials } from "@/lib/user-api";
import { RoleBadge } from "./RoleBadge";
import type { AppUser } from "@/types/user";

interface UserCardProps {
  user: AppUser;
  onView: (user: AppUser) => void;
  onDelete: (user: AppUser) => void;
  currentUserId?: number; // Current logged-in admin user ID
  className?: string;
}

export function UserCard({ user, onView, onDelete, currentUserId, className }: UserCardProps) {
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
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-200 hover:shadow-lg",
        "border-2 hover:border-primary/50",
        className,
      )}
    >
      <div className="p-4   space-y-2">
        {/* Header with avatar and name */}
        <div className="flex items-center gap-3 mb-4">
          {user.avatar ? (
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-primary/20">
              <Image
                src={user.avatar}
                alt={user.name}
                fill
                className="object-cover"
                sizes="40px"
              />
            </div>
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base leading-tight truncate group-hover:text-primary transition-colors mb-2">
              {user.name}
            </h3>
            <RoleBadge roleId={user.roleId} />
          </div>
        </div>

        {/* Email */}
        <p className="text-sm text-muted-foreground truncate">{user.email}</p>

        {/* Phone */}
        <p className="text-sm text-muted-foreground truncate">{user.phone}</p>

        {/* Join Date */}
        <p className="text-xs text-muted-foreground">Joined: {joinDate}</p>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleView}
            className="flex-1 h-8 text-xs"
          >
            <Eye className="h-3.5 w-3.5 mr-1" />
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={!canDelete}
            className={canDelete
              ? "flex-1 h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
              : "flex-1 h-8 text-xs"}
            title={!canDelete ? (isAdmin ? "Cannot delete admin users" : "Cannot delete yourself") : undefined}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default UserCard;
