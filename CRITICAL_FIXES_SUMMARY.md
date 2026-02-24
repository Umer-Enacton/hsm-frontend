# Provider Onboarding - Critical Fixes Applied

## Issues Fixed

### 1. ✅ Slot Creation Time Format Error
**Problem:**
```
Validation failed:
- Start time must be HH:mm:ss
- End time must be HH:mm:ss
```

**Root Cause:**
- Backend database schema uses `time` type (NOT timestamp)
- Backend only stores TIME, no date field
- Backend expects format: `"09:00:00"` (HH:mm:ss)
- Frontend was sending: `"2024-02-25 09:00"` (date + time)

**Database Schema:**
```javascript
// backend/models/schema.js
const slots = pgTable("slots", {
  id: serial("id").primaryKey(),
  businessProfileId: integer("business_profile_id").notNull(),
  startTime: time("start_time").notNull(),  // ← TIME only, no date!
  endTime: time("end_time").notNull(),    // ← TIME only, no date!
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**Solution:**
- Updated `completeOnboarding()` to format times correctly
- Converts `"09:00"` → `"09:00:00"` (adds seconds)
- Only creates unique time slots (deduplicates)
- Ignores date field in slot creation

**Code Change:**
```typescript
// Before (WRONG):
startTime: `${slot.date} ${slot.startTime}` // "2024-02-25 09:00"

// After (CORRECT):
const startTime = slot.startTime + ":00";  // "09:00:00"
const endTime = slot.endTime + ":00";      // "10:00:00"
```

### 2. ✅ Sidebar/Header Showing on Onboarding
**Problem:**
- Onboarding page was showing sidebar and header
- Should be full-screen, clean layout

**Root Cause:**
- Onboarding was inside provider route group: `app/(pages)/provider/onboarding/`
- Next.js was using BOTH layouts:
  1. `app/(pages)/provider/layout.tsx` (with sidebar/header)
  2. `app/(pages)/provider/onboarding/layout.tsx` (without sidebar)

**Solution:**
- Moved onboarding OUT of provider route group
- New path: `app/(pages)/onboarding/`
- Now onboarding has its own independent layout
- URL changed from `/provider/onboarding` to `/onboarding`

**File Structure Changes:**
```
Before:
app/(pages)/provider/
├── layout.tsx (has sidebar)
└── onboarding/
    ├── layout.tsx (no sidebar)
    └── page.tsx

After:
app/(pages)/
├── provider/
│   └── layout.tsx (has sidebar)
└── onboarding/
    ├── layout.tsx (no sidebar, independent)
    └── page.tsx
