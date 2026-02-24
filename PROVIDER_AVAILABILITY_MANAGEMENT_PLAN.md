# Provider Availability Management - Comprehensive Plan 📅

## Executive Summary

This document outlines a complete plan for building a **Provider Availability Management** feature that allows service providers to manage their time slots, working hours, and availability for bookings.

---

## Part 1: Current Backend Analysis

### Database Schema

**`slots` Table:**
```javascript
{
  id: serial (PK),
  businessProfileId: integer (FK → business_profiles),
  startTime: time (HH:mm:ss),  // ⚠️ ONLY TIME, NO DATE
  endTime: time (HH:mm:ss),    // ⚠️ ONLY TIME, NO DATE
  createdAt: timestamp
}
```

**Critical Understanding:**
- ⚠️ **Slots ONLY store time ranges** (e.g., "09:00:00" to "10:00:00")
- ⚠️ **NO date/datetime field** - slots are RECURRING daily time templates
- ⚠️ **This is NOT a traditional booking system** with specific date-time slots

**How Bookings Work:**
```javascript
// bookings table
{
  id: serial,
  customerId: integer,
  businessProfileId: integer,
  serviceId: integer,
  slotId: integer,           // References the TIME template
  addressId: integer,
  bookingDate: timestamp,    // ⚠️ ACTUAL DATE/TIME of booking
  status: enum,
  totalPrice: integer
}
```

**Booking Flow:**
1. Provider creates slot templates (e.g., "09:00-10:00", "14:00-15:00")
2. Customer books a service → Selects date + slot template
3. `bookingDate` = chosen date + slot time (e.g., "2024-03-15 09:00:00")
4. Slot is NOT consumed - multiple bookings can use same slot template

### Backend API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/slots/public/:businessId` | Get all slot templates (public) | None |
| GET | `/slots/:businessId` | Get slot templates for provider | Provider |
| POST | `/slots/:businessId` | Create slot template | Provider |
| DELETE | `/businesses/:businessId/slots/:slotId` | Delete slot template | Provider |

**Slot Validation:**
```javascript
// Backend validates:
1. startTime < endTime
2. No duplicate exact time slots
3. No overlapping time slots
```

### What's MISSING in Backend:

