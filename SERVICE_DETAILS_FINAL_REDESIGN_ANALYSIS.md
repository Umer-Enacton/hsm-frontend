# Service Details Page - Complete Backend Analysis & Redesign Plan

**Date:** 2026-02-25
**Page:** `app/(pages)/customer/services/[id]/page.tsx`
**Status:** BACKEND ANALYSIS COMPLETE - READY FOR IMPLEMENTATION

---

## 🔍 Backend API Analysis

### 1. Service Details Endpoint

**Route:** `GET /services/:id`
**Controller:** `service.controller.js → getServiceById()`
**Authentication:** None (public endpoint)

#### Database Query:
```javascript
const [service] = await db
  .select({
    // Service fields
    id: services.id,
    name: services.name,
    description: services.description,
    price: services.price,
    EstimateDuration: services.EstimateDuration,
    image: services.image,                    // ✅ Cloudinary URL or NULL
    isActive: services.isActive,
    businessProfileId: services.businessProfileId,
    createdAt: services.createdAt,

    // Business/Provider fields (LEFT JOIN with business_profiles)
    provider: {
      id: businessProfiles.id,
      businessName: businessProfiles.businessName,
      description: businessProfiles.description,  // ✅ Business description
      phone: businessProfiles.phone,              // ❌ NOT to display
      state: businessProfiles.state,
      city: businessProfiles.city,
      logo: businessProfiles.logo,                // ✅ Business logo
      rating: businessProfiles.rating,
      isVerified: businessProfiles.isVerified,
    },
  })
  .from(services)
  .leftJoin(businessProfiles, eq(services.businessProfileId, businessProfiles.id))
  .where(eq(services.id, serviceId));
```

#### Response Structure:
```json
{
  "id": 1,
  "name": "Home Cleaning Service",
  "description": "Professional home cleaning...",
  "price": 500,
  "EstimateDuration": 45,
  "image": "https://res.cloudinary.com/.../image.jpg" | null,
  "isActive": true,
  "businessProfileId": 2,
  "createdAt": "2026-02-20T10:00:00.000Z",

  "provider": {
    "id": 2,
    "businessName": "CleanHome Pro",
    "description": "Professional cleaning services..." | null,
    "phone": "+91-9876543210",
    "state": "Maharashtra",
    "city": "Mumbai",
    "logo": "https://res.cloudinary.com/.../logo.jpg" | null,
    "rating": "4.50",
    "isVerified": true,
    "totalReviews": 0  // Added by backend (TODO comment)
  },

  "slots": [],    // Empty array (TODO - not fetched from DB)
  "reviews": []   // Empty array (TODO - not fetched from DB)
}
```

### ⚠️ CRITICAL FINDING - Category NOT Included

**The `/services/:id` endpoint does NOT include category data.**

- `categoryId` exists on `business_profiles` table
- Backend does NOT SELECT category name or details
- No JOIN with `categories` table in `getServiceById()`
- **Conclusion:** Do NOT display category on service details page

---

### 2. Slots Endpoint

**Route:** `GET /slots/public/:businessId`
**Controller:** `slot.controller.js → getSlotsPublic()`
**Authentication:** None (public endpoint)

#### Database Schema:
```javascript
// slots table structure
{
  id: number,
  businessProfileId: number,
  startTime: string,    // TIME column - "HH:mm:ss" format
  createdAt: timestamp
}
```

#### Response Structure:
```json
{
  "slots": [
    { "id": 1, "businessProfileId": 2, "startTime": "09:00:00" },
    { "id": 2, "businessProfileId": 2, "startTime": "09:30:00" },
    { "id": 3, "businessProfileId": 2, "startTime": "10:00:00" },
    { "id": 4, "businessProfileId": 2, "startTime": "10:30:00" },
    { "id": 5, "businessProfileId": 2, "startTime": "11:00:00" },
    { "id": 6, "businessProfileId": 2, "startTime": "11:30:00" },
    { "id": 7, "businessProfileId": 2, "startTime": "12:00:00" },
    { "id": 8, "businessProfileId": 2, "startTime": "14:00:00" },
    { "id": 9, "businessProfileId": 2, "startTime": "14:30:00" },
    { "id": 10, "businessProfileId": 2, "startTime": "15:00:00" }
  ]
}
```

**Important Notes:**
- Slots are **time templates**, NOT date-specific
- Same slots apply to ANY business day
- No date filtering in backend
- Frontend must filter based on selected date

---

### 3. What Data IS Available

