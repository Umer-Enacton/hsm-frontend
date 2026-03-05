# Slot System Redesign - Implementation Summary

## Changes Completed

### Backend Changes ✅

#### 1. Schema Updates (`models/schema.js`)
- ✅ Removed `endTime` from `slots` table
- ✅ Added `workingHours` table with fields: id, businessId, day, isOpen, startTime, endTime
- ✅ Added `breakTimes` table with fields: id, businessId, day (nullable), startTime, endTime

#### 2. New Controllers
- ✅ `controllers/workingHours.controller.js` - Set/get working hours
- ✅ `controllers/breakTimes.controller.js` - Set/get break times
- ✅ Updated `controllers/slot.controller.js`:
  - Removed all `endTime` logic
  - Added `generateSlotsFromWorkingHours()` function
  - Added helper functions: `timeToMinutes()`, `minutesToTime()`, `addMinutes()`
  - Removed overlap detection (now only checks duplicate start times)

#### 3. New Routes
- ✅ `routes/workingHours.routes.js` - POST/GET `/working-hours/:businessId`
- ✅ `routes/breakTimes.routes.js` - POST/GET `/break-times/:businessId`
- ✅ Updated `routes/slot.route.js` - Added POST `/slots/:businessId/generate`

#### 4. Validation Updates (`helper/validation.js`)
- ✅ Updated `slotSchema` to only require `startTime`

#### 5. Main App Registration (`index.js`)
- ✅ Registered new route imports

### Frontend Changes ✅

#### 1. Type Updates (`types/provider/index.ts`)
- ✅ Added `Slot` interface with only `startTime`
- ✅ Kept `AvailabilitySlot` for onboarding with optional `endTime`

#### 2. API Functions Updates
- ✅ `lib/provider/api.ts`:
  - Updated working hours endpoints to `/working-hours/:businessId`
  - Updated break times endpoints to `/break-times/:businessId`
  - Updated `completeOnboarding()` to save working hours/break times and trigger slot generation
  - Removed manual slot creation loops
- ✅ `lib/provider/slots.ts`:
  - Updated `Slot` interface to only have `startTime`
  - Updated `createSlot()` to only send `startTime`
  - Removed `formatTimeRange()` function
  - Added `formatTimeWithDuration()` function

#### 3. Component Updates
- ✅ `components/provider/onboarding/stages/Stage4Availability.tsx`:
  - Added slot interval selection (15/30/60 min)
  - Removed date range inputs
  - Removed slot duration input
  - Shows slot generation summary
  - Simplified to just "Generate from working hours"
- ✅ `components/provider/availability/SlotDialog.tsx`:
  - Removed `endTime` input
  - Only collects start time
  - Removed overlap validation
- ✅ `components/provider/availability/SlotCard.tsx`:
  - Shows only start time
  - Updated labels
- ✅ `components/provider/availability/SlotTimeline.tsx`:
  - Updated to display start times as markers
  - Simplified visualization
- ✅ `app/(pages)/provider/availability/page.tsx`:
  - Updated `handleCreateSlot` to only accept `startTime`

---

## Migration Steps (User Action Required)

### Step 1: Backup Database ⚠️
```bash
pg_dump > backup_before_slot_redesign.sql
```

### Step 2: Delete Existing Slots (As User Requested)
The user will manually delete all existing slots from the database.

```sql
-- User to run manually
DELETE FROM slots;
```

### Step 3: Run Database Migration
```bash
cd home-service-management-backend
npm run db:generate
npm run db:push
```

This will:
- Drop `endTime` column from `slots` table
- Create `working_hours` table
- Create `break_times` table

### Step 4: Test Onboarding Flow
1. Complete onboarding as a new provider
2. Verify working hours are saved
3. Verify break times are saved
4. Verify slots are generated automatically

### Step 5: Test Availability Page
1. Navigate to `/provider/availability`
2. Verify start times are displayed correctly
3. Add a new start time
4. Delete a start time

---

## API Endpoint Changes

