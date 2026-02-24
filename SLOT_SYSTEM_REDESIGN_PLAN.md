# Slot System Redesign Plan

## Current Architecture (As-Is)

### Database Schema
```sql
slots table:
  - id (serial)
  - businessProfileId (integer)
  - startTime (time) -- "HH:mm:ss" format
  - endTime (time)   -- "HH:mm:ss" format
  - createdAt (timestamp)
```

### Current Flow
1. **Onboarding Stage 2**: Provider sets working hours (Mon-Fri 9-5)
2. **Onboarding Stage 3**: Provider sets break times (optional)
3. **Onboarding Stage 4**: Provider generates slots for date range (e.g., Mar 15-29)
   - Generates date-specific slots: "2024-03-15 09:00-10:00"
   - Backend extracts unique time templates: "09:00:00" - "10:00:00"
   - Only stores 5-10 unique time templates in database
4. **Availability Page**: Provider manages time templates (CRUD)

### Problem Identified by User
> "I don't need end time in slot table, just start time. In real time there can be services because time depends on service, so there is no benefit for end time. The end time we will display estimate to customer."

### Core Issues
1. ** endTime is redundant** - Service duration determines actual end time
2. **Services have different durations** - 30 min haircut vs 2 hour cleaning
3. **Fixed slot duration doesn't work** - Can't accommodate varying service times
4. **Two sources of truth** - Slots have endTime, but services also have duration

---

## Proposed Architecture (To-Be)

### Core Concept
**Slots = Available Start Times Only**
- Slots contain only `startTime` (no `endTime`)
- When customer books: `bookingEndTime = slot.startTime + service.duration`
- Each service can have different duration
- More flexible, realistic system

### New Database Schema

#### 1. Simplified Slots Table
```sql
slots table (NEW):
  - id (serial)
  - businessProfileId (integer)
  - startTime (time) -- "HH:mm:ss" format only
  - createdAt (timestamp)
  - UNIQUE(businessProfileId, startTime) -- Prevent duplicates
```

#### 2. Working Hours Table (NEW or reuse existing)
```sql
working_hours table:
  - id (serial)
  - businessId (integer)
  - day (varchar) -- "monday", "tuesday", etc.
  - isOpen (boolean)
  - startTime (time) -- "09:00:00"
  - endTime (time)   -- "17:00:00"
```

**Note**: Currently working hours are collected but not stored in dedicated table.
They're only used during onboarding to generate slots. We need to persist them.

#### 3. Break Times Table (NEW or reuse existing)
```sql
break_times table:
  - id (serial)
  - businessId (integer)
  - day (varchar) -- "monday", "all", etc. (null = all days)
  - startTime (time) -- "12:00:00"
  - endTime (time)   -- "13:00:00"
```

### New Slot Generation Logic

#### One-Time Generation (Onboarding)
```javascript
// When provider completes onboarding:
for (business in working_hours) {
  for (day in business.openDays) {
    let currentTime = day.startTime;
    while (currentTime < day.endTime) {
      // Check if currentTime falls within any break time
      if (!isInBreakTime(currentTime, day.breaks)) {
        createSlot(business.id, currentTime);
      }
      // Increment by service-independent interval (e.g., 30 min)
      currentTime = addMinutes(currentTime, 30);
    }
  }
}
```

#### Key Changes
1. **Slot Interval**: Fixed interval (e.g., 30 min) instead of service duration
2. **No Date Component**: Generate once, repeat daily
3. **Break Time Awareness**: Skip slots during breaks
4. **Start Time Only**: Store only when bookings can begin

### Booking Flow Changes

#### Customer Selection
```javascript
// Customer sees:
Available start times for 2024-03-15:
- 09:00 (Service: Haircut 30min → completes 09:30)
- 09:00 (Service: Cleaning 120min → completes 11:00)
- 09:30 (Service: Haircut 30min → completes 10:00)
- 10:00 (Service: Cleaning 120min → completes 12:00)
```

