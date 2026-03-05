"use client";

import React from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Trash2, Mail, Phone, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { getUserInitials } from "@/lib/user-api";
import { RoleBadge } from "@/components/admin/shared";
import type { AppUser } from "@/types/user";

interface UserCardProps {
  user: AppUser;
  onView: (user: AppUser) => void;
  onDelete: (user: AppUser) => void;
  currentUserId?: number; // Current logged-in admin user ID
  className?: string;
}

export function UserCard({
  user,
  onView,
  onDelete,
  currentUserId,
  className,
}: UserCardProps) {
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
    <Card className={cn("hover:shadow-md transition-shadow p-2", className)}>
      <CardContent className="p-4 space-y-3">
        {/* Header with avatar and name */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
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
              <h3 className="font-semibold text-base leading-tight line-clamp-1">
                {user.name}
              </h3>
            </div>
          </div>
          <RoleBadge
            role={
              user.roleId === 3
                ? "admin"
                : user.roleId === 2
                  ? "provider"
                  : "customer"
            }
          />
        </div>

        {/* Details */}
        <div className="space-y-1.5 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-1">{user.email}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-1">{user.phone || "N/A"}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>Joined {joinDate}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            size="sm"
            variant="outline"
            onClick={handleView}
            className="flex-1"
          >
            <Eye className="h-3.5 w-3.5 mr-1" />
            View
          </Button>
          {/* <Button
            size="sm"
            variant="outline"
            onClick={handleDelete}
            disabled={!canDelete}
            className={cn(
              "flex-1",
              canDelete &&
                "text-destructive hover:text-destructive hover:bg-destructive/10",
            )}
            title={
              !canDelete
                ? isAdmin
                  ? "Cannot delete admin users"
                  : "Cannot delete yourself"
                : undefined
            }
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Delete
          </Button> */}
        </div>
      </CardContent>
    </Card>
  );
}

export default UserCard;
