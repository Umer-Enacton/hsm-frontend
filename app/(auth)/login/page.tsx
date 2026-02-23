"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail, Lock, Loader2, Building2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/api";
import { storeAuthData, redirectBasedOnRole } from "@/lib/auth-utils";
import type { LoginResponse } from "@/types/auth";
import { UserRole } from "@/types/auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Client-side validation
    if (!loginData.email.trim()) {
      toast.error("Please enter your email address");
      setIsLoading(false);
      return;
    }

    if (!validateEmail(loginData.email)) {
      toast.error("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    if (!loginData.password) {
      toast.error("Please enter your password");
      setIsLoading(false);
      return;
    }

    if (loginData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: loginData.email.trim().toLowerCase(),
          password: loginData.password,
        }),
      });

      const data: LoginResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid email or password");
      }

      toast.success("Login successful! Redirecting...");

      // Store token and user data using auth utilities
      storeAuthData(data.token, data.user, rememberMe);

      // Store remembered email separately
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", loginData.email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      // Redirect based on user role or to specified redirect URL
      setTimeout(() => {
        const redirectTo = searchParams.get("redirect");

        if (redirectTo) {
          // If there's a redirect URL, use it
          router.push(redirectTo);
        } else {
          // Otherwise, redirect based on user role from API response
          // Use the roleId from the response directly
          const roleRedirectMap: Record<UserRole, string> = {
            [UserRole.CUSTOMER]: "/customer/home",
            [UserRole.PROVIDER]: "/provider/dashboard",
            [UserRole.ADMIN]: "/admin/dashboard",
          };

          const redirectPath = roleRedirectMap[data.user.roleId] || "/";
          console.log("Redirecting to:", redirectPath, "for roleId:", data.user.roleId);
          router.push(redirectPath);
        }
      }, 1000);
    } catch (err: any) {
      toast.error(err.message || "An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  // Load remembered email on mount
  React.useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    if (rememberedEmail) {
      setLoginData((prev) => ({ ...prev, email: rememberedEmail }));
      setRememberMe(true);
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <Building2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10"
                    value={loginData.email}
                    onChange={(e) =>
                      setLoginData({ ...loginData, email: e.target.value })
                    }
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    value={loginData.password}
                    onChange={(e) =>
                      setLoginData({ ...loginData, password: e.target.value })
                    }
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-gray-600">Remember me</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <p className="text-center text-sm text-gray-600">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="text-primary font-semibold hover:underline"
              >
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>By signing in, you agree to our</p>
          <div className="flex justify-center gap-2 mt-1">
            <Link href="/terms" className="hover:underline">
              Terms of Service
            </Link>
            <span>&</span>
            <Link href="/privacy" className="hover:underline">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading fallback for Suspense
function LoginFormFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <Building2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFormFallback />}>
      <LoginForm />
    </Suspense>
  );
}