```

**Updated References:**
- Provider layout: `/provider/onboarding` → `/onboarding`
- Middleware: Updated to protect `/onboarding` route
- Redirects: All point to `/onboarding`

## Route Structure

### Onboarding Route
- **URL:** `/onboarding`
- **Layout:** Independent (no sidebar, no header)
- **Access:** Providers without business profile
- **Redirects to:** `/provider/dashboard` (after completion)

### Provider Routes
- **Base:** `/provider/*`
- **Layout:** DashboardLayout (sidebar + header)
- **Access:** Providers with business profile
- **Protected by:** Provider layout checks

## Flow After Fixes

### New Provider (No Business)
```
Login
  ↓
Provider Layout Check: No business?
  ↓
Redirect to /onboarding (NO sidebar/header)
  ↓
Stage 1: Business Profile
  ↓
Stage 2: Working Hours
  ↓
Stage 3: Break Times (optional)
  ↓
Stage 4: Availability
  • Generate slots (e.g., 09:00:00, 10:00:00, etc.)
  ↓
Complete Setup
  • Upload images via backend
  • Create business
  • Create time slots (HH:mm:ss format)
  ↓
Redirect to /provider/dashboard
  ↓
Provider Layout Check: Business exists?
  ↓
Show Dashboard (WITH sidebar/header)
```

### Existing Provider (Has Business)
```
Login
  ↓
Provider Layout Check: Business exists?
  ↓
Direct to /provider/dashboard (WITH sidebar/header)
```

## API Changes

### Slot Creation (Backend)
**Endpoint:** `POST /slots/:businessId`

**Request Format:**
```json
{
  "startTime": "09:00:00",  // HH:mm:ss format
  "endTime": "10:00:00"     // HH:mm:ss format
}
```

**Validation:**
```javascript
// backend/helper/validation.js
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
// Matches: "09:00:00", "23:59:59"
```

**Response:**
```json
{
  "message": "Slot added successfully",
  "slot": {
    "id": 1,
    "businessProfileId": 1,
    "startTime": "09:00:00",
    "endTime": "10:00:00",
    "createdAt": "2026-02-24T..."
  }
}
```

### Image Upload (Backend)
**Endpoints:**
- `POST /upload/logo` - Upload business logo
- `POST /upload/cover-image` - Upload cover image

**Request:**
```
Content-Type: multipart/form-data
FormData: { file: <File> }
```

**Response:**
```json
{
  "success": true,
  "message": "Logo uploaded successfully",
  "data": {
    "url": "https://cloudinary.com/...",
    "publicId": "business/logos/..."
  }
}
```

## Important Notes

### 1. Time Format Always Required
- All times must have seconds: `"HH:mm:ss"`
- Frontend inputs: `"HH:mm"` (09:00)
- Must convert to: `"HH:mm:ss"` (09:00:00)
- Backend validation regex requires seconds

### 2. No Date in Slots
- Backend `slots` table has NO date field
- Only stores recurring time slots
- Same time slot used for all dates
- This is a design limitation of current backend

### 3. Route Protection
- `/onboarding` - Protected by onboarding layout
- `/provider/*` - Protected by provider layout
- Both check for provider role (roleId: 2)

### 4. Layout Independence
- Onboarding layout: Standalone, no parent layout
- Provider layout: Has sidebar + header
- They don't inherit from each other

## Files Modified

### Moved:
- `app/(pages)/provider/onboarding/` → `app/(pages)/onboarding/`

### Updated:
1. `lib/provider/api.ts`
   - Fixed slot time format (HH:mm:ss)
   - Added deduplication for time slots
   - Updated image upload to use backend

2. `app/(pages)/provider/layout.tsx`
   - Updated onboarding path: `/provider/onboarding` → `/onboarding`

3. `app/(pages)/onboarding/layout.tsx`
   - Moved from provider route group
   - Independent layout (no sidebar/header)

## Testing Checklist

- [ ] Navigate to `/onboarding` → NO sidebar/header visible
- [ ] Complete Stage 4 → Generate slots
- [ ] Check network tab: Slot creation uses `"09:00:00"` format
- [ ] Complete onboarding successfully
- [ ] Redirect to `/provider/dashboard`
- [ ] Dashboard shows sidebar/header
- [ ] Existing provider skips onboarding

## Required Actions

### ⚠️ RESTART DEV SERVER ⚠️

Routes have changed. You MUST restart:

```bash
# 1. Stop dev server (Ctrl+C)

# 2. Clear Next.js cache
rm -rf .next

# 3. Restart dev server
npm run dev

# 4. Hard refresh browser
# Ctrl+Shift+R
```

### After Restart:

1. **Test onboarding URL:**
   - Go to: `http://localhost:3000/onboarding`
   - Should see: Full-screen, no sidebar/header

2. **Test slot creation:**
   - Complete Stage 4
   - Check network tab for `POST /slots/1`
   - Request body should have: `"startTime": "09:00:00"`

3. **Test completion:**
   - Click "Complete Setup"
   - Should redirect to `/provider/dashboard`
   - Sidebar and header should appear

## Console Logs (Expected)

```
✅ Completing onboarding with data: {...}
✅ Uploading logo...
✅ Logo uploaded via backend: https://cloudinary.com/...
✅ Creating business profile...
✅ Business created: {id: 1, name: "Test Business"}
✅ Creating 5 availability slots...
✅ Unique time slots created: 5, failed: 0
✅ Onboarding completed successfully!
✅ Setup completed successfully!
```

## Network Requests (Expected)

```
POST /upload/logo              → 200 OK
POST /upload/cover-image       → 200 OK
POST /businesses               → 201 Created
POST /slots/1                  → 201 Created (startTime: "09:00:00")
POST /slots/1                  → 201 Created (startTime: "10:00:00")
POST /slots/1                  → 201 Created (startTime: "11:00:00")
...
```

---

**Status:** ✅ All Critical Fixes Applied
**Action Required:** Restart Dev Server
**Last Updated:** 2026-02-24
