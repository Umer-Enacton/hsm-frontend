# Booking Pages - Complete Analysis & Refactoring Plan

**Date:** 2026-02-25
**Pages:** `app/(pages)/customer/bookings/*`
**Status:** ANALYSIS COMPLETE - READY TO IMPLEMENT

---

## 🔍 Backend API Analysis

### 1. Create Booking Endpoint

**Route:** `POST /add-booking`
**Controller:** `booking.controller.js → addBooking()`
**Authentication:** Required (CUSTOMER role only)
**Middleware:** `validate(bookingSchema)`

#### Request Body:
```json
{
  "serviceId": number,
  "slotId": number,
  "addressId": number,
  "bookingDate": string (ISO date string)
}
```

#### Validation Schema (bookingSchema):
```javascript
{
  serviceId: number (required),
  slotId: number (required),
  addressId: number (required),
  bookingDate: string (required, ISO date format)
}
```

#### Backend Logic:
1. Validate booking date is not in the past
2. Verify address belongs to user
3. Verify service exists
4. Verify slot exists
5. If booking is for today, check if slot time has passed (with buffer)
6. Calculate totalPrice from service price
7. Create booking with status "pending"
8. Return created booking

#### Response Structure:
```json
{
  "message": "Booking created successfully",
  "booking": {
    "id": 1,
    "customerId": 5,
    "businessProfileId": 2,
    "serviceId": 10,
    "slotId": 15,
    "addressId": 3,
    "bookingDate": "2026-02-26T00:00:00.000Z",
    "status": "pending",
    "totalPrice": 500,
    "createdAt": "2026-02-25T10:30:00.000Z"
  }
}
```

---

### 2. Get Customer Bookings

**Route:** `GET /bookings/customer`
**Controller:** `booking.controller.js → getCustomerBookings()`
**Authentication:** Required (CUSTOMER role only)

#### Response:
```json
{
  "bookings": [
    {
      "id": 1,
      "customerId": 5,
      "businessProfileId": 2,
      "serviceId": 10,
      "slotId": 15,
      "addressId": 3,
      "bookingDate": "2026-02-26T00:00:00.000Z",
      "status": "pending",  // pending, confirmed, completed, cancelled
      "totalPrice": 500,
      "createdAt": "2026-02-25T10:30:00.000Z"
    }
  ]
}
```

**Note:** Response only contains booking IDs (serviceId, slotId, addressId), not joined data.

---

### 3. Get Booking By ID

**Route:** `GET /booking/:id`
**Controller:** `booking.controller.js → getBookingById()`
**Authentication:** Required (customer or provider)

#### Response:
```json
{
  "booking": {
    "id": 1,
    "customerId": 5,
    "businessProfileId": 2,
    "serviceId": 10,
    "slotId": 15,
    "addressId": 3,
    "bookingDate": "2026-02-26T00:00:00.000Z",
    "status": "pending",
    "totalPrice": 500,
    "createdAt": "2026-02-25T10:30:00.000Z"
  }
}
```

**Note:** Same as above - only IDs, no joined data.

---

## ❌ Current Issues

### Issue #1: Wrong API Endpoint
**Problem:** `createBooking()` uses `API_ENDPOINTS.BOOKING` (`/booking`) instead of `API_ENDPOINTS.ADD_BOOKING` (`/add-booking`)

**Fix:** ✅ Already fixed - Changed to use `API_ENDPOINTS.ADD_BOOKING`

---

### Issue #2: No Full Booking Data
**Problem:** Backend returns only booking IDs (serviceId, slotId, addressId), not the actual service/slot/address details.

**Impact:**
- Frontend must fetch service details separately
- Frontend must fetch slot details separately
- Frontend must fetch address details separately
- Multiple API calls needed to display booking info

**Current Workaround:** Frontend stores service data in URL params or local state

---

### Issue #3: New Booking Page Logic
**Problem:** Page tries to load slots from `service.slots` (empty array), not from slots API

**Current Code (Line 56-58):**
```typescript
const slotId = searchParams.get("slot");
if (slotId && serviceData.slots) {
  const slot = serviceData.slots.find((s: Slot) => s.id === parseInt(slotId));
  if (slot) setSelectedSlot(slot);
}
```

