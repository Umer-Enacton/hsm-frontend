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
import { StaffProfileSkeleton } from "@/components/staff/skeletons";
import { api, API_ENDPOINTS } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, Calendar, Briefcase, IndianRupee } from "lucide-react";

interface StaffEarnings {
  totalEarnings: number;
  pendingPayout: number;
  totalPaid: number;
}

interface StaffWorkInfo {
  employeeId: string;
  businessName: string;
  joinDate: string;
  status: string;
}

export default function StaffProfilePage() {
  const router = useRouter();
  const { data: user, isLoading, error } = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const uploadAvatarMutation = useUploadAvatar();
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [earnings, setEarnings] = useState<StaffEarnings | null>(null);
  const [workInfo, setWorkInfo] = useState<StaffWorkInfo | null>(null);

  // Check auth on mount
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    }
  }, [router]);

  // Fetch staff-specific data
  useEffect(() => {
    const fetchStaffData = async () => {
      try {
        const response = await api.get<{ message: string; data: StaffEarnings & StaffWorkInfo }>(
          API_ENDPOINTS.STAFF_ME,
        );
        setEarnings({
          totalEarnings: response.data.totalEarnings,
          pendingPayout: response.data.pendingPayout,
          totalPaid: response.data.totalPaid,
        });
        setWorkInfo({
          employeeId: response.data.employeeId,
          businessName: response.data.businessName,
          joinDate: response.data.joinDate,
          status: response.data.status,
        });
      } catch (err) {
        console.error("Error fetching staff data:", err);
      }
    };
    if (user) {
      fetchStaffData();
    }
  }, [user]);

  const handleProfileUpdate = (updatedUser: User) => {
    setIsEditModalOpen(false);
    // Profile is automatically updated by React Query mutation
  };

  if (isLoading) {
    return <StaffProfileSkeleton />;
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
          <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>
      </div>

      {/* Profile Header */}
      <ProfileHeader user={user} />

      {/* Staff-Specific Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Earnings Summary */}
        {earnings && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Earnings Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Earnings</span>
                  <span className="font-semibold flex items-center gap-1">
                    <IndianRupee className="h-3 w-3" />
                    {(earnings.totalEarnings / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pending</span>
                  <span className="font-semibold text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                    <IndianRupee className="h-3 w-3" />
                    {(earnings.pendingPayout / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Paid</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <IndianRupee className="h-3 w-3" />
                    {(earnings.totalPaid / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Work Information */}
        {workInfo && (
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Work Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Employee ID</p>
                  <p className="font-medium text-sm">{workInfo.employeeId}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Business</p>
                  <div className="flex items-center gap-1">
                    <Briefcase className="h-3 w-3 text-muted-foreground" />
                    <p className="font-medium text-sm">{workInfo.businessName || "N/A"}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Join Date</p>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <p className="font-medium text-sm">
                      {new Date(workInfo.joinDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                <Badge
                  className={
                    workInfo.status === "active"
                      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                      : "bg-gray-100 text-gray-700 border-gray-200"
                  }
                >
                  {workInfo.status.replace("_", " ")}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

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
