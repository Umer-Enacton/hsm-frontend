"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { User, Settings, Shield, MapPin } from "lucide-react";

export type ProfileTab = "overview" | "edit" | "security" | "addresses";

interface ProfileTabsProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  className?: string;
  showAddressesTab?: boolean;
}

const allTabs = [
  { id: "overview" as ProfileTab, label: "Overview", icon: User },
  { id: "edit" as ProfileTab, label: "Edit Profile", icon: Settings },
  { id: "security" as ProfileTab, label: "Security", icon: Shield },
  { id: "addresses" as ProfileTab, label: "Addresses", icon: MapPin },
];

export function ProfileTabs({
  activeTab,
  onTabChange,
  className,
  showAddressesTab = false,
}: ProfileTabsProps) {
  // Filter tabs based on showAddressesTab prop
  const tabs = showAddressesTab
    ? allTabs
    : allTabs.filter(tab => tab.id !== "addresses");

  return (
    <div className={cn("flex items-center gap-2 border-b", className)}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <Button
            key={tab.id}
            variant="ghost"
            size="sm"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "gap-2 rounded-none border-b-2 h-11 px-4",
              isActive
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
          </Button>
        );
      })}
    </div>
  );
}

export default ProfileTabs;
