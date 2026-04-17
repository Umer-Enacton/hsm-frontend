"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import type { User } from "@/types/auth";

interface ProfileOverviewProps {
  user: User;
  onEditClick: () => void;
  className?: string;
}

export function ProfileOverview({
  user,
  onEditClick,
  className,
}: ProfileOverviewProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Account Details Card */}
      <Card data-tour-profile-info="">
        <div className="p-6 py-2">
          <h3 className="text-lg font-semibold">Account Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Name</span>
              <span className="text-sm font-medium">{user.name}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="text-sm font-medium">{user.email}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-muted-foreground">Phone</span>
              <span className="text-sm font-medium">{user.phone}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">Role</span>
              <span className="text-sm font-medium capitalize">
                {user.roleId === 1
                  ? "Customer"
                  : user.roleId === 2
                    ? "Provider"
                    : "Admin"}
              </span>
            </div>
          </div>
          <Button
            onClick={onEditClick}
            className="w-full"
            variant="outline"
            data-tour-edit-profile-btn=""
          >
            <Settings className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default ProfileOverview;
