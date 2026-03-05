"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getUserData, isAuthenticated } from "@/lib/auth-utils";
import { getCurrentProfile } from "@/lib/profile-api";
import {
  ProfileHeader,
  ProfileTabs,
  ProfileOverview,
  ProfileEditForm,
  PasswordChangeForm,
  type ProfileTab,
} from "@/components/profile";
import type { User } from "@/types/auth";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check auth and load user on mount
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadProfile();
  }, [router]);

  const loadProfile = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getCurrentProfile();
      setUser(data);
    } catch (err: any) {
      setError(err.message || "Failed to load profile");
      toast.error(err.message || "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadProfile();
    setIsRefreshing(false);
    toast.success("Profile refreshed");
  };

  const handleProfileUpdate = (updatedUser: User) => {
    setUser(updatedUser);
    setActiveTab("overview");
    // Emit custom event to notify layout to refresh user data
    window.dispatchEvent(new CustomEvent('profile-updated'));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive mb-2">
            Failed to load profile
          </p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadProfile} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="icon"
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Profile Header */}
      <ProfileHeader user={user} />

      {/* Tabs */}
      <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "overview" && (
          <ProfileOverview user={user} onEditClick={() => setActiveTab("edit")} />
        )}
        {activeTab === "edit" && (
          <ProfileEditForm
            user={user}
            onUpdate={handleProfileUpdate}
            onCancel={() => setActiveTab("overview")}
          />
        )}
        {activeTab === "security" && <PasswordChangeForm />}
      </div>
    </div>
  );
}
