# Provider Onboarding Implementation

## Summary

Implemented a comprehensive 4-stage onboarding wizard for service providers. The onboarding flow is triggered when a provider logs in for the first time or doesn't have a business profile configured.

## Files Created

### Type Definitions
- **`types/provider/index.ts`**: All provider-related type definitions
  - `Business`, `BusinessStatus`, `WorkingHours`, `BreakTime`, `AvailabilitySlot`
  - `OnboardingData`, `OnboardingStage`
  - `Service`, `ProviderBooking`, `Review`, `ProviderDashboardStats`
  - Helper enums: `DayOfWeek`, `SlotMode`, `BookingStatus`

### API Layer
- **`lib/provider/api.ts`**: Provider API functions
  - Business profile CRUD (`getProviderBusiness`, `createBusiness`, `updateBusiness`)
  - Image upload (`uploadBusinessLogo`, `uploadBusinessCoverImage`)
  - Working hours (`getWorkingHours`, `saveWorkingHours`)
  - Break times (`getBreakTimes`, `saveBreakTimes`)
  - Availability slots (`getAvailabilitySlots`, `createSlot`, `createSlots`, `autoGenerateSlots`)
  - Onboarding (`completeOnboarding`)

### Route Structure
```
app/(pages)/provider/
├── layout.tsx                    # Provider layout with onboarding check
├── onboarding/
│   └── page.tsx                  # Onboarding page
├── dashboard/
│   └── page.tsx                  # Dashboard page
```

### Components
```
components/provider/onboarding/
├── OnboardingWizard.tsx          # Main wizard component
└── stages/
    ├── Stage1BusinessProfile.tsx # Business info + images
    ├── Stage2WorkingHours.tsx    # Daily working hours
    ├── Stage3BreakTimes.tsx      # Break configuration (optional)
    └── Stage4Availability.tsx    # Slot generation (manual/auto)
```

## How It Works

### 1. Redirect Logic (Provider Layout)

The provider layout checks for existing business profile:

```typescript
// Check if provider has completed onboarding
const business = await getProviderBusiness(userData.id);

// If no business exists, redirect to onboarding
if (!business) {
  router.push("/provider/onboarding");
  return;
}
```

### 2. Onboarding Wizard

The wizard manages 4 stages:

#### Stage 1: Business Profile
- Business name, category, description
- Contact info (phone, email, address, website)
- Logo and cover image upload (controlled upload)
- Category selection via badges
- Real-time validation

#### Stage 2: Working Hours
- Day-by-day open/close toggle
- Time inputs for each working day
- Quick actions: "Set Weekdays", "Set All Days"
- Copy hours to all days feature
- Validation: at least one open day required

#### Stage 3: Break Times (Optional)
- Global break for all days
- Day-specific breaks
- Can be skipped with "Skip for now" button
- Visual list of configured breaks

#### Stage 4: Availability Slots
Two modes:

**Manual Mode:**
- Add individual slots (date + time range)
- List of all slots grouped by date
- Remove individual slots

**Auto-Generate Mode:**
- Date range selection
- Start/end time configuration
- Slot duration options (30min, 1hr, 1.5hr, 2hr)
- Day exclusion (e.g., weekends)
- Bulk generate slots button

### 3. Data Flow

```
User fills form → Stage component updates state
                → OnboardingWizard accumulates data
                → Parent notified via onNext callback
                → Final submit → completeOnboarding API
                → Redirect to dashboard
```

### 4. Progress Indicator

- Visual progress bar (0-100%)
- Stage indicators (completed/current/upcoming)
- "Step X of Y" counter
- Stage titles and descriptions

### 5. Navigation

- **Back**: Go to previous stage
- **Next**: Go to next stage (enabled when valid)
- **Skip**: Available for optional stages (Break Times)
- **Complete Setup**: Final button on last stage

## Validation

Each stage validates before allowing progression:

| Stage | Validation Rules |
|-------|-----------------|
| Business Profile | Name, category, phone, email, address required |
| Working Hours | At least one day must be open |
| Break Times | None (optional) |
| Availability | At least one slot must be created |

## UI Features

### Responsive Design
- Mobile-friendly layouts
- Grid columns collapse on smaller screens
- Touch-friendly buttons and inputs

### Visual Feedback
- Green checkmark for completed fields
- Red border for invalid inputs
- Toast notifications for actions
- Loading states during operations

### Empty States
- Helpful messages when no data exists
- Call-to-action buttons
- Illustrative icons

### Tips & Guidance
- Info boxes with best practices
- Tooltips and help text
- Example values in placeholders

## Backend Integration Required

The frontend is ready but requires these backend endpoints:

```typescript
// Business
POST   /businesses                              // Create business
PUT    /businesses/:id                          // Update business
GET    /business/provider/:userId               // Get provider business

// Working Hours
POST   /businesses/:id/working-hours            // Save working hours
GET    /businesses/:id/working-hours            // Get working hours

// Break Times
POST   /businesses/:id/break-times              // Save break times
GET    /businesses/:id/break-times              // Get break times

// Availability Slots
POST   /businesses/:id/slots                    // Create slot
POST   /businesses/:id/slots/batch              // Create multiple slots
POST   /businesses/:id/slots/auto-generate      // Auto-generate slots
DELETE /businesses/:id/slots/:slotId            // Delete slot

// Onboarding
POST   /provider/onboarding/complete            // Complete onboarding
```

## Middleware Protection

Provider routes are protected via middleware:

```typescript
provider: {
  paths: ["/provider"],  // All /provider/* routes
  allowedRoles: [UserRole.PROVIDER],
}
```

## Testing Checklist

- [ ] Provider without business redirects to onboarding
- [ ] All 4 stages display correctly
- [ ] Validation works for each stage
- [ ] Back/Next navigation works
- [ ] Skip button works for optional stage
- [ ] Image upload (controlled) works
- [ ] Auto-generate slots creates correct number
- [ ] Manual slot add/remove works
- [ ] Progress indicator updates
- [ ] Final submit creates business profile
- [ ] Redirect to dashboard after completion

## Next Steps

1. **Backend API**: Implement the required endpoints
2. **Dashboard**: Build real provider dashboard with actual stats
3. **Services Page**: Create services management
4. **Bookings Page**: Implement booking list with actions
5. **Reviews Page**: Show customer reviews
6. **Profile Page**: Provider profile settings

## Environment Variables

Add to `.env.local`:

```bash
# Cloudinary for image uploads
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dwxqwoffr
```

## Screenshot References

The onboarding UI was designed based on the screenshot at:
`https://maas-log-prod.cn-wlcb.ufileos.com/anthropic/a449f4ff-a66a-4e7c-8348-cd8f26fe7a2b/Screenshot%202026-02-24%20092515.png`

Key features inspired from screenshot:
- Multi-stage progress indicator
- Card-based layout
- Clean, minimalist design
- Clear call-to-action buttons
- Visual stage completion indicators

---

**Created:** 2026-02-24
**Status:** Frontend Complete, Backend Integration Pending
