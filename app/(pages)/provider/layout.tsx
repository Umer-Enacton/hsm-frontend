"use client";

// app/(pages)/provider/layout.tsx
import { DashboardLayout } from "@/components/common";
import { LayoutDashboard, Briefcase, Clock, Calendar, MessageSquare, Star, Settings } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  getUserData,
  isAuthenticated,
  handleLogout,
} from "@/lib/auth-utils";
import { getCurrentProfile } from "@/lib/profile-api";
import { UserRole, type User } from "@/types/auth";
import { getProviderBusiness } from "@/lib/provider/api";

// Navigation items for the provider sidebar
const navItems = [
  { label: "Dashboard", href: "/provider/dashboard", icon: LayoutDashboard },
  { label: "Business", href: "/provider/business", icon: Briefcase },
  { label: "Services", href: "/provider/services", icon: Settings },
  { label: "Availability", href: "/provider/availability", icon: Calendar },
  { label: "Bookings", href: "/provider/bookings", icon: Clock },
  { label: "Reviews", href: "/provider/reviews", icon: MessageSquare },
  // Profile removed from sidebar - accessible via Header user menu (same as admin)
];

export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [business, setBusiness] = useState<any>(null);

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

        // Check if user has provider role
        if (userData.roleId !== UserRole.PROVIDER) {
          console.log("Not a provider user, roleId:", userData.roleId);
          setError("Access denied: Provider access required");
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
          console.error("Failed to fetch profile, using token data:", profileError);
          // Fallback to token data if profile fetch fails
          setUser({
            id: userData.id,
            name: userData.name || userData.email?.split("@")[0] || "Provider User",
            email: userData.email || "provider@hsm.com",
            phone: "",
            roleId: userData.roleId,
            avatar: null,
          });
        }

        // Check if provider has completed onboarding
        // Skip onboarding check if already on onboarding page
        if (!pathname?.includes("/onboarding")) {
          try {
            const businessData = await getProviderBusiness(userData.id);

            // If no business exists, redirect to onboarding
            if (!businessData) {
              console.log("No business profile found, redirecting to onboarding");
              router.push("/onboarding");
              return;
            }

            // Store business data for verification status
            setBusiness(businessData);

            // Business exists - continue to dashboard
            console.log("Business profile found, continuing to dashboard");
          } catch (businessError) {
            console.error("Error checking business profile:", businessError);
            // If error fetching business (404), redirect to onboarding
            router.push("/onboarding");
            return;
          }
        }

        setIsLoading(false);
      } catch (err) {
        console.error("Error in provider layout:", err);
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

    window.addEventListener('profile-updated', handleProfileUpdate);

    return () => {
      window.removeEventListener('profile-updated', handleProfileUpdate);
    };
  }, [router, pathname]);

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
    router.push("/provider/profile");
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
        appName: "HSM Provider",
      }}
      header={{
        user: user ? {
          name: user.name,
          email: user.email,
          avatarUrl: user.avatar || undefined,
          role: "Service Provider",
        } : undefined,
        onProfileClick,
        onLogout,
        showSearch: true,
        searchPlaceholder: "Search provider...",
        businessVerification: business?.isVerified ?? false,
      }}
    >
      {children}
    </DashboardLayout>
  );
}
