"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  OnboardingStage,
  type OnboardingData,
  WorkingHours,
  BreakTime,
} from "@/types/provider";
import { Stage1BusinessDetails } from "./stages/Stage1BusinessDetails";
import { Stage2WorkingHours } from "./stages/Stage2WorkingHours";
import { Stage3SlotGeneration } from "./stages/Stage3SlotGeneration";
import { Stage4PaymentDetails } from "./stages/Stage4PaymentDetails";
import { toast } from "sonner";
import { api, API_ENDPOINTS } from "@/lib/api";

// LocalStorage key for persisting onboarding progress
const ONBOARDING_STORAGE_KEY = "provider_onboarding_progress";

// Storage interface for localStorage
interface StoredOnboardingProgress {
  currentStage: OnboardingStage;
  onboardingData: Partial<OnboardingData>;
  timestamp: number;
}

// Helper to save progress to localStorage
const saveProgress = (
  currentStage: OnboardingStage,
  onboardingData: Partial<OnboardingData>,
) => {
  try {
    const dataToStore: StoredOnboardingProgress = {
      currentStage,
      onboardingData: {
        ...onboardingData,
        // Don't store File objects (logo, coverImage) as they can't be serialized
        businessDetails: onboardingData.businessDetails ? {
          ...onboardingData.businessDetails,
          logo: null,
          coverImage: null,
        } : undefined,
      },
      timestamp: Date.now(),
    };
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(dataToStore));
  } catch (error) {
    console.warn("Failed to save onboarding progress:", error);
  }
};

// Helper to load progress from localStorage
const loadProgress = (): StoredOnboardingProgress | null => {
  try {
    const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as StoredOnboardingProgress;
      // Only restore if data is less than 7 days old
      const weekInMs = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - parsed.timestamp < weekInMs) {
        return parsed;
      }
      // Clear expired data
      localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    }
  } catch (error) {
    console.warn("Failed to load onboarding progress:", error);
  }
  return null;
};

// Helper to clear progress from localStorage
const clearProgress = () => {
  try {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to clear onboarding progress:", error);
  }
};

