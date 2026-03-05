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
import { getApiBaseUrl, getAuthHeaders } from "@/lib/api";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
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

        // Fetch full user profile from backend to get avatar
        try {
          const apiUrl = getApiBaseUrl();
          const response = await fetch(`${apiUrl}/user/profile`, {
            method: "GET",
            credentials: "include",
            headers: getAuthHeaders(),
          });

          if (response.ok) {
            const profileData = await response.json();
            const fullUserData = profileData.user;

            setUser({
              id: fullUserData.id,
              name: fullUserData.name || userData.email?.split("@")[0] || "Customer",
              email: fullUserData.email || userData.email || "customer@hsm.com",
              phone: fullUserData.phone || "",
              roleId: fullUserData.roleId || userData.roleId,
              avatar: fullUserData.avatar || null,
            });
          } else {
            // Fallback to token data if profile fetch fails
            setUser({
              id: userData.id,
              name: userData.name || userData.email?.split("@")[0] || "Customer",
              email: userData.email || "customer@hsm.com",
              phone: "",
              roleId: userData.roleId,
              avatar: null,
            });
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          // Fallback to token data if profile fetch fails
          setUser({
            id: userData.id,
            name: userData.name || userData.email?.split("@")[0] || "Customer",
            email: userData.email || "customer@hsm.com",
            phone: "",
            roleId: userData.roleId,
            avatar: null,
          });
        }

        setIsLoading(false);
      } catch (err) {
        console.error("Error in customer layout:", err);
        setError("Authentication error");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    };

    loadUserData();
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
    router.push("/customer/profile");
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
    <div className="min-h-screen bg-background">
      <CustomerHeader
        user={user ? {
          name: user.name,
          email: user.email,
          avatarUrl: user.avatar || undefined,
          role: "Customer",
        } : undefined}
        onProfileClick={onProfileClick}
        onLogout={onLogout}
        showSearch={true}
      />
      <main className="container max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
