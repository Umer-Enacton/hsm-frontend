"use client";

// app/(pages)/provider/layout.tsx
import { DashboardLayout } from "@/components/common";
import {
  LayoutDashboard,
  Briefcase,
  Clock,
  Calendar,
  CalendarClock,
  MessageSquare,
  Star,
  CreditCard,
  Crown,
  Users,
  Wallet,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getUserData, handleLogout } from "@/lib/auth-utils";
import { getCurrentProfile } from "@/lib/profile-api";
import { type User } from "@/types/auth";
import { getProviderBusiness } from "@/lib/provider/api";
import { api, API_ENDPOINTS } from "@/lib/api";
import { ProviderNotificationModal } from "@/components/provider/ProviderNotificationModal";

// Navigation items for the provider sidebar
const navItems = [
  { label: "Dashboard", href: "/provider/dashboard", icon: LayoutDashboard },
  { label: "Business", href: "/provider/business", icon: Briefcase },
  { label: "Services", href: "/provider/services", icon: MessageSquare },
  { label: "Availability", href: "/provider/availability", icon: Calendar },
  { label: "Bookings", href: "/provider/bookings", icon: Clock },
  { label: "Staff", href: "/provider/staff", icon: Users },
  {
    label: "Leave Management",
    href: "/provider/staff/leave",
    icon: CalendarClock,
  },
  { label: "Staff Payouts", href: "/provider/staff-payouts", icon: Wallet },
  { label: "Reviews", href: "/provider/reviews", icon: Star },
  { label: "Payments", href: "/provider/payments", icon: CreditCard },
  { label: "Subscription", href: "/provider/subscription", icon: Crown },
  // Profile removed from sidebar - accessible via Header user menu (same as admin)
];

export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // Function to fetch subscription plan
  const fetchSubscriptionPlan = async () => {
    try {
      const response = await api.get<{
        message: string;
        data: { planName?: string } | null;
      }>(API_ENDPOINTS.PROVIDER_SUBSCRIPTION_CURRENT);
      if (response?.data?.planName) {
        setPlanName(response.data.planName);
      }
    } catch (err) {
      console.error("Error fetching subscription plan:", err);
    }
  };
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [business, setBusiness] = useState<any>(null);
  const [planName, setPlanName] = useState<string | undefined>(undefined);

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
        try {
          const userProfile = await getCurrentProfile();
          setUser(userProfile);
        } catch (profileError) {
          console.error(
            "Failed to fetch profile, using token data:",
            profileError,
          );
          setUser({
            id: userData.id,
            name:
              userData.name || userData.email?.split("@")[0] || "Provider User",
            email: userData.email || "provider@hsm.com",
            phone: "",
            roleId: userData.roleId,
            avatar: null,
          });
        }

        // Check if provider has completed onboarding
        // Skip onboarding check if already on onboarding page or payments page
        if (
          !pathname?.includes("/onboarding") &&
          !pathname?.includes("/payments")
        ) {
          try {
            const businessData = await getProviderBusiness(userData.id);

            if (!businessData) {
              router.push("/onboarding");
              return;
            }

            setBusiness(businessData);
          } catch (businessError) {
            console.error("Error checking business profile:", businessError);
            router.push("/onboarding");
            return;
          }
        }

        setIsLoading(false);

        // Fetch subscription plan for badge
        fetchSubscriptionPlan();
      } catch (error) {
        console.error("Error in provider layout:", error);
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
    <>
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
                role: "Service Provider",
              }
            : undefined,
          onProfileClick,
          onLogout,
          showSearch: true,
          searchPlaceholder: "Search provider...",
          businessVerification: business?.isVerified ?? false,
          planName,
        }}
        footer={{
          appName: "HomeFixCare",
          links: [
            { label: "Privacy Policy", href: "/provider/privacy" },
            { label: "Terms & Conditions", href: "/provider/terms" },
          ],
        }}
        showFooter={true}
      >
        {children}
      </DashboardLayout>

      {/* Global Notification Modal */}
      <ProviderNotificationModal />
    </>
  );
}
