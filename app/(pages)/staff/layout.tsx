"use client";

// app/(pages)/staff/layout.tsx - Staff Dashboard Layout
import { DashboardLayout } from "@/components/common";
import {
  LayoutDashboard,
  Clock,
  DollarSign,
  Calendar,
  User,
  LogOut,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { handleLogout, getUserData } from "@/lib/auth-utils";
import { api, API_ENDPOINTS } from "@/lib/api";

// Navigation items for the staff sidebar
const navItems = [
  { label: "Dashboard", href: "/staff/dashboard", icon: LayoutDashboard },
  { label: "My Bookings", href: "/staff/bookings", icon: Clock },
  { label: "Earnings", href: "/staff/earnings", icon: DollarSign },
  { label: "Payment Details", href: "/staff/payment-details", icon: Wallet },
  { label: "Leave", href: "/staff/leave", icon: Calendar },
  { label: "Profile", href: "/staff/profile", icon: User },
];

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Get user data from token (middleware already verified auth)
        const userData = getUserData();
        if (!userData) {
          setIsLoading(false);
          return;
        }

        // Fetch staff profile
        try {
          const staffResponse = await api.get<{
            message: string;
            data: {
              userId: number;
              businessProfileId: number;
              employeeId: string;
              status: string;
              skills: string;
              name: string;
              email: string;
              phone: string;
              avatar: string;
            };
          }>("/staff/me");

          if (staffResponse.data) {
            setUser({
              id: userData.id,
              name: staffResponse.data.name || userData.name,
              email: staffResponse.data.email || userData.email,
              phone: staffResponse.data.phone || userData.phone,
              roleId: userData.roleId,
              avatar: staffResponse.data.avatar || null,
              employeeId: staffResponse.data.employeeId,
              status: staffResponse.data.status,
            });
          } else {
            setUser({
              id: userData.id,
              name: userData.name || userData.email?.split("@")[0] || "Staff",
              email: userData.email || "staff@hsm.com",
              phone: userData.phone || "",
              roleId: userData.roleId,
              avatar: null,
            });
          }
        } catch (profileError) {
          console.error(
            "Failed to fetch staff profile, using token data:",
            profileError,
          );
          setUser({
            id: userData.id,
            name: userData.name || userData.email?.split("@")[0] || "Staff",
            email: userData.email || "staff@hsm.com",
            phone: userData.phone || "",
            roleId: userData.roleId,
            avatar: null,
          });
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error in staff layout:", error);
        setIsLoading(false);
      }
    };

    loadUserData();

    // Listen for profile update events
    const handleProfileUpdate = () => {
      loadUserData();
    };

    window.addEventListener("profile-updated", handleProfileUpdate);

    return () => {
      window.removeEventListener("profile-updated", handleProfileUpdate);
    };
  }, []);

  const onLogout = async () => {
    try {
      await handleLogout("/login");
    } catch (error) {
      console.error("Logout error:", error);
      router.push("/login");
    }
  };

  const onProfileClick = () => {
    router.push("/staff/profile");
  };

  // Show loading state while loading
  if (isLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <DashboardLayout
        sidebar={{
          navItems,
          appName: "HomeFixCare",
        }}
        header={
          user
            ? {
                user: {
                  name: user.name,
                  email: user.email,
                  avatarUrl: user.avatar || undefined,
                  role: "Staff Member",
                },
                onLogout: onLogout,
                showSearch: false,
              }
            : undefined
        }
        footer={{
          appName: "HomeFixCare",
          links: [
            { label: "Privacy Policy", href: "/staff/privacy" },
            { label: "Terms & Conditions", href: "/staff/terms" },
          ],
        }}
        showFooter={true}
      >
        {children}
      </DashboardLayout>
    </>
  );
}
