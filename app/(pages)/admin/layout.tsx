"use client";

// app/(pages)/admin/layout.tsx
import { DashboardLayout } from "@/components/common";
import {
  LayoutDashboard,
  LayoutTemplate,
  Users,
  Briefcase,
  Wrench,
  Calendar,
  Settings,
  CreditCard,
  DollarSign,
  Wallet,
  Loader2,
  Crown,
  Users2,
  Clock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getUserData, handleLogout } from "@/lib/auth-utils";
import { getCurrentProfile } from "@/lib/profile-api";
import { type User } from "@/types/auth";

// Navigation items for the admin sidebar
const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Businesses", href: "/admin/business", icon: Briefcase },
  { label: "Services", href: "/admin/services", icon: Wrench },
  { label: "Categories", href: "/admin/categories", icon: LayoutTemplate },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Bookings", href: "/admin/bookings", icon: Calendar },
  { label: "Revenue", href: "/admin/revenue", icon: DollarSign },
  { label: "Payments", href: "/admin/payments", icon: CreditCard },
  { label: "Payouts", href: "/admin/payouts", icon: Wallet },
  { label: "Plans", href: "/admin/subscriptions/plans", icon: Crown },
  {
    label: "Subscriptions",
    href: "/admin/subscriptions/providers",
    icon: Users2,
  },
  { label: "Schedule Jobs", href: "/admin/cron-jobs", icon: Clock },
  { label: "Settings", href: "/admin/settings", icon: Settings },
  // Profile removed from sidebar - accessible via Header user menu
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Get user data from token (middleware already verified auth)
        const userData = getUserData();
        if (!userData) {
          setIsLoading(false);
          return;
        }

        // Fetch full user profile from backend (includes avatar)
        // Note: Admin users may not have a profile endpoint, so we use token data directly
        const userProfile = await getCurrentProfile().catch(() => {
          console.log("Admin profile not available, using token data");
          return null;
        });

        if (userProfile) {
          setUser(userProfile);
        } else {
          // Use token data for admin users
          setUser({
            id: userData.id,
            name: userData.name || userData.email?.split("@")[0] || "Admin User",
            email: userData.email || "admin@hsm.com",
            phone: "",
            roleId: userData.roleId,
            avatar: null,
          });
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error in admin layout:", error);
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
      // Force redirect even if logout fails
      router.push("/login");
    }
  };

  const onProfileClick = () => {
    router.push("/admin/profile");
  };

  const onSettingsClick = () => {
    router.push("/admin/settings");
  };

  // Show loading state while loading user data
  if (isLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <DashboardLayout
      sidebar={{
        navItems,
        appName: "HomeFixCare",
      }}
      header={{
        user: user
          ? {
              name: user.name,
              email: user.email,
              avatarUrl: user.avatar || undefined,
              role: "Administrator",
            }
          : undefined,
        onProfileClick,
        onSettingsClick,
        onLogout,
        showSearch: true,
        searchPlaceholder: "Search admin...",
      }}
      footer={{
        appName: "HomeFixCare",
        links: [
          { label: "Privacy Policy", href: "/admin/privacy" },
          { label: "Terms & Conditions", href: "/admin/terms" },
        ],
      }}
      showFooter={true}
    >
      {children}
    </DashboardLayout>
  );
}