**Issue:** `serviceData.slots` is always empty array (backend TODO)

**Fix:** Fetch slot by ID from all slots or pass slot details in URL params

---

## 📐 Current Booking Pages Structure

```
app/(pages)/customer/bookings/
├── page.tsx                    # Customer bookings list
├── [id]/page.tsx              # Individual booking details
└── new/[serviceId]/page.tsx   # Create new booking flow
```

---

## 🎨 Refactoring Plan

### Page 1: New Booking Flow (`new/[serviceId]/page.tsx`)

#### URL Structure:
```
/customer/bookings/new/{serviceId}?date={date}&slot={slotId}&address={addressId}
```

#### Improvements:
1. **Fix slot selection** - Fetch slot by ID from slots API
2. **Better flow** - Skip steps if pre-selected from URL
3. **Clean UI** - Remove full-page loader
4. **Skeleton loading** - Only in content areas
5. **Better error handling** - Clear error messages
6. **Confirmation step** - Review before booking

---

### Page 2: Booking Details (`[id]/page.tsx`)

#### Current State:
- Shows booking with only IDs
- Must fetch related data separately

#### Improvements:
1. **Fetch all related data** - Service, slot, address, provider
2. **Clean status display** - Visual status badges
3. **Action buttons** - Cancel, reschedule (if allowed)
4. **Provider info** - Show business details
5. **Timeline** - Show booking journey

---

### Page 3: Bookings List (`page.tsx`)

#### Current State:
- List of bookings with only IDs

#### Improvements:
1. **Fetch service details** for each booking
2. **Filter by status** - Pending, Confirmed, Completed, Cancelled
3. **Tab navigation** - Easy status filtering
4. **Quick actions** - View details, cancel pending
5. **Empty states** - Clear messages
6. **Skeleton loading** - No full-page loader

---

## 🔧 Implementation Strategy

### Phase 1: Fix API Endpoint ✅
- [x] Change `createBooking` to use `API_ENDPOINTS.ADD_BOOKING`

### Phase 2: Fix New Booking Page
- [ ] Fetch slot by ID from slots API (not from service.slots)
- [ ] Skip steps if pre-selected from URL params
- [ ] Remove full-page loader
- [ ] Add skeleton loading
- [ ] Better error handling

### Phase 3: Refactor Booking Details Page
- [ ] Fetch service details by ID
- [ ] Fetch slot details by ID
- [ ] Fetch address details by ID
- [ ] Fetch provider/business details
- [ ] Show status with visual badges
- [ ] Add action buttons (cancel, reschedule)
- [ ] Add timeline view

### Phase 4: Refactor Bookings List Page
- [ ] Fetch all bookings
- [ ] Fetch service details for each booking
- [ ] Add status filter tabs
- [ ] Show booking cards with key info
- [ ] Add quick actions
- [ ] Empty states
- [ ] Skeleton loading

---

## 📋 Data Fetching Strategy

### For New Booking Page:
```typescript
1. getServiceById(serviceId) - Get service + provider info
2. getAddresses() - Get user's addresses
3. getAvailableSlots(providerId) - Get all slots
4. Find slot by ID from URL params
5. Find address by ID from URL params
6. createBooking() - Create the booking
```

### For Booking Details Page:
```typescript
1. getBookingById(id) - Get booking
2. getServiceById(booking.serviceId) - Get service details
3. Get slot from slotId (stored or fetched)
4. getAddressById(booking.addressId) - Get address
5. Get provider from service.provider
```

### For Bookings List:
```typescript
1. getCustomerBookings() - Get all bookings
2. For each booking:
   - getServiceById(booking.serviceId)
   - Or batch fetch if possible
```

---

## ✅ Success Criteria

After refactoring:
- [ ] Booking creation works (no 404 error)
- [ ] Slot pre-selection works from URL params
- [ ] No full-page loaders
- [ ] Skeleton loading only
- [ ] Booking details page shows all info
- [ ] Bookings list shows service names
- [ ] Status filtering works
- [ ] Clean, modern UI
- [ ] Proper error handling

---

**Priority:** HIGH
**Risk Level:** LOW
**Breaking Changes:** None (fixes and improvements only)
**Backend Changes:** None required
