"use client";

import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export type ProfileTab = "overview" | "addresses" | "security";

interface ProfileTabsProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  className?: string;
  showAddresses?: boolean; // If false, don't show addresses tab (for admin/provider)
}

export function ProfileTabs({
  activeTab,
  onTabChange,
  className,
  showAddresses = true,
}: ProfileTabsProps) {
  // Admin and Provider don't need addresses tab
  const tabs = showAddresses
    ? ["overview", "addresses", "security"] as ProfileTab[]
    : ["overview", "security"] as ProfileTab[];

  return (
    <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as ProfileTab)}>
      <TabsList className={cn(
        "grid w-full max-w-md h-10",
        showAddresses ? "grid-cols-3" : "grid-cols-2",
        className
      )}>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        {showAddresses && (
          <TabsTrigger value="addresses" data-tour-address-tab>
            Addresses
          </TabsTrigger>
        )}
        <TabsTrigger value="security">Security</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

export default ProfileTabs;
