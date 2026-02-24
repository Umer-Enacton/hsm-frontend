# Provider Onboarding - Quick Reference

## File Structure

```
hsm-frontend/
├── types/provider/
│   └── index.ts                 # All provider types
├── lib/provider/
│   └── api.ts                   # Provider API functions
├── app/(pages)/provider/
│   ├── layout.tsx               # Provider layout + onboarding check
│   ├── onboarding/
│   │   └── page.tsx             # Onboarding entry page
│   └── dashboard/
│       └── page.tsx             # Dashboard (placeholder)
└── components/provider/onboarding/
    ├── OnboardingWizard.tsx     # Main wizard component
    └── stages/
        ├── Stage1BusinessProfile.tsx
        ├── Stage2WorkingHours.tsx
        ├── Stage3BreakTimes.tsx
        └── Stage4Availability.tsx
```

## Onboarding Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Provider Login                                  │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Provider Layout Loads                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Check: Does provider have a business profile?              │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                │ NO                            │ YES
                ▼                               ▼
┌───────────────────────────┐    ┌───────────────────────────┐
│   Redirect to Onboarding  │    │   Show Dashboard/App      │
└───────────────────────────┘    └───────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       Onboarding Wizard                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Progress Bar: Stage 1 of 4 (25%)                            │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │  Stage Indicators: [●] [○] [○] [○]                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    STAGE CONTENT                             │   │
│  │  ┌─────────────────────────────────────────────────────────┐│   │
│  │  │  Stage 1: Business Profile                              ││   │
│  │  │  - Name, category, description                          ││   │
│  │  │  - Phone, email, address                                ││   │
│  │  │  - Logo & cover image upload                            ││   │
│  │  └─────────────────────────────────────────────────────────┘│   │
│  │                                                              │   │
│  │  ┌─────────────────────────────────────────────────────────┐│   │
│  │  │  Stage 2: Working Hours                                 ││   │
│  │  │  - Day-by-day open/close toggle                         ││   │
│  │  │  - Start/end time for each day                          ││   │
│  │  │  - Quick: Set Weekdays / Set All Days                   ││   │
│  │  └─────────────────────────────────────────────────────────┘│   │
│  │                                                              │   │
│  │  ┌─────────────────────────────────────────────────────────┐│   │
│  │  │  Stage 3: Break Times (Optional)                        ││   │
│  │  │  - Global break for all days                            ││   │
│  │  │  - Day-specific breaks                                   ││   │
│  │  │  - Skip button available                                ││   │
│  │  └─────────────────────────────────────────────────────────┘│   │
│  │                                                              │   │
│  │  ┌─────────────────────────────────────────────────────────┐│   │
│  │  │  Stage 4: Availability Slots                            ││   │
│  │  │  ○ Manual: Add individual slots                         ││   │
│  │  │  ○ Auto: Generate slots in bulk                         ││   │
│  │  └─────────────────────────────────────────────────────────┘│   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  [← Back]  [Skip for now]  [Next →]                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Complete Onboarding                              │
│  - Create business profile                                          │
│  - Save working hours                                               │
│  - Save break times                                                 │
│  - Create availability slots                                        │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   Redirect to Dashboard                              │
└─────────────────────────────────────────────────────────────────────┘
```

## Key Components

### OnboardingWizard (`components/provider/onboarding/OnboardingWizard.tsx`)
**Props:**
- `initialStage`: Starting stage (default: 1)
- `existingData`: Pre-fill data from existing business
- `onComplete(data)`: Called when all stages complete
- `onCancel()`: Called when user cancels

**State:**
- `currentStage`: Active stage (1-4)
- `onboardingData`: Accumulated data from all stages

**Features:**
- Progress bar (0-100%)
- Stage indicators (completed/current/upcoming)
- Back/Next/Skip navigation
- Validation before progression

### Stage Components

Each stage receives:
- `initialData`: Pre-filled values
- `onNext(data)`: Callback when stage is valid

Each stage manages:
- Form state
- Validation
- Auto-save (calls `onNext` when valid)

## Data Structure

```typescript
interface OnboardingData {
  businessProfile: {
    name: string;
    description: string;
    category: string;
    phone: string;
    email: string;
    address: string;
    website?: string;
    logo?: File | null;
    coverImage?: File | null;
  };

  workingHours: WorkingHours[];  // 7 days, open/close + times

  breakTimes: BreakTime[];       // Optional, day-specific or all days

  availabilitySlots: {
    mode: "manual" | "auto";
    slots: AvailabilitySlot[];
    autoGenerateConfig?: { ... };
  };
}
```

## Backend API Endpoints Needed

```typescript
POST   /businesses                              // Create business
PUT    /businesses/:id                          // Update business
GET    /business/provider/:userId               // Get provider business
POST   /businesses/:id/working-hours            // Save working hours
POST   /businesses/:id/break-times              // Save break times
POST   /businesses/:id/slots                    // Create slot(s)
POST   /businesses/:id/slots/batch              // Bulk create slots
POST   /businesses/:id/slots/auto-generate      // Auto-generate slots
POST   /provider/onboarding/complete            // Complete all stages
```

## Testing Checklist

- [ ] Provider without business → redirects to onboarding
- [ ] All 4 stages display correctly
- [ ] Stage 1: All fields validate, images upload
- [ ] Stage 2: At least one open day required
- [ ] Stage 3: Can skip, can add breaks
- [ ] Stage 4: Manual and auto modes work
- [ ] Progress indicator updates correctly
- [ ] Back/Next navigation works
- [ ] Final submit creates all data
- [ ] Redirect to dashboard after completion

## Environment Variables

```bash
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dwxqwoffr
```

---

**Created:** 2026-02-24
**Frontend Status:** ✅ Complete
**Backend Status:** ⏳ Pending API Implementation
