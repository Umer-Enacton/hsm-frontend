# Slot System Redesign - Final Implementation Plan

## User Decisions

Based on user clarification:

| Question | Decision | Notes |
|----------|----------|-------|
| **Slot Interval** | Provider-defined in onboarding | Provider will set the interval during onboarding (e.g., 15, 30, 60 min) |
| **Break Times** | Both options | Support both day-specific and global breaks |
| **Migration** | Manual deletion | User will manually delete all slots from database |
| **Customer View** | Start time only | Show "Available at 9:00 AM", end time shown after service selection |

---

## Implementation Steps

### Step 1: Backend Database Schema Changes

#### 1.1 Update slots table schema
**File**: `home-service-management-backend/models/schema.js`

```javascript
// Remove endTime from slots table
const slots = pgTable("slots", {
  id: serial("id").primaryKey(),
  businessProfileId: integer("business_profile_id")
    .notNull()
    .references(() => businessProfiles.id, { onDelete: "cascade" }),
  startTime: time("start_time").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

#### 1.2 Add working_hours table
**File**: `home-service-management-backend/models/schema.js`

```javascript
const workingHours = pgTable("working_hours", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id")
    .notNull()
    .references(() => businessProfiles.id, { onDelete: "cascade" }),
  day: varchar("day", { length: 10 }).notNull(), // 'monday', 'tuesday', etc.
  isOpen: boolean("is_open").default(true).notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
});
```

#### 1.3 Add break_times table
**File**: `home-service-management-backend/models/schema.js`

```javascript
const breakTimes = pgTable("break_times", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id")
    .notNull()
    .references(() => businessProfiles.id, { onDelete: "cascade" }),
  day: varchar("day", { length: 10 }), // NULL = applies to all days
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
});
```

#### 1.4 Update module exports
**File**: `home-service-management-backend/models/schema.js`

Add to exports:
```javascript
module.exports = {
  Roles,
  Address,
  Category,
  users,
  businessProfiles,
  services,
  slots,
  workingHours,  // NEW
  breakTimes,    // NEW
  bookings,
  feedback,
  roleEnum,
  bookingStatusEnum,
  addressEnum,
};
```

### Step 2: Backend Migration

Create and run migration:
```bash
# User will manually delete existing slots first
# Then run migration
npm run db:generate
npm run db:push
```

### Step 3: Backend Controllers

#### 3.1 Create working hours controller
**File**: `home-service-management-backend/controllers/workingHours.controller.js` (NEW)

#### 3.2 Create break times controller
**File**: `home-service-management-backend/controllers/breakTimes.controller.js` (NEW)

#### 3.3 Update slot controller
**File**: `home-service-management-backend/controllers/slot.controller.js`
- Remove endTime from all operations
- Update validation
- Add unique constraint handling

#### 3.4 Update business controller
**File**: `home-service-management-backend/controllers/business.controller.js`
- Save working hours during onboarding
- Save break times during onboarding
- Auto-generate slots from working hours + break times + interval

#### 3.5 Update booking controller
**File**: `home-service-management-backend/controllers/booking.controller.js`
- Calculate booking end time from slot.startTime + service.duration
- Validate against working hours
- Check for overlapping bookings using calculated times

### Step 4: Backend Routes

#### 4.1 Add working hours routes
**File**: `home-service-management-backend/routes/workingHours.routes.js` (NEW)
- GET `/working-hours/:businessId`
- POST `/working-hours/:businessId`

#### 4.2 Add break times routes
**File**: `home-service-management-backend/routes/breakTimes.routes.js` (NEW)
- GET `/break-times/:businessId`
- POST `/break-times/:businessId`

#### 4.3 Update index.js
**File**: `home-service-management-backend/index.js`
- Import and register new routes

### Step 5: Frontend Types

#### 5.1 Update provider types
**File**: `hsm-frontend/types/provider/index.ts`
- Update Slot interface (remove endTime)
- Ensure WorkingHours and BreakTime types are complete

### Step 6: Frontend API Functions

#### 6.1 Create working hours API
**File**: `hsm-frontend/lib/provider/workingHours.ts` (NEW)
- getWorkingHours(businessId)
- setWorkingHours(businessId, hours)

#### 6.2 Create break times API
**File**: `hsm-frontend/lib/provider/breakTimes.ts` (NEW)
- getBreakTimes(businessId)
- setBreakTimes(businessId, breaks)

#### 6.3 Update slots API
**File**: `hsm-frontend/lib/provider/slots.ts`
- Update createSlot (remove endTime)
- Update format functions

### Step 7: Frontend Onboarding

#### 7.1 Update Stage 2 (Working Hours)
**File**: `hsm-frontend/components/provider/onboarding/stages/Stage2WorkingHours.tsx`
- No major changes needed (already collects working hours correctly)

#### 7.2 Update Stage 3 (Break Times)
**File**: `hsm-frontend/components/provider/onboarding/stages/Stage3BreakTimes.tsx`
- Ensure it supports day-specific and global breaks

#### 7.3 Update Stage 4 (Availability)
**File**: `hsm-frontend/components/provider/onboarding/stages/Stage4Availability.tsx`
- Add slot interval input
- Remove date range input
- Remove slot duration input
- Show preview of slots that will be generated
- Simplify to just "Generate from working hours"

### Step 8: Frontend Availability Page

#### 8.1 Update availability page
**File**: `hsm-frontend/app/(pages)/provider/availability/page.tsx`
- Update to show only start times
- Remove endTime from display

#### 8.2 Update SlotDialog
**File**: `hsm-frontend/components/provider/availability/SlotDialog.tsx`
- Remove endTime input
- Only collect start time
- Remove overlap validation (backend handles it)

#### 8.3 Update SlotCard
**File**: `hsm-frontend/components/provider/availability/SlotCard.tsx`
- Show only start time
- Remove time range display

#### 8.4 Update SlotTimeline
**File**: `hsm-frontend/components/provider/availability/SlotTimeline.tsx`
- Update to work with start times only
- Calculate end time for display using default duration or show as point

### Step 9: Frontend Onboarding Completion

#### 9.1 Update onboarding API call
**File**: `hsm-frontend/lib/provider/api.ts`
- Send working hours, break times, and slot interval to backend
- Remove manual slot creation (backend auto-generates)

---

## Files to Create

### Backend
1. `controllers/workingHours.controller.js`
2. `controllers/breakTimes.controller.js`
3. `routes/workingHours.routes.js`
4. `routes/breakTimes.routes.js`

### Frontend
1. `lib/provider/workingHours.ts`
2. `lib/provider/breakTimes.ts`

## Files to Modify

### Backend
1. `models/schema.js` - Update slots table, add working_hours and break_times
2. `controllers/slot.controller.js` - Remove endTime operations
3. `controllers/business.controller.js` - Save working hours/break times, generate slots
4. `controllers/booking.controller.js` - Calculate end time, validate overlaps
5. `index.js` - Register new routes

### Frontend
1. `types/provider/index.ts` - Update Slot interface
2. `lib/provider/slots.ts` - Remove endTime from functions
3. `lib/provider/api.ts` - Update onboarding completion
4. `components/provider/onboarding/stages/Stage4Availability.tsx` - Add interval, remove date range
5. `app/(pages)/provider/availability/page.tsx` - Update display
6. `components/provider/availability/SlotDialog.tsx` - Remove endTime input
7. `components/provider/availability/SlotCard.tsx` - Show start time only

---

## Implementation Order

1. ✅ **Phase 1**: Backend schema and migrations
2. ✅ **Phase 2**: Backend controllers and routes
3. ✅ **Phase 3**: Frontend types and API functions
4. ✅ **Phase 4**: Frontend onboarding updates
5. ✅ **Phase 5**: Frontend availability page updates
6. ✅ **Phase 6**: Testing

---

## Ready to Implement ✅

All decisions finalized. Ready to proceed with implementation.
