"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { handleGoogleCallback } from "@/lib/googleAuth";
import { storeAuthData, redirectBasedOnRole } from "@/lib/auth-utils";
import { UserRole } from "@/types/auth";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processCallback = async () => {
      try {
        const code = searchParams.get("code");
        const state = searchParams.get("state");

        if (!code || !state) {
          toast.error("Invalid OAuth callback");
          router.push("/login");
          return;
        }

        // Exchange code for user info
        const response = await handleGoogleCallback(code, state);

        toast.success("Login successful!");

        // Store auth data
        storeAuthData(
          response.token,
          response.user,
          true // Remember me for OAuth users
        );

        // Check if user needs to provide phone number
        if (response.needsPhone) {
          // Store the redirect target for after phone collection
          const roleRedirectMap: Record<UserRole, string> = {
            [UserRole.CUSTOMER]: "/customer",
            [UserRole.PROVIDER]: "/onboarding",
            [UserRole.ADMIN]: "/admin/dashboard",
            [UserRole.STAFF]: "/staff/dashboard",
          };

          const targetPath = roleRedirectMap[response.user.roleId as UserRole] || "/";
          router.push(`/auth/collect-phone?redirect=${encodeURIComponent(targetPath)}`);
          return;
        }

        // Redirect based on role
        setTimeout(() => {
          const roleRedirectMap: Record<UserRole, string> = {
            [UserRole.CUSTOMER]: "/customer",
            [UserRole.PROVIDER]: "/provider/dashboard",
            [UserRole.ADMIN]: "/admin/dashboard",
            [UserRole.STAFF]: "/staff/dashboard",
          };

          const redirectPath = roleRedirectMap[response.user.roleId as UserRole] || "/";
          router.push(redirectPath);
        }, 500);
      } catch (error: any) {
        console.error("OAuth callback error:", error);
        toast.error(error.message || "Authentication failed");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } finally {
        setIsProcessing(false);
      }
    };

    processCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Signing you in...</h2>
        <p className="text-gray-600 mt-2">Please wait while we complete your authentication</p>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}
