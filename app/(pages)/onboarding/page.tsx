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

// LocalStorage key for onboarding progress
const ONBOARDING_PROGRESS_KEY = "provider_onboarding_progress";

/**
 * Save onboarding progress to localStorage
 */
function saveOnboardingProgress(stage: OnboardingStage, data: Partial<OnboardingData>) {
  try {
    localStorage.setItem(ONBOARDING_PROGRESS_KEY, JSON.stringify({
      stage,
      data,
      timestamp: Date.now(),
    }));
  } catch (error) {
    console.error("Error saving onboarding progress:", error);
  }
}

/**
 * Get onboarding progress from localStorage
 */
function getOnboardingProgress(): { stage: OnboardingStage; data: Partial<OnboardingData>; timestamp: number } | null {
  try {
    const saved = localStorage.getItem(ONBOARDING_PROGRESS_KEY);
    if (saved) {
      const progress = JSON.parse(saved);
      // Check if progress is older than 7 days - if so, ignore it
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - progress.timestamp > sevenDays) {
        localStorage.removeItem(ONBOARDING_PROGRESS_KEY);
        return null;
      }
      return progress;
    }
  } catch (error) {
    console.error("Error reading onboarding progress:", error);
  }
  return null;
}

/**
 * Clear onboarding progress from localStorage
 */
function clearOnboardingProgress() {
  try {
    localStorage.removeItem(ONBOARDING_PROGRESS_KEY);
  } catch (error) {
    console.error("Error clearing onboarding progress:", error);
  }
}

export default function OnboardingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [existingData, setExistingData] = useState<Partial<OnboardingData> | undefined>(undefined);
  const [initialStage, setInitialStage] = useState<OnboardingStage>(OnboardingStage.BUSINESS_DETAILS);

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

        // If business already exists, redirect to dashboard
        // Payment details can be added later via the Payments page
        if (business) {
          console.log("Business already exists, redirecting to dashboard");
          toast.success("Your business is already set up!");
          router.push("/provider/dashboard");
          return;
        }

        // No business - check for saved progress
        const savedProgress = getOnboardingProgress();
        if (savedProgress && savedProgress.stage) {
          setInitialStage(savedProgress.stage);
          setExistingData(savedProgress.data || {});
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error checking existing data:", error);
        // If error fetching business, assume no business and continue to onboarding
        setIsLoading(false);
      }
    };

    checkExistingData();
  }, [router]);

  const handleOnboardingComplete = async (data: OnboardingData) => {
    try {
      console.log("Completing onboarding with data:", data);

      // Show uploading toast if images are present
      if (data.businessDetails.logo || data.businessDetails.coverImage) {
        toast.loading("Uploading images...", { id: "upload-progress" });
      }

      const result = await completeOnboarding(data);

      toast.dismiss("upload-progress");
      toast.success("Setup completed successfully!", {
        description: "Your business profile is now active.",
      });

      // Clear onboarding progress
      clearOnboardingProgress();

      // Redirect to dashboard
      setTimeout(() => {
        router.push("/provider/dashboard");
      }, 1500);
    } catch (error: any) {
      console.error("Error completing onboarding:", error);
      toast.dismiss("upload-progress");
      toast.error("Failed to complete setup", {
        description: error.message || "Please try again.",
      });
      throw error; // Re-throw so wizard can handle the error state
    }
  };

  /**
   * Handle stage change - save progress to localStorage
   */
  const handleStageChange = (stage: OnboardingStage, data: Partial<OnboardingData>) => {
    saveOnboardingProgress(stage, data);
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
          initialStage={initialStage}
          existingData={existingData}
          onComplete={handleOnboardingComplete}
          onStageChange={handleStageChange}
          onCancel={() => {
            clearOnboardingProgress();
            router.push("/login");
          }}
        />
      </div>
    </div>
  );
}