#### Backend Validation (NEW)
```javascript
// When booking:
const bookingStart = slot.startTime; // "09:00:00"
const service = await getService(serviceId);
const bookingEnd = addMinutes(bookingStart, service.EstimateDuration);

// Validate against working hours
if (bookingEnd > workingHours.endTime) {
  throw new Error("Service would end after working hours");
}

// Check for overlaps with existing bookings
const hasOverlap = await checkBookingOverlap(
  businessId, date, bookingStart, bookingEnd
);
```

---

## Implementation Plan

### Phase 1: Database Changes ⚠️ **CRITICAL**

#### Step 1.1: Create Migration Script
```javascript
// migrations/remove_slot_end_time.js

// 1. Add new column for startTime only (temporarily)
await db.execute(`
  ALTER TABLE slots ADD COLUMN start_time_only time;
`);

// 2. Copy startTime to new column
await db.execute(`
  UPDATE slots SET start_time_only = start_time;
`);

// 3. Drop endTime column
await db.execute(`
  ALTER TABLE slots DROP COLUMN end_time;
`);

// 4. Rename start_time_only to start_time
await db.execute(`
  ALTER TABLE slots RENAME COLUMN start_time TO start_time_old;
  ALTER TABLE slots RENAME COLUMN start_time_only TO start_time;
  ALTER TABLE slots DROP COLUMN start_time_old;
`);

// 5. Add unique constraint
await db.execute(`
  ALTER TABLE slots ADD CONSTRAINT slots_unique_start_time
  UNIQUE(business_profile_id, start_time);
`);
```

#### Step 1.2: Create Working Hours Table
```javascript
// migrations/create_working_hours_table.js
await db.execute(`
  CREATE TABLE working_hours (
    id SERIAL PRIMARY KEY,
    business_id INTEGER NOT NULL
      REFERENCES business_profiles(id) ON DELETE CASCADE,
    day VARCHAR(10) NOT NULL, -- 'monday', 'tuesday', etc.
    is_open BOOLEAN DEFAULT true NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    UNIQUE(business_id, day)
  );
`);
```

#### Step 1.3: Create Break Times Table
```javascript
// migrations/create_break_times_table.js
await db.execute(`
  CREATE TABLE break_times (
    id SERIAL PRIMARY KEY,
    business_id INTEGER NOT NULL
      REFERENCES business_profiles(id) ON DELETE CASCADE,
    day VARCHAR(10), -- NULL = applies to all days
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    CHECK (end_time > start_time)
  );
`);
```

### Phase 2: Backend Changes

#### Step 2.1: Update Schema
**File**: `models/schema.js`

```javascript
const slots = pgTable("slots", {
  id: serial("id").primaryKey(),
  businessProfileId: integer("business_profile_id")
    .notNull()
    .references(() => businessProfiles.id, { onDelete: "cascade" }),
  startTime: time("start_time").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Add working hours table
const workingHours = pgTable("working_hours", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id")
    .notNull()
    .references(() => businessProfiles.id, { onDelete: "cascade" }),
  day: varchar("day", { length: 10 }).notNull(),
  isOpen: boolean("is_open").default(true).notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
});

// Add break times table
const breakTimes = pgTable("break_times", {
  id: serial("id").primaryKey(),
  businessId: integer("business_id")
    .notNull()
    .references(() => businessProfiles.id, { onDelete: "cascade" }),
  day: varchar("day", { length: 10 }), // NULL = all days
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
});
```

#### Step 2.2: Update Slot Controller
**File**: `controllers/slot.controller.js`

**Changes:**
1. Remove endTime from input validation
2. Remove overlap detection based on endTime
3. Change overlap detection to: only check duplicate startTime
4. Add unique constraint handling

