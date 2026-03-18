"use client";

// app/(pages)/provider/layout.tsx
import { DashboardLayout } from "@/components/common";
import {
  LayoutDashboard,
  Briefcase,
  Clock,
  Calendar,
  MessageSquare,
  Star,
  CreditCard,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getUserData, isAuthenticated, handleLogout } from "@/lib/auth-utils";
import { getCurrentProfile } from "@/lib/profile-api";
import { UserRole, type User } from "@/types/auth";
import { getProviderBusiness } from "@/lib/provider/api";
import { api, API_ENDPOINTS } from "@/lib/api";
import { ProviderNotificationModal } from "@/components/provider/ProviderNotificationModal";
import { WarningModal, type WarningData } from "@/components/common/WarningModal";

// Navigation items for the provider sidebar
const navItems = [
  { label: "Dashboard", href: "/provider/dashboard", icon: LayoutDashboard },
  { label: "Business", href: "/provider/business", icon: Briefcase },
  { label: "Services", href: "/provider/services", icon: MessageSquare },
  { label: "Availability", href: "/provider/availability", icon: Calendar },
  { label: "Bookings", href: "/provider/bookings", icon: Clock },
  { label: "Reviews", href: "/provider/reviews", icon: Star },
  { label: "Payments", href: "/provider/payments", icon: CreditCard },
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
  const [warning, setWarning] = useState<WarningData | null>(null);

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
          console.error(
            "Failed to fetch profile, using token data:",
            profileError,
          );
          // Fallback to token data if profile fetch fails
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
        // Only redirect to onboarding if NO business exists
        if (!pathname?.includes("/onboarding") && !pathname?.includes("/payments")) {
          try {
            const businessData = await getProviderBusiness(userData.id);

            // If no business exists, redirect to onboarding
            if (!businessData) {
              console.log(
                "No business profile found, redirecting to onboarding",
              );
              router.push("/onboarding");
              return;
            }

            // Store business data for verification status
            setBusiness(businessData);

            // Business exists - continue to dashboard
            // Payment details check is now handled on the dashboard itself with a warning banner
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

    window.addEventListener("profile-updated", handleProfileUpdate);

    return () => {
      window.removeEventListener("profile-updated", handleProfileUpdate);
    };
  }, [router, pathname]);

  // Check for warnings (verification pending, payment details missing)
  useEffect(() => {
    if (!business) return;

    // Get dismissed warnings from localStorage
    const getDismissedWarnings = (): Set<string> => {
      if (typeof window === 'undefined') return new Set();
      const stored = localStorage.getItem('dismissed_warnings');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    };

    const dismissed = getDismissedWarnings();

    // Check 1: Business verification pending (only if not blocked)
    if (!business.isVerified && !business.isBlocked) {
      const warningKey = 'verification_pending';
      if (!dismissed.has(warningKey)) {
        setWarning({
          type: 'pending_verification',
          title: 'Verification Pending',
          message: 'Your business is pending verification from admin. You can add services, but cannot receive bookings until verified.',
          icon: 'shield',
        });
        return;
      }
    }

    // Check 2: Payment details missing (only if verified and not blocked)
    if (business.isVerified && !business.isBlocked && !business.hasPaymentDetails) {
      const warningKey = 'payment_details_pending';
      if (!dismissed.has(warningKey)) {
        setWarning({
          type: 'pending_payment',
          title: 'Payment Details Required',
          message: 'Add your payment details to receive payouts for completed bookings.',
          icon: 'credit',
          actionLabel: 'Add Payment Details',
          actionHref: '/provider/payments',
        });
        return;
      }
    }

    setWarning(null);
  }, [business]);

  const handleWarningDismiss = () => {
    if (!warning) return;

    // Save dismissed warning to localStorage
    if (typeof window !== 'undefined') {
      const dismissed = JSON.parse(localStorage.getItem('dismissed_warnings') || '[]');
      dismissed.push(warning.type);
      localStorage.setItem('dismissed_warnings', JSON.stringify(dismissed));
    }

    setWarning(null);
  };

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
          appName: "HSM Provider",
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
        }}
      >
        {children}
      </DashboardLayout>
      {/* Global notification modal for blocked business/deactivated services */}
      <ProviderNotificationModal />
      {/* Warning modal for verification pending/payment details */}
      {warning && <WarningModal warning={warning} onDismiss={handleWarningDismiss} />}
    </>
  );
}
