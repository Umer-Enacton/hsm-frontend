"use client";

// app/(pages)/customer/layout.tsx
import { CustomerHeader } from "@/components/customer";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  getUserData,
  isAuthenticated,
  handleLogout,
} from "@/lib/auth-utils";
import { UserRole, type User } from "@/types/auth";
import { useProfile, useAddresses } from "@/lib/queries/use-profile";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use cached hooks for profile and addresses
  const {
    data: profileData,
    isLoading: profileLoading,
  } = useProfile();

  const {
    data: addresses = [],
  } = useAddresses();

  const hasAddresses = Array.isArray(addresses) && addresses.length > 0;

  useEffect(() => {
    const checkAuth = () => {
      // Check if user is authenticated
      if (!isAuthenticated()) {
        console.log("Not authenticated, redirecting to login");
        router.push("/login?redirect=" + encodeURIComponent(pathname));
        return;
      }

      // Get user data from token
      const userData = getUserData();
      console.log("User data from token:", userData);

      if (!userData) {
        console.log("No user data found, redirecting to login");
        router.push("/login?redirect=" + encodeURIComponent(pathname));
        return;
      }

      // Check if user has customer role
      if (userData.roleId !== UserRole.CUSTOMER) {
        console.log("Not a customer user, roleId:", userData.roleId);

        // Redirect to appropriate dashboard
        if (userData.roleId === UserRole.PROVIDER) {
          router.push("/provider");
        } else if (userData.roleId === UserRole.ADMIN) {
          router.push("/admin");
        }
        return;
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [router, pathname]);

  // Listen for profile updates and refetch user data
  useEffect(() => {
    const handleProfileUpdate = () => {
      console.log("🔄 Profile update event detected, refetching user data in layout");
      // The hooks will automatically refetch due to query invalidation
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
    router.push("/customer/profile");
  };

  // Build user object from profile data with token data as fallback
  // Note: profileData is the user object returned from getCurrentProfile
  const userDataFromToken = getUserData();
  const profileDataAny = profileData as any;
  const user: User | null = (profileData || userDataFromToken) ? {
    id: profileData?.id || profileDataAny?.user?.id || userDataFromToken?.id || 0,
    name: profileData?.name || profileDataAny?.user?.name || userDataFromToken?.name || userDataFromToken?.email?.split("@")[0] || "Customer",
    email: profileData?.email || profileDataAny?.user?.email || userDataFromToken?.email || "customer@hsm.com",
    phone: profileData?.phone || profileDataAny?.user?.phone || "",
    roleId: profileData?.roleId || profileDataAny?.user?.roleId || userDataFromToken?.roleId || UserRole.CUSTOMER,
    avatar: profileData?.avatar || profileDataAny?.user?.avatar || null,
  } : null;

  // Show loading state while checking auth
  if (isLoading || profileLoading) {
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
    <div className="min-h-screen bg-background">
      <CustomerHeader
        user={user ? {
          name: user.name,
          email: user.email,
          avatarUrl: user.avatar || undefined,
          role: "Customer",
          hasAddresses,
        } : undefined}
        onProfileClick={onProfileClick}
        onLogout={onLogout}
        showSearch={true}
      />
      <main className="container max-w-7xl mx-auto px-4 py-8">
        <div className="pb-24">{children}</div>
        {children}
      </main>
    </div>
  );
}
