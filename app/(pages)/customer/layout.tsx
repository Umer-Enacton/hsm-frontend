"use client";

// app/(pages)/customer/layout.tsx
import { CustomerHeader } from "@/components/customer";
import { Footer } from "@/components/common";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getUserData, handleLogout } from "@/lib/auth-utils";
import { type User } from "@/types/auth";
import { useProfile, useAddresses } from "@/lib/queries/use-profile";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Use cached hooks for profile and addresses
  const { data: profileData, isLoading: profileLoading } = useProfile();

  const { data: addresses = [] } = useAddresses();

  const hasAddresses = Array.isArray(addresses) && addresses.length > 0;

  useEffect(() => {
    const checkAuth = () => {
      // Get user data from token (middleware already verified auth)
      const userData = getUserData();
      if (userData) {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Listen for profile updates and refetch user data
  useEffect(() => {
    const handleProfileUpdate = () => {
      console.log(
        "🔄 Profile update event detected, refetching user data in layout",
      );
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
  const user: User | null =
    profileData || userDataFromToken
      ? {
          id:
            profileData?.id ||
            profileDataAny?.user?.id ||
            userDataFromToken?.id ||
            0,
          name:
            profileData?.name ||
            profileDataAny?.user?.name ||
            userDataFromToken?.name ||
            userDataFromToken?.email?.split("@")[0] ||
            "Customer",
          email:
            profileData?.email ||
            profileDataAny?.user?.email ||
            userDataFromToken?.email ||
            "customer@hsm.com",
          phone: profileData?.phone || profileDataAny?.user?.phone || "",
          roleId:
            profileData?.roleId ||
            profileDataAny?.user?.roleId ||
            userDataFromToken?.roleId ||
            1, // CUSTOMER
          avatar: profileData?.avatar || profileDataAny?.user?.avatar || null,
        }
      : null;

  // Show loading state while loading
  if (isLoading || profileLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <CustomerHeader
        user={
          user
            ? {
                name: user.name,
                email: user.email,
                avatarUrl: user.avatar || undefined,
                role: "Customer",
                hasAddresses,
              }
            : undefined
        }
        onProfileClick={onProfileClick}
        onLogout={onLogout}
        showSearch={true}
      />
      <main className="container max-w-7xl mx-auto px-4 py-8 flex-1">
        <div className="pb-24">{children}</div>
      </main>
      <Footer
        appName="HomeFixCare"
        links={[
          { label: "Privacy Policy", href: "/customer/privacy" },
          { label: "Terms & Conditions", href: "/customer/terms" },
        ]}
      />
    </div>
  );
}