#### ✅ Available Fields:
```typescript
ServiceDetails {
  // Service
  id: number
  name: string
  description: string
  price: number
  EstimateDuration: number
  image: string | null        // Cloudinary URL
  isActive: boolean
  businessProfileId: number
  createdAt: string

  // Provider
  provider: {
    id: number
    businessName: string
    description: string | null   // Business description
    phone: string                // ❌ DO NOT DISPLAY
    state: string
    city: string
    logo: string | null          // Business logo
    rating: string               // Decimal "4.50"
    isVerified: boolean
    totalReviews: number         // Always 0 (TODO)
  }

  // Empty arrays
  slots: []     // Fetch separately from /slots/public/:businessId
  reviews: []   // Always empty (backend TODO)
}
```

#### ❌ NOT Available:
- Category name (not selected in query)
- Category image (not selected in query)
- Reviews (empty array, backend TODO)
- What's Included (not a field in database)
- Service notes (not a field in database)

---

## 🎨 Layout Design Based on Available Data

### Section 1: Hero Section

```
┌────────────────────────────────────────────────────────────┐
│ ┌────────────────┐  ┌─────────────────────────────────┐  │
│ │                │  │ Service Name                    │  │
│ │  Service Image │  │ Home Cleaning Service           │  │
│ │  (16:9)        │  │                                 │  │
│ │  Clean,        │  │ Professional home cleaning...   │  │
│ │  Responsive    │  │                                 │  │
│ │  Fallback      │  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  │
│ │  Gradient      │  │ ₹500                           │  │
│ │                │  │ 45 minutes                     │  │
│ │                │  │                                 │  │
│ │                │  │ ⭐ 4.5  •  Verified Provider    │  │
│ └────────────────┘  └─────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

**Left (50%):**
- Service image from `service.image`
- Fallback gradient if null
- 16:9 aspect ratio
- Rounded corners

**Right (50%):**
- Service name (large, bold)
- Short description (2-3 lines, line-clamp)
- Price (large, prominent)
- Duration (with clock icon)
- Rating + Verified badge

---

### Section 2: Service Details

```
┌────────────────────────────────────────────────────────────┐
│ Service Details                                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Full Description                                           │
│                                                            │
│ Professional home cleaning service including:             │
│ • Dusting and wiping surfaces                              │
│ • Vacuuming and mopping floors                             │
│ • Cleaning kitchen and bathroom                            │
│ • Removing trash                                           │
│                                                            │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                            │
│ Duration:          45 minutes                              │
│ Business Profile:  CleanHome Pro                           │
│ Location:          Mumbai, Maharashtra                     │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Only Display:**
- Full description (from `service.description`)
- Duration (from `service.EstimateDuration`)
- Provider name (from `provider.businessName`)
- Location (from `provider.city`, `provider.state`)

**Do NOT Display:**
- Category (not available from API)
- What's Included (not a field)
- Service notes (not a field)

---

### Section 3: Availability Section

```
┌────────────────────────────────────────────────────────────┐
│ Check Availability                                         │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Select a date to view available time slots:                │
│                                                            │
│ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│ │    Today    │  │  Tomorrow   │  │  Overmorrow │        │
│ │   Feb 25    │  │   Feb 26    │  │   Feb 27    │        │
│ └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                            │
│ Available Time Slots for Feb 25:                           │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ │
│ │09:00 │ │09:30 │ │10:00 │ │10:30 │ │11:00 │ │11:30 │ │
│ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ │
│ ┌──────┐ ┌──────┐ ┌──────┐                             │
│ │12:00 │ │14:00 │ │14:30 │                             │
│ └──────┘ └──────┘ └──────┘                             │
│                                                            │
│ [Continue to Booking →]                                   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Date Logic:**
- Only 3 dates: Today, Tomorrow, Overmorrow
- Labels: "Today", "Tomorrow", "Overmorrow" (or day names)
- Store actual date strings internally

**Slot Display:**
- Fetch once from `/slots/public/:businessId`
- Filter on frontend:
  - **Today:** Exclude slots < 30 minutes from now
  - **Tomorrow/Overmorrow:** Show all slots
- Grid layout (responsive)
- Selectable buttons

**If No Slots:**
- Show "No availability for this date" message

---

### Section 4: Business Information

```
┌────────────────────────────────────────────────────────────┐
│ About the Provider                                         │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ ┌────┐                                                      │
│ │Logo│  CleanHome Pro                                      │
│ └────┘  ⭐ 4.5  •  Verified  •  Mumbai, Maharashtra       │
│                                                            │
│ Professional cleaning services with experienced staff...   │
│                                                            │
│ (from provider.description if available)                   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Display:**
- Business logo (from `provider.logo`, fallback icon)
- Business name (from `provider.businessName`)
- Rating (from `provider.rating`)
- Verification badge (from `provider.isVerified`)
- Location (from `provider.city`, `provider.state`)
- Description (from `provider.description` if available)

**Do NOT Display:**
- Phone number
- Email
- Direct contact details

---

## 🔧 Slot Filtering Logic (CRITICAL)