| Old Endpoint | New Endpoint | Change |
|--------------|--------------|--------|
| `POST /businesses/:id/working-hours` | `POST /working-hours/:businessId` | Path changed |
| `GET /businesses/:id/working-hours` | `GET /working-hours/:businessId` | Path changed |
| `POST /businesses/:id/break-times` | `POST /break-times/:businessId` | Path changed |
| `GET /businesses/:id/break-times` | `GET /break-times/:businessId` | Path changed |
| `POST /slots/:businessId` | `POST /slots/:businessId` | Body changed (no endTime) |
| NEW | `POST /slots/:businessId/generate` | Generate slots from working hours |

---

## Data Model Changes

### Slots Table (Before)
```sql
slots (
  id serial,
  business_profile_id int,
  start_time time,      -- "09:00:00"
  end_time time,        -- "10:00:00" ❌ REMOVED
  created_at timestamp
)
```

### Slots Table (After)
```sql
slots (
  id serial,
  business_profile_id int,
  start_time time,      -- "09:00:00" ✅ ONLY START TIME
  created_at timestamp
)
```

### New Tables

#### working_hours
```sql
working_hours (
  id serial,
  business_id int,
  day varchar,          -- "monday", "tuesday", etc.
  is_open boolean,
  start_time time,      -- "09:00:00"
  end_time time,        -- "17:00:00"
)
```

#### break_times
```sql
break_times (
  id serial,
  business_id int,
  day varchar,          -- NULL = all days, or "monday", etc.
  start_time time,      -- "12:00:00"
  end_time time,        -- "13:00:00"
)
```

---

## Booking Flow Changes (Pending Implementation)

The booking controller needs to be updated to calculate end times based on service duration.

### Current Booking Flow (Broken)
```javascript
// Booking has slot with startTime and endTime
const booking = {
  slotId: slot.id,
  startTime: slot.startTime,
  endTime: slot.endTime, // ❌ No longer exists
};
```

### New Booking Flow (To Implement)
```javascript
// Get slot start time
const startTime = slot.startTime; // "09:00:00"

// Get service duration
const service = await getService(serviceId);
const durationMinutes = service.EstimateDuration; // e.g., 60

// Calculate booking end time
const endTime = addMinutes(startTime, durationMinutes); // "10:00:00"

// Store calculated times in booking
const booking = {
  slotId: slot.id,
  startTime: startTime,
  // Backend may need to store calculated endTime in bookings table
};
```

### Booking Validation (To Implement)
```javascript
// Validate booking doesn't extend past working hours
if (endTime > workingHours.endTime) {
  throw new Error("Service would end after working hours");
}

// Check for overlapping bookings
const overlap = await checkBookingOverlap(
  businessId,
  bookingDate,
  startTime,
  endTime
);
```

---

## Testing Checklist

### Backend Tests
- [ ] Working hours can be saved and retrieved
- [ ] Break times can be saved and retrieved
- [ ] Slots are generated from working hours
- [ ] Break times are respected during generation
- [ ] Slot interval is respected (15/30/60 min)
- [ ] Duplicate start times are rejected
- [ ] Slots can be deleted

### Frontend Tests
- [ ] Onboarding Stage 2: Working hours collected correctly
- [ ] Onboarding Stage 3: Break times collected correctly
- [ ] Onboarding Stage 4: Slot interval selection works
- [ ] Onboarding completion: Working hours saved
- [ ] Onboarding completion: Break times saved
- [ ] Onboarding completion: Slots generated
- [ ] Availability page: Start times displayed
- [ ] Availability page: Can add start time
- [ ] Availability page: Can delete start time

---

## Rollback Plan

If issues occur:
1. Restore database: `psql < backup_before_slot_redesign.sql`
2. Revert backend code to previous commit
3. Revert frontend code to previous commit

---

## Status: ⏸️ READY FOR TESTING

All code changes are complete. Ready for:
1. Database migration
2. Testing onboarding flow
3. Testing availability page
4. Implementing booking controller updates
