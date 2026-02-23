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
      <Card>
        <div className="p-6 space-y-4">
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
                {user.roleId === 1 ? "Customer" : user.roleId === 2 ? "Provider" : "Admin"}
              </span>
            </div>
          </div>
          <Button onClick={onEditClick} className="w-full" variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="p-6">
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm text-muted-foreground mt-1">
              {user.roleId === 1 ? "Total Bookings" : user.roleId === 2 ? "Services Listed" : "Total Users"}
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm text-muted-foreground mt-1">
              {user.roleId === 1 ? "Completed" : user.roleId === 2 ? "Active Bookings" : "Total Categories"}
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <div className="text-2xl font-bold">0</div>
            <div className="text-sm text-muted-foreground mt-1">
              {user.roleId === 1 ? "Pending" : user.roleId === 2 ? "Total Reviews" : "Active Now"}
            </div>
          </div>
        </Card>
      </div>

      {/* Account Info */}
      <Card>
        <div className="p-6 space-y-2">
          <h3 className="text-lg font-semibold">Account Information</h3>
          <p className="text-sm text-muted-foreground">
            Manage your account settings and preferences. You can update your profile
            information, change your password, and manage your security settings.
          </p>
        </div>
      </Card>
    </div>
  );
}

export default ProfileOverview;
