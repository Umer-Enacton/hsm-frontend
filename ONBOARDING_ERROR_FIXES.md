# Provider Onboarding - Error Fixes & Implementation Summary

## Issue Description

The user encountered this error when completing onboarding:
```
Cannot POST /provider/onboarding/complete
Failed to complete setup
```

Additionally, the user requested:
1. Show sidebar only when provider has completed onboarding
2. Onboarding should display without sidebar
3. Fix the onboarding completion error

## Root Cause Analysis

### 1. Missing Backend Endpoint
The frontend was calling `/provider/onboarding/complete` which doesn't exist in the backend. The backend only has individual endpoints:
- POST `/businesses` - Create business
- POST `/slots/:businessId` - Create slot
- (Missing) Working hours endpoint
- (Missing) Break times endpoint

### 2. Schema Mismatch
The frontend was sending:
- `category: string` (e.g., "Plumbing")
- `phone`, `email`, `address` in business profile

The backend expects:
- `categoryId: number` (foreign key to categories table)
- Phone/email pulled from user profile
- No address field in business profile schema

## Solutions Implemented

### 1. Created Separate Onboarding Layout
**File:** `app/(pages)/provider/onboarding/layout.tsx`

This layout:
- Does NOT use DashboardLayout (no sidebar/header)
- Checks if user is authenticated and has provider role
- Checks if business already exists (redirects to dashboard if yes)
- Shows clean onboarding interface without navigation

### 2. Updated `completeOnboarding` Function
**File:** `lib/provider/api.ts`

Changes:
- Removed call to non-existent `/provider/onboarding/complete` endpoint
- Implemented step-by-step completion using existing endpoints:
  1. Upload images to Cloudinary (optional, with error handling)
  2. Create business profile via POST `/businesses`
  3. Create slots one-by-one via POST `/slots/:businessId`
  4. Log warnings for missing endpoints (working hours, break times)

### 3. Fixed Business Profile Schema
**Files Updated:**
- `types/provider/index.ts` - Updated OnboardingData interface
- `components/provider/onboarding/stages/Stage1BusinessProfile.tsx`
- `lib/provider/api.ts`

Changes:
- Changed `category: string` to `categoryId: number`
- Added `category?: string` for display purposes
- Fetch categories from backend (`GET /categories`)
- Display category badges from fetched data
- Made phone/email/address optional (not sent to backend)

### 4. Fixed Slot Creation
**File:** `lib/provider/api.ts`

Changes:
- Updated `createSlot` to match backend endpoint `/slots/:businessId`
- Changed slot format to match backend expectations:
  - Backend expects: `{ startTime, endTime }` with full datetime
  - Combines date + time: `"2024-02-25 09:00:00"`
- Removed batch create (endpoint doesn't exist)
- Creates slots one-by-one with error handling

### 5. Provider Layout Logic
**File:** `app/(pages)/provider/layout.tsx`

Already has correct logic:
- Checks for existing business profile
- Redirects to onboarding if no business exists
- Shows DashboardLayout (sidebar + header) only after onboarding complete

## Data Flow After Fixes

```
User completes onboarding
         ↓
1. Upload images (logo, cover) to Cloudinary
   - Handled gracefully if fails
         ↓
2. Create business profile
   POST /businesses
   {
     name,
     description,
     categoryId,
     logo: URL,
     coverImage: URL,
     website
   }
   - Phone/email pulled from user by backend
         ↓
3. Create availability slots
   Loop through slots:
   POST /slots/:businessId
   {
     startTime: "YYYY-MM-DD HH:mm:ss",
     endTime: "YYYY-MM-DD HH:mm:ss"
   }
         ↓
4. Log warnings for working hours/break times
   (Backend endpoints not yet implemented)
         ↓
5. Return success
         ↓
6. Redirect to /provider/dashboard
         ↓
7. Provider layout checks business exists
   - Shows sidebar + header
```

## Backend Endpoints Used

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/businesses` | POST | Create business profile | ✅ Working |
| `/business/provider/:userId` | GET | Get provider business | ✅ Working |
| `/categories` | GET | List categories | ✅ Working |
| `/slots/:businessId` | POST | Create availability slot | ✅ Working |
| `/slots/:businessId` | GET | Get business slots | ✅ Working |
| `/businesses/:businessId/working-hours` | POST | Save working hours | ❌ Missing |
| `/businesses/:businessId/break-times` | POST | Save break times | ❌ Missing |

## Files Modified

1. **New Files:**
   - `app/(pages)/provider/onboarding/layout.tsx`

2. **Updated Files:**
   - `types/provider/index.ts`
   - `lib/provider/api.ts`
   - `components/provider/onboarding/stages/Stage1BusinessProfile.tsx`
   - `components/provider/onboarding/OnboardingWizard.tsx`
   - `app/(pages)/provider/onboarding/page.tsx`

3. **Unchanged (already correct):**
   - `app/(pages)/provider/layout.tsx` - Already had proper redirect logic

## Testing Checklist

- [x] TypeScript compilation passes
- [ ] Provider without business → onboarding (no sidebar)
- [ ] Category selection works (fetches from backend)
- [ ] Image upload works (logo and cover)
- [ ] Business creation succeeds
- [ ] Slot creation succeeds
- [ ] Completion redirects to dashboard
- [ ] Dashboard shows sidebar + header
- [ ] Provider with existing business → dashboard (skips onboarding)

## Remaining Backend Work

To make the onboarding fully functional, the backend needs:

1. **Working Hours Endpoint:**
```javascript
POST /businesses/:businessId/working-hours
Body: { working_hours: [{ day, isOpen, startTime, endTime }] }
```

2. **Break Times Endpoint:**
```javascript
POST /businesses/:businessId/break-times
Body: { break_times: [{ day?, startTime, endTime }] }
```

3. **Optional: Batch Slot Creation:**
```javascript
POST /businesses/:businessId/slots/batch
Body: { slots: [{ startTime, endTime }] }
```

## How to Test

1. Register/login as a provider (roleId: 2)
2. Should redirect to `/provider/onboarding`
3. No sidebar/header should be visible
4. Complete all 4 stages:
   - Stage 1: Select category, fill details, upload images (optional)
   - Stage 2: Set working hours
   - Stage 3: Add breaks (optional)
   - Stage 4: Create availability slots
5. Click "Complete Setup"
6. Should redirect to `/provider/dashboard`
7. Sidebar and header should now be visible

## Error Handling

The onboarding now handles errors gracefully:
- Image upload failures → Continue without images
- Category fetch failures → Show error message
- Business creation failures → Show error, don't redirect
- Slot creation failures → Log error, continue with other slots
- Missing endpoints → Log warnings, complete onboarding

---

**Status:** ✅ Frontend Fixed, Backend Integration Partial
**Last Updated:** 2026-02-24