1. ❌ No `isBooked` field on slots (slots are templates, not consumed)
2. ❌ No working hours structure (separate feature)
3. ❌ No break times structure (separate feature)
4. ❌ No recurring slots (M-F, weekends only)
5. ❌ No bulk slot creation
6. ❌ No slot availability status (booked slots don't show in public view)
7. ❌ No booking count per slot

---

## Part 2: Critical Design Decisions

### Decision 1: Slot Template Model ✅ (Current Backend)

**What it means:**
- Slots are **time templates** that repeat daily
- "09:00-10:00" means available EVERY DAY at 9-10 AM
- Multiple bookings can use same slot (different dates)
- Provider deletes slot → affects all future bookings

**Pros:**
- Simple database schema
- Easy to manage recurring availability
- Less storage

**Cons:**
- Can't have different schedules per day
- Can't block specific dates
- All slots repeat daily

### Decision 2: Working Hours (Optional Enhancement)

**Should we add?** - Need separate `working_hours` table for day-specific schedules

```javascript
working_hours: {
  id: serial,
  businessProfileId: integer,
  day: enum (monday, tuesday, ...),
  isOpen: boolean,
  startTime: time,
  endTime: time
}
```

**Benefit:** Provider can set "Mon-Fri: 9-5, Sat: 10-2, Sun: Closed"

### Decision 3: How to Show Bookings

**Option A:** Show booking count per slot (e.g., "09:00-10:00 (3 bookings)")
**Option B:** Show upcoming bookings with slot/time
**Option C:** Both - slot templates + booking list

**Recommendation:** Option C - Show slot templates + separate booking list

---

## Part 3: What to Build - Feature Breakdown

### Phase 1: Core Slot Management (P0 - Must Have)

#### 1.1 Slot List View
- **Display:** All slot templates for the business
- **Card shows:** Time range (09:00 - 10:00), Day badges (if we add working hours)
- **Actions:** Edit (time), Delete
- **Stats:** Total slots, Active slots

#### 1.2 Add Slot Dialog
- **Fields:** Start Time, End Time
- **Validation:** End > Start, No overlaps, No duplicates
- **Time Picker:** HH:mm format (24-hour)
- **Visual:** Time range preview

#### 1.3 Delete Slot
- **Confirmation:** "Delete slot 09:00-10:00?"
- **Warning:** "This may affect future bookings"
- **Cascade:** Check if slot has bookings before delete

### Phase 2: Slot Visual Management (P1 - Should Have)

#### 2.1 Timeline View
- **Display:** Horizontal timeline showing all slots
- **Visual:** Color-coded blocks (available, booked, break)
- **Interaction:** Drag to resize, click to edit

#### 2.2 Calendar Integration
- **Weekly View:** Show slots for each day of week
- **Monthly View:** Show booking density
- **Quick Add:** Click on calendar to add slot

#### 2.3 Bulk Operations
- **Copy Slots:** Copy slots from one day to others
- **Delete Multiple:** Select and delete multiple slots
- **Import/Export:** CSV slot management

### Phase 3: Advanced Features (P2 - Nice to Have)

#### 3.1 Recurring Slots
- **Patterns:** Daily, Weekdays, Weekends, Custom
- **Date Range:** Apply pattern from X to Y date
- **Exceptions:** Block specific dates

#### 3.2 Smart Suggestions
- **AI Suggestions:** "Add more slots on Mondays (fully booked)"
- **Peak Hours:** Show busiest times
- **Optimization:** Suggest best slot durations

#### 3.3 Booking Analytics
- **Slot Utilization:** Which slots are most popular
- **No-Show Rate:** Track missed bookings
- **Revenue Per Slot:** Which times generate most revenue

---

## Part 4: UI/UX Design

### Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Availability                                              [+ Slot]│
│  Manage your time slots and working hours                             │
│                    [Refresh] [View: Timeline ▼]                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ Total    │ │ Active   │ │ Bookings │ │ Avg      │            │
│  │ Slots    │ │ Slots    │ │ Today    │ │ Utilization│          │
│  │    8     │ │    8     │ │    3     │ │   65%    │            │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    SLOT TIMELINE VIEW                       │ │
│  │  06:00 ───────────────────────────────────────────── 22:00 │ │
│  │  ┌────────┐    ┌────────┐    ┌────────┐                   │ │
│  │  │ 09-10  │    │ 11-12  │    │ 14-15  │                   │ │
│  │  │  🟢     │    │  🟢     │    │  🟡     │                   │ │
│  │  └────────┘    └────────┘    └────────┘                   │ │
│  └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  ╔═════════════════════════════════════════════════════════════╗ │
│  ║ 09:00 - 10:00                              [Edit] [Delete]  ║ │
│  ║ Status: Available | Bookings: 2 on this slot                ║ │
│  ║ Upcoming:                                              ║ │
│  ║ • Mar 15, 09:00 - Basic Plumbing (John Doe)                ║ │
│  ║ • Mar 16, 09:00 - Emergency Repair (Jane Smith)            ║ │
│  ╚═════════════════════════════════════════════════════════════╝ │
└─────────────────────────────────────────────────────────────────┘
```

### Slot Card Design

```
┌─────────────────────────────────────────────────────────────────┐
│  🕐 09:00 - 10:00                                    [⋮]         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  2 bookings today                                          │
│  75% utilization rate                                       │
└─────────────────────────────────────────────────────────────────┘
```

### Add Slot Dialog

```
┌──────────────────────────────────────────────────────────┐
│  Add New Time Slot                            [×]         │
├──────────────────────────────────────────────────────────┤
│  Start Time *                          End Time *        │
│  ┌────────────┐                        ┌────────────┐    │
│  │ 09:00     ▼│                        │ 10:00     ▼│    │
│  └────────────┘                        └────────────┘    │
│                                                          │
│  ℹ️ Slots repeat daily. Bookings can be made for any  │
│     date using this time template.                      │
│                                                          │
│  ┌────────────────────────────────────────────────┐     │
│  │  Preview: Available from 09:00 to 10:00       │     │
│  └────────────────────────────────────────────────┘     │
│                                                          │
│  [Cancel]                          [Add Slot]           │
└──────────────────────────────────────────────────────────┘
```

---

## Part 5: Data Relationships

### Entity Relationship Diagram

```
┌──────────────┐
│   users      │
│  (provider)  │
└──────┬───────┘
       │ 1
       │
       │ N
┌──────▼────────┐
│business_profiles│
└──────┬─────────┘
       │ 1
       │ has
       │ N
┌──────▼──────┐     ┌─────────────┐
│   slots     │────│  bookings   │
│  (templates)│ N   │  (actual)   │
└─────────────┘     └─────────────┘
     │                       |
     │                       │
     │ 1                     │ N
     │ is used for           │ belongs to
     │                       │
     │ N              ┌──────▼──────┐
     │                │   services  │
     │                └─────────────┘
     │
     └── Can be deleted (but check bookings first)
```

### Critical Relationships to Handle

1. **Slots → Bookings (One-to-Many)**
   - One slot template can have many bookings
   - Delete slot → Need to warn about existing bookings
   - Show booking count per slot

2. **Business → Slots (One-to-Many)**
   - Only owner can manage their slots
   - Business must exist

3. **Bookings → Slots (Many-to-One)**
   - Each booking references one slot
   - Booking date = selected date + slot time
   - Slot deletion doesn't cascade to bookings (soft warning)

---

## Part 6: File Structure

```
app/(pages)/provider/availability/
└── page.tsx                           # Main availability page

lib/provider/
└── slots.ts                           # Slot API functions

components/provider/availability/
├── index.ts                          # Barrel export
├── SlotStats.tsx                     # Statistics cards
├── SlotTimeline.tsx                  # Visual timeline view
├── SlotList.tsx                      # List/card view
├── SlotCard.tsx                      # Individual slot card
├── SlotDialog.tsx                    # Add/Edit slot dialog
└── SlotBookingsList.tsx              # Show bookings for a slot
```

---

## Part 7: Implementation Phases

### Phase 1: Foundation (30 min)
- [ ] Create `lib/provider/slots.ts` API functions
- [ ] Create main page structure `app/(pages)/provider/availability/page.tsx`
- [ ] Load slots on mount
- [ ] Handle loading/error states

### Phase 2: Statistics (15 min)
- [ ] Create `SlotStats.tsx` component
- [ ] Display: Total Slots, Active Slots, Today's Bookings

### Phase 3: Slot List & Cards (30 min)
- [ ] Create `SlotList.tsx` with grid layout
- [ ] Create `SlotCard.tsx` component
- [ ] Display time range, booking count
- [ ] Delete with confirmation

### Phase 4: Add Slot Dialog (25 min)
- [ ] Create `SlotDialog.tsx`
- [ ] Time pickers (start/end)
- [ ] Validation (end > start, no overlaps)
- [ ] Visual preview

### Phase 5: Timeline View (30 min)
- [ ] Create `SlotTimeline.tsx` component
- [ ] Horizontal timeline display
- [ ] Visual slot blocks
- [ ] Color coding (available/booked)

### Phase 6: Booking Integration (20 min)
- [ ] Show bookings per slot
- [ ] Booking count display
- [ ] Upcoming bookings list
- [ ] Slot utilization calculation

### Phase 7: Polish & Testing (15 min)
- [ ] Toast notifications
- [ ] Loading states
- [ ] Empty states
- [ ] Responsive design

**Total Estimated Time:** ~2.5-3 hours

---

## Part 8: API Functions Required

### New File: `lib/provider/slots.ts`

```typescript
/**
 * Get slot templates for a business
 */
export async function getBusinessSlots(businessId: number): Promise<Slot[]>;

/**
 * Create a new slot template
 */
export async function createSlot(
  businessId: number,
  slotData: { startTime: string; endTime: string }
): Promise<Slot>;

/**
 * Delete a slot template
 */
export async function deleteSlot(
  businessId: number,
  slotId: number
): Promise<void>;

/**
 * Get bookings for a specific slot
 */
export async function getSlotBookings(
  businessId: number,
  slotId: number
): Promise<Booking[]>;

/**
 * Get slot statistics
 */
export async function getSlotStats(businessId: number): Promise<{
  totalSlots: number;
  activeSlots: number;
  todayBookings: number;
  utilizationRate: number;
}>;
```

---

## Part 9: Types Definition

```typescript
/**
 * Slot Template (Time Range)
 * NOTE: This is a RECURRING template, NOT a specific date-time slot
 */
export interface Slot {
  id: number;
  businessProfileId: number;
  startTime: string;  // Format: "HH:mm:ss"
  endTime: string;    // Format: "HH:mm:ss"
  createdAt?: string;
  // Computed fields (not in DB)
  bookingCount?: number;
  todayBookingCount?: number;
  utilizationRate?: number;
}

/**
 * Slot Statistics
 */
export interface SlotStats {
  totalSlots: number;
  activeSlots: number;
  todayBookings: number;
  thisWeekBookings: number;
  utilizationRate: number; // Percentage
}

/**
 * Slot Form Data
 */
export interface SlotFormData {
  startTime: string;  // "HH:mm" format
  endTime: string;    // "HH:mm" format
}
```

---

## Part 10: Validation Rules

### Frontend Validation

1. **Time Format:** Must be "HH:mm" (24-hour format)
2. **Start Time:** Required, valid time
3. **End Time:** Required, valid time, > start time
4. **Overlap Check:** No overlapping with existing slots
5. **Duplicate Check:** No exact same time slots

### Backend Validation (Already Exists)

```javascript
1. startTime < endTime
2. No duplicate slots (exact match)
3. No overlapping slots
4. Business ownership verification
```

---

## Part 11: Key Considerations

### ⚠️ Critical Understanding

1. **Slots are TEMPLATES, not specific bookings**
   - "09:00-10:00" means available every day at 9-10 AM
   - Customers choose date + slot template

2. **Multiple bookings per slot**
   - Same slot can be used for different dates
   - Deleting slot affects all future bookings

3. **No date field in slots**
   - Cannot have "Monday only" slots with current schema
   - Would need separate working_hours table for that

4. **Booking date = Selected date + Slot time**
   - Customer books for March 15 + Slot "09:00-10:00"
   - Booking stored as "2024-03-15 09:00:00"

### What NOT to Build

❌ Don't build date-specific slots (not in schema)
❌ Don't build recurring slots (not in schema)
❌ Don't build slot booking status (not tracked in schema)
❌ Don't build working hours (separate table, not implemented)

### What TO Build

✅ Slot template management (CRUD)
✅ Time range visualization
✅ Slot booking count display
✅ Slot utilization metrics
✅ Timeline view
✅ Booking preview per slot

---

## Part 12: Testing Checklist

- [ ] Page loads without errors
- [ ] Slots display in timeline view
- [ ] Slots display in list view
- [ ] Add slot creates new template
- [ ] Validation prevents invalid times
- [ ] Validation prevents overlaps
- [ ] Validation prevents duplicates
- [ ] Delete slot works with confirmation
- [ ] Statistics show correct counts
- [ ] Booking count displays correctly
- [ ] Utilization rate calculates correctly
- [ ] Toast notifications work
- [ ] Responsive on mobile/desktop
- [ ] Empty state shows when no slots

---

## Part 13: Future Enhancements (Out of Scope)

1. **Working Hours Module** - Day-specific schedules
2. **Recurring Slots** - M-F, weekends, custom patterns
3. **Break Times** - Lunch breaks, time off
4. **Bulk Operations** - Copy slots to multiple days
5. **Calendar View** - Monthly/weekly calendar
6. **Slot Categories** - Different types of slots
7. **Dynamic Pricing** - Different prices for different times
8. **Auto-Scheduler** - AI-powered slot suggestions

---

## Part 14: User Flow Examples

### Add New Slot
1. Provider clicks "+ Slot" button
2. Dialog opens with time pickers
3. Selects 09:00 start, 10:00 end
4. Sees preview: "Available 09:00 - 10:00 daily"
5. Clicks "Add Slot"
6. Toast: "Slot added successfully"
7. Slot appears in timeline and list

### View Slot Bookings
1. Provider clicks on a slot card
2. Sees all bookings using this slot
3. Shows date, customer, service, status
4. Can click to view booking details

### Delete Slot
1. Provider clicks delete on slot
2. System checks for existing bookings
3. If bookings exist: Warning with count
4. Confirms → Slot deleted
5. Toast: "Slot deleted successfully"

---

## Part 15: Success Criteria

✅ **Minimum Viable Product (MVP):**
- [ ] Providers can view all slot templates
- [ ] Providers can add new time slots
- [ ] Providers can delete slots
- [ ] Slots display in list view
- [ ] Basic statistics show

✅ **Complete Feature:**
- [ ] All MVP +
- [ ] Timeline visualization
- [ ] Booking count per slot
- [ ] Utilization metrics
- [ ] Slot overlap validation
- [ ] Responsive design
- [ ] Empty/loading states

---

## Status

📋 **PLANNING COMPLETE**

This plan provides a comprehensive roadmap for building the Provider Availability Management feature. The critical understanding is that **slots are time templates**, not date-specific bookings.

**Ready for implementation!** 🚀
