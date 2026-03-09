"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Phone, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { updatePhoneForOAuthUser } from "@/lib/googleAuth";
import { isAuthenticated } from "@/lib/auth-utils";

function PhoneCollectionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const redirectPath = searchParams.get("redirect") || "/";

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      toast.error("Please login first");
      router.push("/login");
    }
  }, [router]);

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone) {
      toast.error("Please enter your phone number");
      return;
    }

    if (!validatePhone(phone)) {
      toast.error("Phone number must be 10 digits starting with 6-9");
      return;
    }

    setIsLoading(true);
    try {
      await updatePhoneForOAuthUser(phone);
      toast.success("Phone number added successfully!");
      setTimeout(() => {
        router.push(redirectPath);
      }, 1000);
    } catch (error: any) {
      toast.error(error.message || "Failed to add phone number");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full mb-4">
            <Phone className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Almost There!</h1>
          <p className="text-gray-600 mt-2">
            We need your phone number to complete your account setup
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Add Phone Number</CardTitle>
            <CardDescription>
              This helps us send you important updates about your bookings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="9876543210"
                    className="pl-10 pr-10"
                    value={phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      setPhone(value);
                    }}
                    disabled={isLoading}
                    maxLength={10}
                    autoFocus
                    required
                  />
                  {phone.length === 10 && (
                    <>
                      {validatePhone(phone) ? (
                        <Check className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                      ) : (
                        <X className="absolute right-3 top-3 h-4 w-4 text-red-500" />
                      )}
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  10 digits starting with 6-9 (Indian format)
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function CollectPhonePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <PhoneCollectionForm />
    </Suspense>
  );
}
