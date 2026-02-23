"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Mail,
  Lock,
  Phone,
  User,
  Building2,
  Loader2,
  Eye,
  EyeOff,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/api";
import type { RegisterResponse, UserRole } from "@/types/auth";

interface FormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

const RegisterPage = () => {
  const router = useRouter();
  const [userType, setUserType] = useState<"customer" | "provider">("customer");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, label: "" };
    if (password.length < 6) return { strength: 1, label: "Weak" };
    if (password.length < 10) return { strength: 2, label: "Fair" };
    if (password.length < 12) return { strength: 3, label: "Good" };
    return { strength: 4, label: "Strong" };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  // Validation helpers
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const validateName = (name: string) => {
    return name.trim().length >= 3 && name.trim().length <= 50;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validation
    if (!validateName(formData.name)) {
      toast.error("Name must be between 3 and 50 characters");
      setIsLoading(false);
      return;
    }

    if (!validateEmail(formData.email)) {
      toast.error("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    if (!validatePhone(formData.phone)) {
      toast.error("Phone number must be 10 digits starting with 6-9");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (!formData.agreeToTerms) {
      toast.error("Please agree to the Terms & Conditions");
      setIsLoading(false);
      return;
    }

    try {
      const roleId: UserRole = userType === "provider" ? 2 : 1;

      const response = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone,
          password: formData.password,
          roleId,
        }),
      });

      const data: RegisterResponse = await response.json();

      if (!response.ok) {
        // Handle validation errors
        if (data.errors && Array.isArray(data.errors)) {
          throw new Error(data.errors.join(", "));
        }
        throw new Error(data.message || "Registration failed");
      }

      toast.success(
        `Account created successfully as ${userType === "provider" ? "Provider" : "Customer"}! Redirecting to login...`,
      );

      // Redirect to login page after 2 seconds
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      toast.error(err.message || "An error occurred during registration");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            {userType === "provider" ? (
              <Building2 className="w-8 h-8 text-primary-foreground" />
            ) : (
              <User className="w-8 h-8 text-primary-foreground" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-600 mt-2">
            Join our home service platform today
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>
              Choose your account type to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Role Tabs */}
            <Tabs
              value={userType}
              onValueChange={(v) => setUserType(v as "customer" | "provider")}
              className="w-full mb-6"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="customer" disabled={isLoading}>
                  <User className="w-4 h-4 mr-2" />
                  Customer
                </TabsTrigger>
                <TabsTrigger value="provider" disabled={isLoading}>
                  <Building2 className="w-4 h-4 mr-2" />
                  Provider
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />

                  <Input
                    id="name"
                    placeholder={"John Doe"}
                    className="pl-10"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        name: e.target.value,
                      })
                    }
                    disabled={isLoading}
                  />
                </div>
                <p className="text-xs text-gray-500">Enter your full name</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="9876543210"
                    className="pl-10"
                    maxLength={10}
                    value={formData.phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      setFormData({ ...formData, phone: value });
                    }}
                    disabled={isLoading}
                  />
                  {formData.phone.length === 10 &&
                    validatePhone(formData.phone) && (
                      <Check className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                    )}
                  {formData.phone.length === 10 &&
                    !validatePhone(formData.phone) && (
                      <X className="absolute right-3 top-3 h-4 w-4 text-red-500" />
                    )}
                </div>
                <p className="text-xs text-gray-500">
                  10 digits starting with 6-9 (Indian format)
                </p>
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
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    disabled={isLoading}
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
                {formData.password && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            passwordStrength.strength === 1
                              ? "w-1/4 bg-red-500"
                              : passwordStrength.strength === 2
                                ? "w-2/4 bg-yellow-500"
                                : passwordStrength.strength === 3
                                  ? "w-3/4 bg-blue-500"
                                  : "w-full bg-green-500"
                          }`}
                        />
                      </div>
                      <span className="text-xs text-gray-600">
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Must be at least 6 characters
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {formData.confirmPassword && (
                  <div className="flex items-center gap-1 text-xs">
                    {formData.password === formData.confirmPassword ? (
                      <>
                        <Check className="h-3 w-3 text-green-500" />
                        <span className="text-green-600">Passwords match</span>
                      </>
                    ) : (
                      <>
                        <X className="h-3 w-3 text-red-500" />
                        <span className="text-red-600">
                          Passwords do not match
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      agreeToTerms: checked as boolean,
                    })
                  }
                  disabled={isLoading}
                />
                <label
                  htmlFor="terms"
                  className="text-sm text-gray-600 cursor-pointer"
                >
                  I agree to the{" "}
                  <Link href="/terms" className="text-primary hover:underline">
                    Terms & Conditions
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="text-primary hover:underline"
                  >
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  `Create ${userType === "provider" ? "Provider" : "Customer"} Account`
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <p className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-primary font-semibold hover:underline"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
