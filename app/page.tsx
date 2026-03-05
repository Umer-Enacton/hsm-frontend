"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { isAuthenticated, getUserRole } from "@/lib/auth-utils";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check authentication status
    const authStatus = isAuthenticated();
    const userRole = getUserRole();

    if (authStatus && userRole) {
      // Redirect to appropriate dashboard based on role
      switch (userRole) {
        case 1: // Customer
          router.replace("/customer/home");
          break;
        case 2: // Provider
          router.replace("/provider/dashboard");
          break;
        case 3: // Admin
          router.replace("/admin/dashboard");
          break;
        default:
          router.replace("/login");
      }
    } else {
      // Redirect to login if not authenticated
      router.replace("/login");
    }
  }, [router]);

  // Show loading spinner while redirecting
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}
