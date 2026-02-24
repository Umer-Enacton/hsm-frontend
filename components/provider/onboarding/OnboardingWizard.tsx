"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { OnboardingStage, type OnboardingData, WorkingHours, BreakTime } from "@/types/provider";
import { Stage1BusinessDetails } from "./stages/Stage1BusinessDetails";
import { Stage2WorkingHours } from "./stages/Stage2WorkingHours";
import { Stage3SlotGeneration } from "./stages/Stage3SlotGeneration";
import { toast } from "sonner";

interface OnboardingWizardProps {
  initialStage?: OnboardingStage;
  existingData?: Partial<OnboardingData>;
  onComplete: (data: OnboardingData) => Promise<void>;
  onCancel: () => void;
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
];

export function OnboardingWizard({
  initialStage = OnboardingStage.BUSINESS_DETAILS,
  existingData,
  onComplete,
  onCancel,
}: OnboardingWizardProps) {
  const [currentStage, setCurrentStage] = useState<OnboardingStage>(initialStage);
  const [isCompleting, setIsCompleting] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    businessDetails: existingData?.businessDetails || {
      name: "",
      description: "",
      categoryId: 0,
      category: "",
      businessPhone: "",
      state: "",
      city: "",
      website: "",
      logo: null,
      coverImage: null,
    },
    workingHours: existingData?.workingHours || { startTime: "09:00", endTime: "18:00" },
    breakTime: existingData?.breakTime,
    slotInterval: existingData?.slotInterval || 30,
  });

  const currentStageIndex = STAGES.findIndex((s) => s.id === currentStage);
  const progress = ((currentStageIndex + 1) / STAGES.length) * 100;

  const handleStageData = useCallback((stageData: any) => {
    setOnboardingData((prev) => {
      switch (currentStage) {
        case OnboardingStage.BUSINESS_DETAILS:
          return { ...prev, businessDetails: stageData };
        case OnboardingStage.WORKING_HOURS:
          return { ...prev, ...stageData };
        case OnboardingStage.SLOT_GENERATION:
          return { ...prev, slotInterval: stageData };
        default:
          return prev;
      }
    });
  }, [currentStage]);

  const handleNext = () => {
    if (currentStage < OnboardingStage.SLOT_GENERATION) {
      setCurrentStage((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStage > OnboardingStage.BUSINESS_DETAILS) {
      setCurrentStage((prev) => prev - 1);
    }
  };

  const handleComplete = async () => {
    // Validate required stages
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

    if (!onboardingData.businessDetails.state || !onboardingData.businessDetails.city) {
      toast.error("Business location is required");
      setCurrentStage(OnboardingStage.BUSINESS_DETAILS);
      return;
    }

    if (!onboardingData.workingHours.startTime || !onboardingData.workingHours.endTime) {
      toast.error("Working hours are required");
      setCurrentStage(OnboardingStage.WORKING_HOURS);
      return;
    }

    if (!onboardingData.slotInterval || onboardingData.slotInterval <= 0) {
      toast.error("Please select a slot interval");
      setCurrentStage(OnboardingStage.SLOT_GENERATION);
      return;
    }

    setIsCompleting(true);
    try {
      await onComplete(onboardingData);
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
      default:
        return false;
    }
  };

  const isLastStage = currentStage === OnboardingStage.SLOT_GENERATION;

  return (
    <div className="mx-auto max-w-4xl relative">
      {/* Loading Overlay */}
      {isCompleting && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
          <div className="flex flex-col items-center gap-4 p-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold">Setting up your business...</p>
              <p className="text-sm text-muted-foreground">
                This may take a moment as we upload your images and create your profile
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Progress Header */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{STAGES[currentStageIndex].title}</h2>
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
            <span className="font-medium">{Math.round(progress)}% Complete</span>
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
                  "flex-1 rounded-lg border-2 p-3 text-center transition-colors",
                  isCompleted && "border-primary bg-primary/5",
                  isCurrent && "border-primary bg-primary/10",
                  isUpcoming && "border-muted bg-muted/5"
                )}
              >
                <div className="text-xs font-medium">{stage.title}</div>
                {stage.isRequired && isUpcoming && (
                  <div className="mt-1 text-[10px] text-muted-foreground">Required</div>
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
      </Card>

      {/* Navigation Buttons */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex gap-2">
          {currentStage > OnboardingStage.BUSINESS_DETAILS && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="gap-2"
            >
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
