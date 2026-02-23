"use client";

import React from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Calendar, Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { getUserInitials, getRoleLabel, getRoleColor } from "@/lib/user-api";
import type { User } from "@/types/auth";

interface ProfileHeaderProps {
  user: User;
  className?: string;
}

export function ProfileHeader({ user, className }: ProfileHeaderProps) {
  const initials = getUserInitials(user.name);
  const roleLabel = getRoleLabel(user.roleId);
  const roleColors = getRoleColor(user.roleId);
  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  return (
    <div className={cn("space-y-6", className)}>
      {/* Avatar and Basic Info */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        {/* Avatar */}
        <div className="relative group">
          {user.avatar ? (
            <div className="relative h-24 w-24 overflow-hidden rounded-full ring-4 ring-background shadow-lg">
              <Image
                src={user.avatar}
                alt={user.name}
                fill
                className="object-cover"
                sizes="96px"
              />
            </div>
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-3xl ring-4 ring-background shadow-lg">
              {initials}
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 text-center sm:text-left space-y-2">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">{user.name}</h1>
            <div className="flex flex-col sm:flex-row items-center gap-2 justify-center sm:justify-start">
              <Badge className={cn("text-xs", roleColors)}>{roleLabel}</Badge>
              <Badge variant="outline" className="text-xs">
                ID: {user.id}
              </Badge>
            </div>
          </div>

          {/* Contact Info */}
          <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Mail className="h-4 w-4" />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Phone className="h-4 w-4" />
              <span>{user.phone}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>Joined {joinDate}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfileHeader;
