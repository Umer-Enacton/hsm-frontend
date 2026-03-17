"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ProfileHeader,
  ProfileTabs,
  ProfileOverview,
  EditProfileModal,
  PasswordChangeForm,
  type ProfileTab,
} from "@/components/profile";
import { isAuthenticated } from "@/lib/auth-utils";
import type { User } from "@/types/auth";
import { useProfile, useUpdateProfile, useUploadAvatar } from "@/lib/queries";
import { ProviderProfileSkeleton } from "@/components/provider/skeletons";

export default function ProviderProfilePage() {
  const router = useRouter();
  const { data: user, isLoading, error } = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const uploadAvatarMutation = useUploadAvatar();
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Check auth on mount
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    }
  }, [router]);

  const handleProfileUpdate = (updatedUser: User) => {
    setIsEditModalOpen(false);
    // Profile is automatically updated by React Query mutation
  };

  if (isLoading) {
    return <ProviderProfileSkeleton />;
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive mb-2">
            Failed to load profile
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
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
      </div>

      {/* Profile Header */}
      <ProfileHeader user={user} />

      {/* Tabs */}
      <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} showAddresses={false} />

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "overview" && (
          <ProfileOverview user={user} onEditClick={() => setIsEditModalOpen(true)} />
        )}
        {activeTab === "security" && <PasswordChangeForm />}
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        user={user}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onUpdate={handleProfileUpdate}
        updateProfileMutation={updateProfileMutation}
        uploadAvatarMutation={uploadAvatarMutation}
      />
    </div>
  );
}
