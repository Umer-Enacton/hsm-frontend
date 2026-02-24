"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { OnboardingWizard } from "@/components/provider/onboarding/OnboardingWizard";
import { OnboardingStage } from "@/types/provider";
import { getUserData } from "@/lib/auth-utils";
import { getProviderBusiness } from "@/lib/provider/api";
import { completeOnboarding } from "@/lib/provider/api";
import { toast } from "sonner";
import type { OnboardingData } from "@/types/provider";

export default function OnboardingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [existingData, setExistingData] = useState<Partial<OnboardingData> | undefined>(undefined);

  useEffect(() => {
    const checkExistingData = async () => {
      try {
        const userData = getUserData();
        if (!userData) {
          router.push("/login");
          return;
        }

        // Check if there's existing business data
        const business = await getProviderBusiness(userData.id);

        if (business) {
          // Pre-fill with existing data
          setExistingData({
            businessProfile: {
              name: business.name || "",
              description: business.description || "",
              categoryId: 0, // Will need to be mapped from category name
              category: business.category || "",
              phone: business.phone || "",
              email: business.email || business.email || "",
              address: business.address || "",
              website: business.website || "",
            },
          });
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error checking existing data:", error);
        setIsLoading(false);
      }
    };

    checkExistingData();
  }, [router]);

  const handleOnboardingComplete = async (data: OnboardingData) => {
    try {
      console.log("Completing onboarding with data:", data);
      const result = await completeOnboarding(data);

      toast.success("Setup completed successfully!", {
        description: "Your business profile is now active.",
      });

      // Redirect to dashboard
      setTimeout(() => {
        router.push("/provider/dashboard");
      }, 1500);
    } catch (error: any) {
      console.error("Error completing onboarding:", error);
      toast.error("Failed to complete setup", {
        description: error.message || "Please try again.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Preparing onboarding...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome to HSM Provider Portal
          </h1>
          <p className="text-muted-foreground mt-2">
            Let's set up your business profile in just a few steps
          </p>
        </div>

        {/* Onboarding Wizard */}
        <OnboardingWizard
          initialStage={OnboardingStage.BUSINESS_PROFILE}
          existingData={existingData}
          onComplete={handleOnboardingComplete}
          onCancel={() => router.push("/login")}
        />
      </div>
    </div>
  );
}