// Confetti animation helper (simple CSS-based confetti)
const triggerConfetti = () => {
  const colors = [
    "#8b5cf6", // purple
    "#ec4899", // pink
    "#f59e0b", // amber
    "#10b981", // emerald
    "#3b82f6", // blue
  ];

  const createConfettiPiece = () => {
    const confetti = document.createElement("div");
    confetti.style.cssText = `
      position: fixed;
      width: 10px;
      height: 10px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      left: ${Math.random() * 100}vw;
      top: -10px;
      z-index: 9999;
      border-radius: ${Math.random() > 0.5 ? "50%" : "0"};
      pointer-events: none;
      animation: confetti-fall ${2 + Math.random() * 2}s linear forwards;
    `;
    document.body.appendChild(confetti);

    // Add keyframes if not exists
    if (!document.getElementById("confetti-keyframes")) {
      const style = document.createElement("style");
      style.id = "confetti-keyframes";
      style.textContent = `
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(${720 + Math.random() * 360}deg);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    // Remove after animation
    setTimeout(() => confetti.remove(), 4000);
  };

  // Create multiple confetti pieces
  for (let i = 0; i < 150; i++) {
    setTimeout(createConfettiPiece, i * 20);
  }
};

interface OnboardingWizardProps {
  initialStage?: OnboardingStage;
  existingData?: Partial<OnboardingData>;
  onComplete: (data: OnboardingData) => Promise<void>;
  onCancel: () => void;
  onStageChange?: (
    stage: OnboardingStage,
    data: Partial<OnboardingData>,
  ) => void;
}

const STAGES = [
  {
    id: OnboardingStage.BUSINESS_DETAILS,
    title: "Business Details",
    description: "Tell us about your business",
    isRequired: true,
  },
  {
    id: OnboardingStage.WORKING_HOURS,
    title: "Working Hours",
    description: "Set your availability",
    isRequired: true,
  },
  {
    id: OnboardingStage.SLOT_GENERATION,
    title: "Slot Generation",
    description: "Configure your booking slots",
    isRequired: true,
  },
  {
    id: OnboardingStage.PAYMENT_DETAILS,
    title: "Payment Details",
    description: "Add payment methods to receive earnings",
    isRequired: true,
  },
];

export function OnboardingWizard({
  initialStage = OnboardingStage.BUSINESS_DETAILS,
  existingData,
  onComplete,
  onCancel,
  onStageChange,
}: OnboardingWizardProps) {
  // State for payment details (from backend)
  const [paymentDetails, setPaymentDetails] = useState<any[]>([]);
  const [isLoadingPaymentDetails, setIsLoadingPaymentDetails] = useState(false);

  // Try to load saved progress from localStorage
  const savedProgress = useRef<StoredOnboardingProgress | null>(null);

  useEffect(() => {
    savedProgress.current = loadProgress();
  }, []);

  const [currentStage, setCurrentStage] = useState<OnboardingStage>(() => {
    // Use saved stage if available and valid, otherwise use initialStage
    const saved = savedProgress.current;
    if (saved && saved.currentStage >= OnboardingStage.BUSINESS_DETAILS &&
        saved.currentStage <= OnboardingStage.PAYMENT_DETAILS) {
      return saved.currentStage;
    }
    return initialStage;
  });

  const [isCompleting, setIsCompleting] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>(() => {
    // Initialize with saved data or existingData
    const saved = savedProgress.current;
    const baseData = existingData || {};
    const savedBusiness = saved?.onboardingData.businessDetails;
    const baseBusiness = baseData.businessDetails;

    return {
      businessDetails: {
        name: (savedBusiness?.name || baseBusiness?.name || "") as string,
        description: (savedBusiness?.description || baseBusiness?.description || "") as string,
        categoryId: (savedBusiness?.categoryId || baseBusiness?.categoryId || 0) as number,
        category: (savedBusiness?.category || baseBusiness?.category || "") as string,
        businessPhone: (savedBusiness?.businessPhone || baseBusiness?.businessPhone || "") as string,
        state: (savedBusiness?.state || baseBusiness?.state || "") as string,
        city: (savedBusiness?.city || baseBusiness?.city || "") as string,
        website: (savedBusiness?.website || baseBusiness?.website || "") as string,
        logo: null,
        coverImage: null,
      },
      workingHours: {
        startTime: (saved?.onboardingData.workingHours?.startTime || baseData.workingHours?.startTime || "09:00") as string,
        endTime: (saved?.onboardingData.workingHours?.endTime || baseData.workingHours?.endTime || "18:00") as string,
      },
      breakTime: saved?.onboardingData.breakTime || baseData.breakTime,
      slotInterval: saved?.onboardingData.slotInterval || baseData.slotInterval || 30,
      hasPaymentDetails: saved?.onboardingData.hasPaymentDetails || baseData.hasPaymentDetails || false,
    };
  });

  // Fetch payment details on mount
  useEffect(() => {
    const fetchPaymentDetails = async () => {
      try {
        setIsLoadingPaymentDetails(true);
        const response: any = await api.get(API_ENDPOINTS.PAYMENT_DETAILS);
        setPaymentDetails(response.details || []);
        // Update onboardingData if has active payment method
        if (response.details && response.details.length > 0) {
          const hasActive = response.details.some((d: any) => d.isActive);
          if (hasActive) {
            setOnboardingData((prev) => ({ ...prev, hasPaymentDetails: true }));
          }
        }
      } catch (error) {
        console.error("Failed to fetch payment details:", error);
      } finally {
        setIsLoadingPaymentDetails(false);
      }
    };
    fetchPaymentDetails();
  }, []);

  const currentStageIndex = STAGES.findIndex((s) => s.id === currentStage);
  const progress = ((currentStageIndex + 1) / STAGES.length) * 100;

  // Save progress whenever stage or data changes
  useEffect(() => {
    if (!isCompleting) {
      saveProgress(currentStage, onboardingData);
    }
  }, [currentStage, onboardingData, isCompleting]);

  const handleStageData = useCallback(
    (stageData: any) => {
      setOnboardingData((prev) => {
        let updated: OnboardingData;
        switch (currentStage) {
          case OnboardingStage.BUSINESS_DETAILS:
            updated = { ...prev, businessDetails: stageData };
            break;
          case OnboardingStage.WORKING_HOURS:
            updated = { ...prev, workingHours: stageData.workingHours, breakTime: stageData.breakTime };
            break;
          case OnboardingStage.SLOT_GENERATION:
            updated = { ...prev, slotInterval: stageData };
            break;
          case OnboardingStage.PAYMENT_DETAILS:
            updated = { ...prev, hasPaymentDetails: stageData.hasPaymentDetails };
            break;
          default:
            updated = prev;
        }
        return updated;
      });
    },
    [currentStage],
  );

  const handleNext = () => {
    if (currentStage < OnboardingStage.PAYMENT_DETAILS) {
      const nextStage = (currentStage + 1) as OnboardingStage;
      setCurrentStage(nextStage);
      // Notify parent of stage change
      onStageChange?.(nextStage, onboardingData);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStage > OnboardingStage.BUSINESS_DETAILS) {
      const prevStage = (currentStage - 1) as OnboardingStage;
      setCurrentStage(prevStage);
      // Notify parent of stage change
      onStageChange?.(prevStage, onboardingData);
    }
  };

  const handleComplete = async () => {
    // Validate all required stages
    if (!onboardingData.businessDetails.name) {
      toast.error("Business name is required");
      setCurrentStage(OnboardingStage.BUSINESS_DETAILS);
      return;
    }

    if (onboardingData.businessDetails.categoryId === 0) {
      toast.error("Please select a category");
      setCurrentStage(OnboardingStage.BUSINESS_DETAILS);
      return;
    }

    if (
      !onboardingData.businessDetails.state ||
      !onboardingData.businessDetails.city
    ) {
      toast.error("Business location is required");
      setCurrentStage(OnboardingStage.BUSINESS_DETAILS);
      return;
    }

    // Stage 2 validation: Working hours
    if (
      !onboardingData.workingHours.startTime ||
      !onboardingData.workingHours.endTime
    ) {
      toast.error("Working hours are required");
      setCurrentStage(OnboardingStage.WORKING_HOURS);
      return;
    }

    // Validate that end time is after start time
    const startMins = parseInt(onboardingData.workingHours.startTime.split(":")[0]) * 60 +
                      parseInt(onboardingData.workingHours.startTime.split(":")[1]);
    const endMins = parseInt(onboardingData.workingHours.endTime.split(":")[0]) * 60 +
                    parseInt(onboardingData.workingHours.endTime.split(":")[1]);
    if (endMins <= startMins) {
      toast.error("End time must be after start time");
      setCurrentStage(OnboardingStage.WORKING_HOURS);
      return;
    }

    // Stage 3 validation: Slot interval
    if (!onboardingData.slotInterval || onboardingData.slotInterval <= 0) {
      toast.error("Please select a slot interval");
      setCurrentStage(OnboardingStage.SLOT_GENERATION);
      return;
    }

    // Stage 4 validation: Payment details
    if (!onboardingData.hasPaymentDetails) {
      toast.error("Please add at least one payment method");
      setCurrentStage(OnboardingStage.PAYMENT_DETAILS);
      return;
    }

    setIsCompleting(true);
    try {
      await onComplete(onboardingData);
      // Trigger confetti on success
      triggerConfetti();
      // Clear saved progress after successful completion
      clearProgress();
    } catch (error) {
      setIsCompleting(false);
    }
    // Note: Don't set setIsCompleting(false) on success because page will redirect
  };

  const canGoNext = () => {
    switch (currentStage) {
      case OnboardingStage.BUSINESS_DETAILS:
        return (
          onboardingData.businessDetails.name &&
          onboardingData.businessDetails.categoryId > 0 &&
          onboardingData.businessDetails.state &&
          onboardingData.businessDetails.city
        );
      case OnboardingStage.WORKING_HOURS:
        return (
          onboardingData.workingHours.startTime &&
          onboardingData.workingHours.endTime
        );
      case OnboardingStage.SLOT_GENERATION:
        return onboardingData.slotInterval > 0;
      case OnboardingStage.PAYMENT_DETAILS:
        return onboardingData.hasPaymentDetails === true;
      default:
        return false;
    }
  };

  const isLastStage = currentStage === OnboardingStage.PAYMENT_DETAILS;

  return (
    <div className="mx-auto max-w-4xl relative">
      {/* Loading Overlay */}
      {isCompleting && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-md">
          <div className="flex flex-col items-center gap-4 p-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold">
                Setting up your business...
              </p>
              <p className="text-sm text-muted-foreground">
                This may take a moment as we upload your images and create your
                profile
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Progress Header */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              {STAGES[currentStageIndex].title}
            </h2>
            <p className="text-sm text-muted-foreground">
              {STAGES[currentStageIndex].description}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Step {currentStageIndex + 1} of {STAGES.length}
            </span>
            <span className="font-medium">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Stage Indicators */}
        <div className="mt-6 flex gap-2">
          {STAGES.map((stage, index) => {
            const isCompleted = index < currentStageIndex;
            const isCurrent = index === currentStageIndex;
            const isUpcoming = index > currentStageIndex;

            return (
              <div
                key={stage.id}
                className={cn(
                  "flex-1 rounded-md border-2 p-3 text-center transition-colors",
                  isCompleted && "border-primary bg-primary/5",
                  isCurrent && "border-primary bg-primary/10",
                  isUpcoming && "border-muted bg-muted/5",
                )}
              >
                <div className="text-xs font-medium">{stage.title}</div>
                {stage.isRequired && isUpcoming && (
                  <div className="mt-1 text-[10px] text-muted-foreground">
                    Required
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stage Content */}
      <Card className="p-6">
        {currentStage === OnboardingStage.BUSINESS_DETAILS && (
          <Stage1BusinessDetails
            initialData={onboardingData.businessDetails}
            onNext={handleStageData}
          />
        )}

        {currentStage === OnboardingStage.WORKING_HOURS && (
          <Stage2WorkingHours
            initialWorkingHours={onboardingData.workingHours}
            initialBreakTime={onboardingData.breakTime}
            onNext={handleStageData}
          />
        )}

        {currentStage === OnboardingStage.SLOT_GENERATION && (
          <Stage3SlotGeneration
            workingHours={onboardingData.workingHours}
            breakTime={onboardingData.breakTime}
            initialSlotInterval={onboardingData.slotInterval}
            onNext={handleStageData}
          />
        )}

        {currentStage === OnboardingStage.PAYMENT_DETAILS && (
          <Stage4PaymentDetails
            onNext={handleStageData}
            existingPaymentDetails={paymentDetails}
          />
        )}
      </Card>

      {/* Navigation Buttons */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex gap-2">
          {currentStage > OnboardingStage.BUSINESS_DETAILS && (
            <Button variant="outline" onClick={handleBack} className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleNext}
            disabled={!canGoNext() || isCompleting}
            className="gap-2"
          >
            {isCompleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating Your Business...
              </>
            ) : isLastStage ? (
              "Complete Setup"
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