```javascript
// CREATE SLOT (NEW)
exports.createSlot = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { startTime } = req.body; // Only startTime now

    // Validate
    if (!startTime) {
      return res.status(400).json({ message: "Start time is required" });
    }

    // Check for duplicate (handled by unique constraint, but check for friendly error)
    const [existing] = await db.select()
      .from(slots)
      .where(and(
        eq(slots.businessProfileId, businessId),
        eq(slots.startTime, startTime)
      ));

    if (existing) {
      return res.status(400).json({ message: "Slot with this start time already exists" });
    }

    const [newSlot] = await db.insert(slots)
      .values({ businessProfileId: businessId, startTime })
      .returning();

    res.status(201).json({ slot: newSlot, message: "Slot created successfully" });
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ message: "Slot with this start time already exists" });
    }
    console.error("Error creating slot:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET SLOTS (No change needed, just won't return endTime)
exports.getBusinessSlots = async (req, res) => {
  try {
    const { businessId } = req.params;
    const businessSlots = await db.select()
      .from(slots)
      .where(eq(slots.businessProfileId, businessId))
      .orderBy(slots.startTime);

    res.status(200).json({ slots: businessSlots });
  } catch (error) {
    console.error("Error fetching slots:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
```

#### Step 2.3: Create Working Hours Controller
**File**: `controllers/workingHours.controller.js` (NEW)

```javascript
const { db } = require("../config/db");
const { workingHours, breakTimes } = require("../models/schema");
const { eq, and } = require("drizzle-orm");

// Set working hours for a business
exports.setWorkingHours = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { hours } = req.body; // Array of { day, isOpen, startTime, endTime }

    // Delete existing
    await db.delete(workingHours).where(eq(workingHours.businessId, businessId));

    // Insert new
    const result = await db.insert(workingHours)
      .values(hours.map(h => ({ ...h, businessId })))
      .returning();

    res.status(200).json({ hours: result, message: "Working hours updated" });
  } catch (error) {
    console.error("Error setting working hours:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get working hours
exports.getWorkingHours = async (req, res) => {
  try {
    const { businessId } = req.params;
    const hours = await db.select()
      .from(workingHours)
      .where(eq(workingHours.businessId, businessId));

    res.status(200).json({ hours });
  } catch (error) {
    console.error("Error fetching working hours:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Set break times
exports.setBreakTimes = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { breaks } = req.body;

    await db.delete(breakTimes).where(eq(breakTimes.businessId, businessId));

    const result = await db.insert(breakTimes)
      .values(breaks.map(b => ({ ...b, businessId })))
      .returning();

    res.status(200).json({ breaks: result, message: "Break times updated" });
  } catch (error) {
    console.error("Error setting break times:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
```

#### Step 2.4: Update Business Controller
**File**: `controllers/business.controller.js`

**In `completeOnboarding`:**
1. Save working hours to database
2. Save break times to database (if provided)
3. Generate slots from working hours + break times

```javascript
// NEW: Generate slots from working hours
async function generateSlotsFromWorkingHours(businessId, workingHours, breakTimes) {
  const SLOT_INTERVAL_MINUTES = 30; // Configurable

  for (const wh of workingHours) {
    if (!wh.isOpen) continue;

    let currentMinutes = timeToMinutes(wh.startTime);
    const endMinutes = timeToMinutes(wh.endTime);

    while (currentMinutes < endMinutes) {
      const timeStr = minutesToTime(currentMinutes);

      // Check if this time is in a break
      const inBreak = breakTimes.some(bt => {
        if (bt.day && bt.day !== wh.day) return false; // Different day
        const breakStart = timeToMinutes(bt.startTime);
        const breakEnd = timeToMinutes(bt.endTime);
        return currentMinutes >= breakStart && currentMinutes < breakEnd;
      });

      if (!inBreak) {
        try {
          await db.insert(slots).values({
            businessProfileId: businessId,
            startTime: timeStr
          }).onConflictDoNothing(); // Skip duplicates
        } catch (e) {
          // Ignore duplicate errors
        }
      }

      currentMinutes += SLOT_INTERVAL_MINUTES;
    }
  }
}

// Helper functions
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`;
}