### Today's Date Filtering:
```typescript
const getAvailableSlotsForDate = (selectedDate: string, allSlots: Slot[]) => {
  const today = new Date().toISOString().split('T')[0];

  // Future dates: show all slots
  if (selectedDate !== today) {
    return allSlots;
  }

  // Today: filter out past slots and slots < 30 min away
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const bufferMinutes = 30; // Provider arrival buffer

  return allSlots.filter(slot => {
    const [hours, minutes] = slot.startTime.split(':').map(Number);
    const slotMinutes = hours * 60 + minutes;
    return slotMinutes > currentMinutes + bufferMinutes;
  });
};
```

### Date Generation:
```typescript
const getNext3Days = () => {
  const days = [];
  const today = new Date();

  for (let i = 0; i < 3; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    days.push({
      value: date.toISOString().split('T')[0], // YYYY-MM-DD
      label: i === 0 ? 'Today' :
             i === 1 ? 'Tomorrow' :
             'Overmorrow',
      displayDate: date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      })
    });
  }

  return days;
};
```

---

## 📐 Responsive Layout

### Desktop (1024px+):
```
┌─────────────────────────────────────────────────────┐
│ [Hero: Image Left | Info Right]                    │
├─────────────────────────────────────────────────────┤
│ [Service Details]                                  │
├─────────────────────────────────────────────────────┤
│ [Availability: 3 Date Cards | Slot Grid]           │
├─────────────────────────────────────────────────────┤
│ [Business Info]                                    │
└─────────────────────────────────────────────────────┘
```

### Tablet (768px - 1023px):
```
┌─────────────────────────────────┐
│ [Hero: Stacked]                │
│ Image                           │
│ Info                            │
├─────────────────────────────────┤
│ [Service Details]              │
├─────────────────────────────────┤
│ [Availability]                 │
│ [3 Date Buttons]               │
│ [Slot Grid]                    │
├─────────────────────────────────┤
│ [Business Info]                │
└─────────────────────────────────┘
```

### Mobile (< 768px):
```
┌───────────────────┐
│ [Hero: Stacked]  │
│ Image (compact)  │
│ Info             │
├───────────────────┤
│ [Service Details]│
├───────────────────┤
│ [Availability]   │
│ [Date Stack]     │
│ [Slot Grid 2col] │
├───────────────────┤
│ [Business Info]  │
└───────────────────┘
```

---

## ⚡ Performance & Loading Strategy

### NO Full-Page Loader:
- Header always visible
- Skeleton loaders in content areas only
- Progressive loading

### Loading States:
```typescript
const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
const [isLoadingService, setIsLoadingService] = useState(false);
const [isLoadingSlots, setIsLoadingSlots] = useState(false);

// Skeleton condition
const showSkeleton = !hasLoadedOnce || isLoadingService;
```

### Fetch Strategy:
1. Page mount → Fetch service details
2. Service loaded → Fetch slots (one-time)
3. Select date → Filter slots locally (no API call)
4. Select slot + address → Navigate to booking

---

## 📋 Implementation Checklist

### Data:
- [ ] Fetch service from `/services/:id`
- [ ] Fetch slots from `/slots/public/:businessId`
- [ ] Fetch addresses from `/address`
- [ ] Generate 3 dates dynamically
- [ ] Filter today's slots (past + <30min excluded)

### UI Sections:
- [ ] Hero section (image left, info right)
- [ ] Service details (description, duration, location)
- [ ] Availability section (3 dates, slot grid)
- [ ] Business info (logo, name, rating, description)
- [ ] Booking flow button

### Only Display Backend Data:
- [ ] Service image (from `service.image`)
- [ ] Service name, description, price, duration
- [ ] Provider logo, name, rating, verification
- [ ] Provider description (if exists)
- [ ] Location (city, state)
- [ ] Slots (from API, filtered)

### Do NOT Display:
- [ ] Category (not in API response)
- [ ] Phone number (privacy)
- [ ] Email (privacy)
- [ ] What's Included (not a field)
- [ ] Reviews (empty array)

### Loading States:
- [ ] Skeleton for hero
- [ ] Skeleton for details
- [ ] Skeleton for availability
- [ ] Inline spinners for async ops

### Responsive:
- [ ] Desktop 2-column hero
- [ ] Tablet stacked
- [ ] Mobile compact
- [ ] Slot grid responsive

---

## ✅ Success Criteria

After implementation:
- [ ] Clean, premium design
- [ ] Hero section with image and info side-by-side
- [ ] Only 3 dates shown
- [ ] Smart slot filtering for today
- [ ] No category displayed (not in API)
- [ ] No contact details
- [ ] Only display fields present in backend
- [ ] No full-page loader
- [ ] Fully responsive
- [ ] No flickering

---

**Priority:** HIGH
**Risk Level:** LOW
**Breaking Changes:** None (UI only)
**Backend Changes:** None required
