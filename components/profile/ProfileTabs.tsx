"use client";

import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export type ProfileTab = "overview" | "addresses" | "security";

interface ProfileTabsProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  className?: string;
}

export function ProfileTabs({
  activeTab,
  onTabChange,
  className,
}: ProfileTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as ProfileTab)}>
      <TabsList className={cn("grid w-full max-w-md grid-cols-3 h-10", className)}>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="addresses">Addresses</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

export default ProfileTabs;
