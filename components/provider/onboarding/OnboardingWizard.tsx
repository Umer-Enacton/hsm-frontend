"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { OnboardingStage, type OnboardingData, DayOfWeek, SlotMode } from "@/types/provider";
import { Stage1BusinessProfile } from "./stages/Stage1BusinessProfile";
import { Stage2WorkingHours } from "./stages/Stage2WorkingHours";
import { Stage3BreakTimes } from "./stages/Stage3BreakTimes";
import { Stage4Availability } from "./stages/Stage4Availability";
import { toast } from "sonner";

interface OnboardingWizardProps {
  initialStage?: OnboardingStage;
  existingData?: Partial<OnboardingData>;
  onComplete: (data: OnboardingData) => void;
  onCancel: () => void;
}

const STAGES = [
  {
    id: OnboardingStage.BUSINESS_PROFILE,
    title: "Business Profile",
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
    id: OnboardingStage.BREAK_TIMES,
    title: "Break Times",
    description: "Add your breaks (optional)",
    isRequired: false,
  },
  {
    id: OnboardingStage.AVAILABILITY,
    title: "Availability Slots",
    description: "Configure your booking slots",
    isRequired: true,
  },
];

export function OnboardingWizard({
  initialStage = OnboardingStage.BUSINESS_PROFILE,
  existingData,
  onComplete,
  onCancel,
}: OnboardingWizardProps) {
  const [currentStage, setCurrentStage] = useState<OnboardingStage>(initialStage);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    businessProfile: existingData?.businessProfile || {
      name: "",
      description: "",
      categoryId: 0,
      category: "",
      phone: "",
      email: "",
      address: "",
      website: "",
    },
    workingHours: existingData?.workingHours || [],
    breakTimes: existingData?.breakTimes || [],
    availabilitySlots: existingData?.availabilitySlots || {
      mode: SlotMode.MANUAL,
      slots: [],
    },
  });

  const currentStageIndex = STAGES.findIndex((s) => s.id === currentStage);
  const progress = ((currentStageIndex + 1) / STAGES.length) * 100;

  const handleStageData = (stageData: any) => {
    setOnboardingData((prev) => {
      switch (currentStage) {
        case OnboardingStage.BUSINESS_PROFILE:
          return { ...prev, businessProfile: stageData };
        case OnboardingStage.WORKING_HOURS:
          return { ...prev, workingHours: stageData };
        case OnboardingStage.BREAK_TIMES:
          return { ...prev, breakTimes: stageData };
        case OnboardingStage.AVAILABILITY:
          return { ...prev, availabilitySlots: stageData };
        default:
          return prev;
      }
    });
  };

  const handleNext = () => {
    if (currentStage < OnboardingStage.AVAILABILITY) {
      setCurrentStage((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStage > OnboardingStage.BUSINESS_PROFILE) {
      setCurrentStage((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    // Skip break times (optional stage)
    if (currentStage === OnboardingStage.BREAK_TIMES) {
      setCurrentStage((prev) => prev + 1);
    }
  };

  const handleComplete = () => {
    // Validate required stages
    if (!onboardingData.businessProfile.name) {
      toast.error("Business name is required");
      setCurrentStage(OnboardingStage.BUSINESS_PROFILE);
      return;
    }

    if (onboardingData.workingHours.length === 0) {
      toast.error("Please set at least one working day");
      setCurrentStage(OnboardingStage.WORKING_HOURS);
      return;
    }

    // Validate availability slots
    if (onboardingData.availabilitySlots.slots.length === 0) {
      toast.error("Please create at least one availability slot");
      setCurrentStage(OnboardingStage.AVAILABILITY);
      return;
    }

    onComplete(onboardingData);
  };

  const canGoNext = () => {
    switch (currentStage) {
      case OnboardingStage.BUSINESS_PROFILE:
        return (
          onboardingData.businessProfile.name &&
          onboardingData.businessProfile.category &&
          onboardingData.businessProfile.phone &&
          onboardingData.businessProfile.email &&
          onboardingData.businessProfile.address
        );
      case OnboardingStage.WORKING_HOURS:
        return onboardingData.workingHours.some((wh) => wh.isOpen);
      case OnboardingStage.BREAK_TIMES:
        return true; // Optional stage
      case OnboardingStage.AVAILABILITY:
        return onboardingData.availabilitySlots.slots.length > 0;
      default:
        return false;
    }
  };

  const isLastStage = currentStage === OnboardingStage.AVAILABILITY;
  const isOptionalStage = currentStage === OnboardingStage.BREAK_TIMES;

  return (
    <div className="mx-auto max-w-4xl">
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
        {currentStage === OnboardingStage.BUSINESS_PROFILE && (
          <Stage1BusinessProfile
            initialData={onboardingData.businessProfile}
            onNext={handleStageData}
            autoFocus
          />
        )}

        {currentStage === OnboardingStage.WORKING_HOURS && (
          <Stage2WorkingHours
            initialData={onboardingData.workingHours}
            onNext={handleStageData}
          />
        )}

        {currentStage === OnboardingStage.BREAK_TIMES && (
          <Stage3BreakTimes
            initialData={onboardingData.breakTimes}
            workingHours={onboardingData.workingHours}
            onNext={handleStageData}
          />
        )}

        {currentStage === OnboardingStage.AVAILABILITY && (
          <Stage4Availability
            initialData={onboardingData.availabilitySlots}
            workingHours={onboardingData.workingHours}
            breakTimes={onboardingData.breakTimes}
            onNext={handleStageData}
            preSelectedWorkingHours={onboardingData.workingHours}
          />
        )}
      </Card>

      {/* Navigation Buttons */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex gap-2">
          {currentStage > OnboardingStage.BUSINESS_PROFILE && (
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
          {isOptionalStage && (
            <Button variant="ghost" onClick={handleSkip}>
              Skip for now
            </Button>
          )}

          <Button
            onClick={handleNext}
            disabled={!canGoNext()}
            className="gap-2"
          >
            {isLastStage ? (
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
