# Booking Flow Simplification - Analysis & Implementation

**Date:** 2026-02-25
**Goal:** Remove `/bookings/new` page, implement booking directly on service details page

---

## 🎯 User's Requirement

**Current Flow (Complex):**
1. Service Details Page → Select Date → Select Slot
2. Navigate to `/bookings/new/[serviceId]?date=&slot=`
3. Select Address
4. Confirm Booking

**Desired Flow (Simple):**
1. Service Details Page → Select Date → Select Slot → Select Address
2. Book Now (directly on same page)
3. Done → Redirect to bookings list

**Rationale:**
- No need for separate booking page
- Everything happens on service details
- Simpler user experience
- Fewer page navigations

---

## 📊 Current State Analysis

### Service Details Page (`/services/[id]`)
**Has:**
- ✅ Date selection (3 days)
- ✅ Slot display and selection
- ✅ Slot filtering logic
- ❌ No address selection
- ❌ No booking button
- ❌ Navigates to `/bookings/new` instead

### Missing Components:
1. Address dropdown/selection
2. "Book Now" button
3. Booking creation API call
4. Success feedback + redirect

---

## 🔧 Implementation Plan

### Step 1: Add Address Selection to Service Details Page

**Location:** After time slot selection

**UI Component:**
```typescript
{selectedDate && selectedSlot && (
  <Card>
    <CardContent className="p-6">
      <h3 className="font-semibold mb-4">Select Service Address</h3>

      {addresses.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-2">No addresses saved</p>
          <Link href="/customer/profile?tab=addresses">
            <Button size="sm" variant="outline">Add Address</Button>
          </Link>
        </div>
      ) : (
        <Select value={selectedAddress?.id?.toString()}>
          <SelectTrigger>
            <SelectValue placeholder="Select address" />
          </SelectTrigger>
          <SelectContent>
            {addresses.map((address) => (
              <SelectItem value={address.id.toString()}>
                {address.addressType}: {address.street}, {address.city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </CardContent>
  </Card>
)}
```

---

### Step 2: Add "Book Now" Button

**Location:** After address selection

**UI Component:**
```typescript
{selectedDate && selectedSlot && selectedAddress && (
  <Card className="bg-primary/5 border-primary/20">
    <CardContent className="p-6">
      <h3 className="font-semibold mb-4">Booking Summary</h3>

      {/* Summary Details */}
      <div className="space-y-2 mb-4">
        <p>Service: {service.name}</p>
        <p>Date: {selectedDate}</p>
        <p>Time: {formatTime(selectedSlot.startTime)}</p>
        <p>Address: {selectedAddress.street}</p>
        <Separator />
        <p className="text-lg font-bold">Total: ₹{service.price}</p>
      </div>

      <Button
        size="lg"
        className="w-full"
        onClick={handleBookNow}
        disabled={isBooking}
      >
        {isBooking ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          "Book Now"
        )}
      </Button>
    </CardContent>
  </Card>
)}
```

---

### Step 3: Implement Booking Creation Handler

```typescript
const handleBookNow = async () => {
  if (!service || !selectedDate || !selectedSlot || !selectedAddress) {
    toast.error("Please complete all selections");
    return;
  }

  try {
    setIsBooking(true);

    const result = await createBooking({
      serviceId: service.id,
      slotId: selectedSlot.id,
      addressId: selectedAddress.id,
      bookingDate: new Date(selectedDate).toISOString(),
    });

    toast.success("Booking created successfully!");

    // Redirect to bookings list or booking details
    setTimeout(() => {
      router.push("/customer/bookings");
    }, 1000);

  } catch (error: any) {
    console.error("Error creating booking:", error);
    toast.error(error.message || "Failed to create booking");
  } finally {
    setIsBooking(false);
  }
};
```

---

### Step 4: Load Addresses on Mount

```typescript
useEffect(() => {
  loadServiceDetails();
  loadAddresses(); // Add this
}, [id]);

const loadAddresses = async () => {
  try {
    setIsLoadingAddresses(true);
    const addressData = await getAddresses();
    const addressesArray = Array.isArray(addressData) ? addressData : [];
    setAddresses(addressesArray);

    // Auto-select first address if none selected
    if (addressesArray.length > 0 && !selectedAddress) {
      setSelectedAddress(addressesArray[0]);
    }
  } catch (error) {
    console.error("Error loading addresses:", error);
    setAddresses([]);
  } finally {
    setIsLoadingAddresses(false);
  }
};
```

---

### Step 5: Import createBooking API

```typescript
import { getServiceById, getAvailableSlots, getAddresses, createBooking } from "@/lib/customer/api";
```

---

### Step 6: Remove Old Booking Flow

**Current Code (Line 114-117):**
```typescript
router.push(
  `/customer/bookings/new/${id}?date=${selectedDate}&slot=${selectedSlot.id}&address=${selectedAddress.id}`
);
```

**Replace With:**
```typescript
handleBookNow();
```

---

### Step 7: Delete Unnecessary Page

**Delete:** `/app/(pages)/customer/bookings/new/[serviceId]/page.tsx`

This entire page is no longer needed.

---

## 📐 Final Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Service Details Page                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [Hero Section]                                              │
│ Service Image │ Service Info & Price                        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [Service Details]                                           │
│ Full Description, Duration, Provider, Location             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [Check Availability]                                         │
│                                                             │
│ Select Date:                                                │
│ [Today] [Tomorrow] [Overmorrow]                             │
│                                                             │
│ Available Time Slots:                                       │
│ [09:00] [09:30] [10:00] [10:30] [11:00]...               │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [Select Service Address]  ← NEW SECTION                    │
│                                                             │
│ ┌─────────────────────────────────────────┐                │
│ │ Select Address: [Home ▼]               │                │
│ │                                         │                │
│ │ or Add New Address                      │                │
│ └─────────────────────────────────────────┘                │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [Booking Summary]  ← NEW SECTION                            │
│                                                             │
│ Service: Home Cleaning                                      │
│ Date: Tuesday, Feb 25                                       │
│ Time: 10:00 AM                                              │
│ Address: 123 Street, Mumbai                                 │
│ ─────────────────────────────────────────                   │
│ Total: ₹500                                                 │
│                                                             │
│ [        Book Now        ]  ← NEW BUTTON                    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [About the Provider]                                        │
│ Business info, logo, rating, description                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 User Flow After Changes

```
1. User visits service details page
   ↓
2. Sees service info, price, rating
   ↓
3. Selects date (Today, Tomorrow, or Overmorrow)
   ↓
4. Sees available time slots
   ↓
5. Selects time slot
   ↓
6. Address dropdown appears (or prompts to add address)
   ↓
7. Selects address (or auto-selected if first address)
   ↓
8. Booking summary appears with "Book Now" button
   ↓
9. Clicks "Book Now"
   ↓
10. Booking created → Success toast
   ↓
11. Redirected to /customer/bookings
```

---

## ✅ Success Criteria

After implementation:
- [ ] Address selection on service details page
- [ ] "Book Now" button appears after all selections
- [ ] Booking created without navigating away
- [ ] Success feedback shown
- [ ] Redirect to bookings list after success
- [ ] `/bookings/new` page deleted
- [ ] No broken navigation links
- [ ] Proper error handling

---

**Priority:** HIGH
**Risk Level:** LOW
**Breaking Changes:** None (simplification only)
**Files to Modify:**
1. `app/(pages)/customer/services/[id]/page.tsx` - Add booking functionality
2. `lib/customer/api.ts` - Already fixed

**Files to Delete:**
1. `app/(pages)/customer/bookings/new/[serviceId]/page.tsx` - No longer needed
