"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { getRoleLabel, getRoleColor } from "@/lib/user-api";

interface RoleBadgeProps {
  roleId: number;
  showLabel?: boolean;
  className?: string;
}

export function RoleBadge({
  roleId,
  showLabel = true,
  className,
}: RoleBadgeProps) {
  const label = getRoleLabel(roleId);
  const colors = getRoleColor(roleId);

  if (!showLabel) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        colors,
        className
      )}
    >
      {label}
    </span>
  );
}

export default RoleBadge;