// In completeOnboarding function:
exports.completeOnboarding = async (req, res) => {
  try {
    // ... existing business creation code ...

    // NEW: Save working hours
    if (req.body.workingHours) {
      await db.insert(workingHours)
        .values(req.body.workingHours.map(wh => ({ ...wh, businessId: business.id })))
        .returning();
    }

    // NEW: Save break times
    if (req.body.breakTimes) {
      await db.insert(breakTimes)
        .values(req.body.breakTimes.map(bt => ({ ...bt, businessId: business.id })))
        .returning();
    }

    // NEW: Generate slots from working hours
    await generateSlotsFromWorkingHours(
      business.id,
      req.body.workingHours || [],
      req.body.breakTimes || []
    );

    // ... rest of existing code ...
  } catch (error) {
    console.error("Error completing onboarding:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
```

#### Step 2.5: Update Booking Controller
**File**: `controllers/booking.controller.js`

**Add validation for service duration + working hours:**

```javascript
// In createBooking function:
exports.createBooking = async (req, res) => {
  try {
    const { serviceId, slotId, bookingDate, addressId } = req.body;
    const customerId = req.token.id;

    // Get service
    const [service] = await db.select()
      .from(services)
      .where(eq(services.id, serviceId));

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    // Get slot (only has startTime now)
    const [slot] = await db.select()
      .from(slots)
      .where(eq(slots.id, slotId));

    if (!slot) {
      return res.status(404).json({ message: "Slot not found" });
    }

    // Calculate booking end time
    const startTime = slot.startTime; // "09:00:00"
    const durationMinutes = service.EstimateDuration;
    const endTime = addMinutes(startTime, durationMinutes);

    // Get working hours for the day
    const dayOfWeek = getDayOfWeek(bookingDate); // "monday", etc.
    const [workingHours] = await db.select()
      .from(workingHoursTable)
      .where(and(
        eq(workingHoursTable.businessId, slot.businessProfileId),
        eq(workingHoursTable.day, dayOfWeek)
      ));

    // Validate: Booking must be within working hours
    if (workingHours) {
      if (startTime < workingHours.startTime) {
        return res.status(400).json({ message: "Booking starts before working hours" });
      }
      if (endTime > workingHours.endTime) {
        return res.status(400).json({ message: "Service would end after working hours" });
      }
    }

    // Check for overlapping bookings
    const overlapQuery = `
      SELECT * FROM bookings
      WHERE business_profile_id = $1
        AND booking_date::date = $2
        AND status NOT IN ('cancelled', 'rejected')
        AND (
          (start_time < $3 AND end_time > $4) OR
          (start_time < $3 AND end_time > $3) OR
          (start_time < $4 AND end_time > $4) OR
          (start_time >= $3 AND end_time <= $4)
        )
    `;
    const overlaps = await db.execute(overlapQuery, [
      slot.businessProfileId,
      bookingDate,
      startTime,
      endTime
    ]);

    if (overlaps.length > 0) {
      return res.status(400).json({ message: "This time slot is already booked" });
    }

    // Create booking
    const [newBooking] = await db.insert(bookings)
      .values({
        customerId,
        businessProfileId: slot.businessProfileId,
        serviceId,
        slotId,
        addressId,
        bookingDate: new Date(`${bookingDate}T${startTime}`),
        status: 'pending',
        totalPrice: service.price,
      })
      .returning();

    res.status(201).json({ booking: newBooking, message: "Booking created successfully" });
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Helper: Add minutes to time string
function addMinutes(timeStr, minutes) {
  const [hours, mins, secs] = timeStr.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMins = totalMinutes % 60;
  return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}:00`;
}

// Helper: Get day of week from date string
function getDayOfWeek(dateStr) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const date = new Date(dateStr);
  return days[date.getDay()];
}
```

### Phase 3: Frontend Changes

#### Step 3.1: Update Types
**File**: `types/provider/index.ts`

```typescript
// Update Slot interface
export interface Slot {
  id: number;
  businessId: number;
  startTime: string; // Only startTime now
  createdAt?: string;
}

// Add WorkingHours and BreakTime types if not present
export interface WorkingHours {
  id?: number;
  businessId: number;
  day: DayOfWeek;
  isOpen: boolean;
  startTime?: string;
  endTime?: string;
}

export interface BreakTime {
  id?: number;
  businessId: number;
  day?: DayOfWeek; // NULL = all days
  startTime: string;
  endTime: string;
}
```

#### Step 3.2: Update Slot API Functions
**File**: `lib/provider/slots.ts`

```typescript
// Update createSlot - only send startTime
export async function createSlot(
  businessId: number,
  slotData: { startTime: string } // No endTime now
): Promise<Slot> {
  const response = await api.post<{ slot: Slot; message: string }>(
    `/slots/${businessId}`,
    slotData
  );
  return response.slot;
}

// Update format functions - only work with startTime
export function formatSlotTime(timeStr: string): string {
  // "09:00:00" → "09:00"
  return timeStr.substring(0, 5);
}

export function formatTimeRange(startTime: string, duration?: number): string {
  // With duration: "09:00 - 09:30" (for display)
  // Without duration: just "09:00"
  const start = formatSlotTime(startTime);
  if (!duration) return start;

  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + duration;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  const end = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;

  return `${start} - ${end}`;
}
```

#### Step 3.3: Update Availability Page
**File**: `app/(pages)/provider/availability/page.tsx`

**Changes:**
1. Remove endTime from display
2. Show only start times
3. Update SlotDialog to only collect start time
4. Remove overlap validation (handled by unique constraint)
5. Add duration preview based on selected service

#### Step 3.4: Update SlotDialog Component
**File**: `components/provider/availability/SlotDialog.tsx`

```typescript
// Simplified - only collect start time
export function SlotDialog({ open, onOpenChange, onSubmit }: SlotDialogProps) {
  const [startHour, setStartHour] = useState("09");
  const [startMinute, setStartMinute] = useState("00");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const startTime = `${startHour.padStart(2, "0")}:${startMinute.padStart(2, "0")}:00`;

    // No overlap check needed - backend handles unique constraint
    await onSubmit({ startTime });
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Start Time</DialogTitle>
          <DialogDescription>
            Add a time when customers can start bookings
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Label>Start Time *</Label>
            <div className="flex gap-2">
              <Select value={startHour} onValueChange={setStartHour}>
                {/* Hour options */}
              </Select>
              <span>:</span>
              <Select value={startMinute} onValueChange={setStartMinute}>
                <SelectItem value="00">00</SelectItem>
                <SelectItem value="15">15</SelectItem>
                <SelectItem value="30">30</SelectItem>
                <SelectItem value="45">45</SelectItem>
              </Select>
            </div>

            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm">
                Customers can book services starting at <strong>{startHour}:{startMinute}</strong>
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Service duration will determine end time
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit">Add Start Time</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

#### Step 3.5: Update Onboarding Stage 4
**File**: `components/provider/onboarding/stages/Stage4Availability.tsx`

**Major simplification:**
1. Remove date range input (no longer needed)
2. Remove slot duration input (no longer needed)
3. Show summary of what will be generated
4. Just confirm "Generate slots from working hours"

```typescript
export function Stage4Availability({
  workingHours,
  breakTimes,
  onNext
}: Stage4AvailabilityProps) {

  const calculateSlotCount = () => {
    const SLOT_INTERVAL = 30; // minutes
    let totalSlots = 0;

    for (const wh of workingHours) {
      if (!wh.isOpen) continue;

      const startMins = timeToMinutes(wh.startTime);
      const endMins = timeToMinutes(wh.endTime);
      const dayMins = endMins - startMins;

      // Calculate break minutes for this day
      const breakMins = breakTimes
        .filter(bt => !bt.day || bt.day === wh.day)
        .reduce((sum, bt) => {
          return sum + (timeToMinutes(bt.endTime) - timeToMinutes(bt.startTime));
        }, 0);

      const availableMins = dayMins - breakMins;
      totalSlots += Math.floor(availableMins / SLOT_INTERVAL);
    }

    return totalSlots;
  };

  const handleConfirm = () => {
    onNext({
      mode: SlotMode.AUTO,
      slots: [], // No date-specific slots needed
      autoGenerateConfig: {
        workingHours,
        breakTimes
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-primary/5">
        <h3 className="font-semibold">Slot Generation Summary</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Based on your working hours and break times, we will generate:
        </p>
        <p className="text-2xl font-bold mt-2">{calculateSlotCount()} start times</p>
        <p className="text-xs text-muted-foreground mt-1">
          Available every {30} minutes during your working hours
        </p>
      </Card>

      <div className="space-y-2">
        <h4 className="font-medium">Your Working Hours</h4>
        {workingHours.filter(wh => wh.isOpen).map(wh => (
          <div key={wh.day} className="flex justify-between text-sm">
            <span className="capitalize">{wh.day}</span>
            <span>{wh.startTime} - {wh.endTime}</span>
          </div>
        ))}
      </div>

      <Button onClick={handleConfirm} className="w-full">
        Generate Start Times & Continue
      </Button>
    </div>
  );
}
```

#### Step 3.6: Update Onboarding Completion
**File**: `lib/provider/api.ts`

```typescript
// In completeOnboarding function:
export async function completeOnboarding(data: OnboardingData) {
  // ... existing business creation code ...

  // Save working hours
  if (data.workingHours) {
    await api.post(`/working-hours/${business.id}`, {
      hours: data.workingHours
    });
  }

  // Save break times
  if (data.breakTimes) {
    await api.post(`/break-times/${business.id}`, {
      breaks: data.breakTimes
    });
  }

  // Slots are auto-generated by backend from working hours
  // No need to manually create slots anymore

  return { success: true, business };
}
```

### Phase 4: Testing & Validation

#### Test Cases

1. **Slot Generation**
   - [ ] Working hours 9-5 generates slots every 30 min
   - [ ] Break times are respected
   - [ ] Closed days have no slots
   - [ ] Different hours per day work correctly

2. **Booking Flow**
   - [ ] 30 min service: 09:00 → 09:30
   - [ ] 120 min service: 09:00 → 11:00
   - [ ] Booking that ends after working hours is rejected
   - [ ] Overlapping bookings are prevented

3. **Availability Management**
   - [ ] Can add start time
   - [ ] Cannot add duplicate start time
   - [ ] Can delete start time
   - [ ] Display shows only start times

4. **Migration**
   - [ ] Existing slots converted correctly
   - [ ] endTime data removed safely
   - [ ] No data loss

### Phase 5: Deployment Strategy

#### Rollout Plan

1. **Backup Database**
   ```bash
   pg_dump > backup_before_slot_redesign.sql
   ```

2. **Run Migrations**
   ```bash
   npm run db:push
   ```

3. **Deploy Backend**
   - Deploy new controllers
   - Deploy new schema

4. **Deploy Frontend**
   - Deploy updated components
   - Deploy updated API calls

5. **Verify**
   - Test onboarding flow
   - Test booking flow
   - Test availability page

#### Rollback Plan

If issues occur:
1. Restore database from backup
2. Revert backend to previous version
3. Revert frontend to previous version

---

## Benefits of New Architecture

### 1. **Simplicity**
- One source of truth for duration (services table)
- Slots only store what they need (start time)
- No redundant endTime field

### 2. **Flexibility**
- Any service duration works
- Easy to add new services with different durations
- Can change service duration without touching slots

### 3. **Realistic**
- Matches real-world booking systems
- Customer knows when service ends based on their choice
- Provider can offer varied services

### 4. **Scalability**
- Fewer slots to store (start times only)
- Simpler overlap detection
- Less complex validation

---

## Open Questions for User

1. **Slot Interval**: What should the interval be? (15 min, 30 min, 60 min?)
2. **Break Times**: Should break times be day-specific or global?
3. **Migration**: Should existing slots be migrated or regenerated?
4. **Booking Display**: How should customer see available times?

---

## Status: ⏸️ PENDING USER APPROVAL

This plan is ready for implementation once user confirms:
✅ Understanding of the changes
✅ Answers to open questions
✅ Approval to proceed
