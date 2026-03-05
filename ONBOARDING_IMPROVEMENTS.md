# Provider Onboarding - Stage 4 Improvements

## Changes Made

### 1. Simplified Stage 4 - Availability
**File:** `components/provider/onboarding/stages/Stage4Availability.tsx`

**What Changed:**
- Removed manual day selection - now uses working hours from Stage 2
- Pre-fills time ranges based on working hours configured in Stage 2
- Automatically excludes closed days
- Shows "Based on your working hours" info card with working days summary
- Removed manual mode (disabled, coming soon)
- Focuses on auto-generate mode only

**New Features:**
- Displays working hours summary: "Monday: 09:00 - 17:00, Tuesday: 09:00 - 17:00"
- Pre-fills start/end times from first working day
- Automatically excludes days marked as "closed" in Stage 2
- Generates slots only for open days with correct time ranges
- Shows "From your working hours" label when using Stage 2 times

**UI Improvements:**
- Added info card showing working days summary at top
- Simplified mode selection (manual disabled)
- Shows generated slots preview (first 5 days)
- Better visual feedback with badges and icons

### 2. Updated OnboardingWizard
**File:** `components/provider/onboarding/OnboardingWizard.tsx`

**What Changed:**
- Passes `preSelectedWorkingHours` prop to Stage 4
- Contains working hours data from Stage 2

### 3. Simplified Business Profile Check
**Files:**
- `app/(pages)/provider/layout.tsx`
- `app/(pages)/provider/onboarding/layout.tsx`

**What Changed:**
- Removed complex status checks (`business.status === "pending"`)
- Now simply checks: Does business exist?
  - **Yes** → Go to dashboard
  - **No** → Go to onboarding

**Benefit:**
- Cleaner logic
- Faster redirects
- No confusion about business status

## Flow After Changes

### Scenario 1: New Provider (No Business)
```
Login → Provider Layout → No business found
     → Redirect to /provider/onboarding
     → Onboarding Layout (no sidebar)
     → Stage 1: Business Profile
     → Stage 2: Working Hours (select Mon-Fri 9-5)
     → Stage 3: Break Times (optional)
     → Stage 4: Availability
       • Shows: "Based on your working hours"
       • Pre-filled: Mon-Fri, 9AM-5PM
       • Auto-excludes: Sat, Sun
       • Click "Generate Slots" → Creates slots for Mon-Fri only
     → Complete Setup → Create business + slots
     → Redirect to /provider/dashboard
     → Dashboard WITH sidebar
```

### Scenario 2: Existing Provider (Has Business)
```
Login → Provider Layout → Business found
     → Direct to /provider/dashboard
     → Dashboard WITH sidebar
```

### Scenario 3: Provider Tries to Access Onboarding Directly
```
User navigates to /provider/onboarding
     → Onboarding Layout checks for business
     → Business exists → Redirect to /provider/dashboard
```

## Stage 4 Details

### Working Hours Info Card
Shows at top of Stage 4:
```
ℹ️ Based on your working hours
   Slots will be generated for your working days only:
   [Monday: 09:00 - 17:00] [Tuesday: 09:00 - 17:00] ...
```

### Auto-Generate Form
- **Start Date**: Tomorrow (default)
- **End Date**: 2 weeks from now (default)
- **Slot Duration**: 1 hour (selectable: 30min, 1hr, 1.5hr, 2hr)
- **Start/End Time**: Pre-filled from Stage 2 (disabled if working hours exist)
  - Shows "From your working hours" label
- **Closed Days**: Automatically excluded (Sat, Sun from Stage 2)

### Generation Logic
For each day in date range:
1. Check if day is in `excludeDays` (closed days from Stage 2)
2. Get working hours for that day from Stage 2
3. Generate slots from day's start time to end time
4. Skip closed days entirely

### Result Preview
After generation:
- Shows total count: "156 slots generated"
- Shows date range: "from Mon, Feb 26 to Fri, Mar 12"
- Shows preview of first 5 days with time slots
- Each slot shows: "09:00 - 10:00", "10:00 - 11:00", etc.

## Sidebar Behavior

### During Onboarding
- **NO sidebar** - Clean full-screen layout
- **NO header** - Just the onboarding wizard
- Simple gradient background

### After Onboarding
- **Sidebar shown** - Full DashboardLayout
- **Header shown** - With user menu, notifications
- Normal dashboard experience

## Technical Details

### Props Passed to Stage 4
```typescript
interface Stage4AvailabilityProps {
  initialData?: AvailabilityData;
  workingHours: WorkingHours[];      // From wizard state
  breakTimes: BreakTime[];           // From wizard state
  onNext: (data: AvailabilityData) => void;
  preSelectedWorkingHours?: WorkingHours[];  // NEW - from Stage 2
}
```

### Data Flow
```
Stage 2 → User selects working hours
         ↓
OnboardingWizard → Stores in onboardingData.workingHours
         ↓
Stage 4 → Receives preSelectedWorkingHours
         ↓
Auto-generate → Uses those hours to create slots
         ↓
Only generates slots for open days
```

## Validation

### Stage 4 is valid when:
- At least one slot is generated
- Date range is valid (start < end)
- Slot duration is positive

### Cannot complete onboarding if:
- Stage 1: Business profile incomplete
- Stage 2: No working days selected
- Stage 4: No slots generated

## Benefits

1. **Better UX**: Users don't need to re-select working days in Stage 4
2. **Consistency**: Slots match working hours exactly
3. **Fewer Errors**: Can't generate slots for closed days
4. **Faster**: Pre-filled forms, fewer clicks
5. **Clearer**: Info card shows what will be generated

## Testing Checklist

- [ ] Stage 2: Select Mon-Fri 9-5, close Sat-Sun
- [ ] Stage 4: Shows "Monday: 09:00 - 17:00" badge
- [ ] Stage 4: Sat/Sun are pre-excluded
- [ ] Stage 4: Generate creates Mon-Fri slots only
- [ ] Stage 4: Generated slots show correct times (9-10, 10-11, etc.)
- [ ] Complete onboarding creates business
- [ ] After completion, dashboard shows sidebar
- [ ] Existing provider skips onboarding, goes to dashboard
- [ ] Onboarding page has no sidebar

---

**Status:** ✅ Complete
**Last Updated:** 2026-02-24
