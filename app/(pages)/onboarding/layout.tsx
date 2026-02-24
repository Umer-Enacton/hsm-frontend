"use client";

// app/(pages)/provider/onboarding/layout.tsx
// Simple layout for onboarding without sidebar
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  isAuthenticated,
  getUserData,
} from "@/lib/auth-utils";
import { UserRole } from "@/types/auth";
import { getProviderBusiness } from "@/lib/provider/api";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
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

        // Check if provider already has a business profile
        try {
          const business = await getProviderBusiness(userData.id);

          // If business exists, redirect to dashboard
          if (business) {
            console.log("Business profile already exists, redirecting to dashboard");
            router.push("/provider/dashboard");
            return;
          }
        } catch (businessError) {
          console.log("No business profile found, continuing onboarding");
        }

        setIsLoading(false);
      } catch (err) {
        console.error("Error in onboarding layout:", err);
        setError("Authentication error");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    };

    checkAuth();
  }, [router]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background">
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive">{error}</p>
          <p className="text-sm text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Return children without sidebar/header - just the onboarding wizard
  return <>{children}</>;
}
