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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getUserData, isAuthenticated, handleLogout } from "@/lib/auth-utils";
import { getCurrentProfile } from "@/lib/profile-api";
import { UserRole, type User } from "@/types/auth";

// Navigation items for the admin sidebar
const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Businesses", href: "/admin/business", icon: Briefcase },
  { label: "Services", href: "/admin/services", icon: Wrench },
  { label: "Categories", href: "/admin/categories", icon: LayoutTemplate },
  { label: "Users", href: "/admin/users", icon: Users },
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Check if user is authenticated
        if (!isAuthenticated()) {
          console.log("Not authenticated, redirecting to login");
          router.push("/login");
          return;
        }

        // Get user data from token
        const userData = getUserData();
        console.log("User data from token:", userData);

        if (!userData) {
          console.log("No user data found, redirecting to login");
          router.push("/login");
          return;
        }

        // Check if user has admin role
        if (userData.roleId !== UserRole.ADMIN) {
          console.log("Not an admin user, roleId:", userData.roleId);
          setError("Access denied: Admin access required");
          setTimeout(() => {
            router.push("/unauthorized");
          }, 2000);
          return;
        }

        // Fetch full user profile from backend (includes avatar)
        try {
          const userProfile = await getCurrentProfile();
          console.log("Fetched user profile:", userProfile);
          setUser(userProfile);
        } catch (profileError) {
          console.error(
            "Failed to fetch profile, using token data:",
            profileError,
          );
          // Fallback to token data if profile fetch fails
          setUser({
            id: userData.id,
            name:
              userData.name || userData.email?.split("@")[0] || "Admin User",
            email: userData.email || "admin@hsm.com",
            phone: "",
            roleId: userData.roleId,
            avatar: null,
          });
        }

        setIsLoading(false);
      } catch (err) {
        console.error("Error in admin layout:", err);
        setError("Authentication error");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    };

    loadUserData();

    // Listen for profile update events
    const handleProfileUpdate = () => {
      console.log("Profile updated event received, refreshing user data");
      loadUserData();
    };

    window.addEventListener("profile-updated", handleProfileUpdate);

    return () => {
      window.removeEventListener("profile-updated", handleProfileUpdate);
    };
  }, [router]);

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

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive">{error}</p>
          <p className="text-sm text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      sidebar={{
        navItems,
        appName: "HSM Admin",
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
        onLogout,
        showSearch: true,
        searchPlaceholder: "Search admin...",
      }}
    >
      {children}
    </DashboardLayout>
  );
}
