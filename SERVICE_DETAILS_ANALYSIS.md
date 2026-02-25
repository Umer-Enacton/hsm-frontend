# Service Details Page - Complete Analysis & Refactoring Plan

**Date:** 2026-02-25
**Page:** `app/(pages)/customer/services/[id]/page.tsx`
**Status:** ANALYSIS COMPLETE - READY TO IMPLEMENT

---

## 📊 Backend Integration Analysis

### API Endpoints Used

#### 1. Service Details - PRIMARY
```
GET /services/:id
Controller: service.controller.js → getServiceById()
```

**Data Returned:**
```javascript
{
  id: number,
  name: string,
  description: string,
  price: number,
  EstimateDuration: number,
  image: string | null,
  isActive: boolean,
  businessProfileId: number,
  provider: {
    id: number,
    businessName: string,
    description: string,
    phone: string,           // ⚠️ User wants this REMOVED
    state: string,
    city: string,
    logo: string | null,
    rating: number,
    isVerified: boolean,
  },
  slots: [],                  // TODO: Empty, not fetched from DB
  reviews: []               // TODO: Empty, not fetched from DB
}
```

**Key Findings:**
- ✅ Slots are empty array (backend has TODO comment)
- ✅ Reviews are empty array (backend has TODO comment)
- ⚠️ `provider.phone` is included but user wants it HIDDEN
- ✅ Provider data comes from JOIN with business_profiles table
- ✅ No separate API needed for reviews/slots (empty arrays returned)

---

#### 2. Available Slots - Called on Date Selection
```
GET /slots/public/:businessId?date=YYYY-MM-DD
Used in: handleDateChange() → loadSlots()
```

**Data Returned:**
```typescript
Slot[] = [{
  id: number,
  startTime: string,  // Format: "HH:mm:ss"
  businessProfileId: number
}]
```

**Key Findings:**
- Called only when user selects a date
- Slots fetched per business (not per service)
- Slots are NOT included in service details (must fetch separately)

---

#### 3. Addresses - Called on Mount
```
GET /address
Used in: useEffect() → loadAddresses()
```

**Data Returned:**
```typescript
Address[] = [{
  id: number,
  userId: number,
  addressType: "home" | "work" | "other",
  street: string,
  city: string,
  state: string,
  zipCode: string
}]
```

---

### Current Page Data Flow

```
1. Page Mount
   ├─▶ getServiceById(id) → Service Details + Provider Info
   └─▶ loadAddresses() → User's Saved Addresses

2. User Selects Date
   └─▶ getAvailableSlots(providerId, date) → Available Time Slots

3. User Clicks "Book Now"
   └─▶ Navigate to /customer/bookings/new/:id?date=&slot=&address=
```

---

## 🎯 Current Implementation Analysis

### State Management
```typescript
const [isLoading, setIsLoading] = useState(true);
const [service, setService] = useState<ServiceDetails | null>(null);
const [slots, setSlots] = useState<Slot[]>([]);
const [addresses, setAddresses] = useState<Address[]>([]);
const [selectedDate, setSelectedDate] = useState<string>("");
const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
const [isBooking, setIsBooking] = useState(false);
```

**Issues:**
- ❌ Full-page loader (`isLoading`) unmounts entire layout
- ❌ No skeleton loading for better UX
- ⚠️ `provider.phone` displayed but user wants hidden

---

### Layout Structure (Current)

```
┌────────────────────────────────────────┐
│ ← Back to Services                        │
├────────────────────────────────────────┤
│ [Image] │ Service Info                   │
│         │ - Title, Verified Badge          │
│         │ - Provider Name                 │
│         │ - Rating, Location, Duration     │
│         │ - Price Card + Book Now          │
│         │ - Provider Contact Card          │
├────────────────────────────────────────┤
│ [Details] [Reviews] [Book Now]          │
│                                           │
│ Details Tab:                             │
│ - About this Service                      │
│ - Description                             │
│ - Duration, Service Type                  │
│                                           │
│ Reviews Tab:                             │
│ - Review list (empty arrays)              │
│                                           │
│ Booking Tab:                              │
│ - Date buttons (7 days)                    │
│ - Time slot grid (fetched on date)        │
│ - Address selection                        │
│ - Book Now button                          │
│ - Booking summary card                    │
└────────────────────────────────────────┘
```

---

## ❌ Issues Identified

### Issue #1: Full-Page Loading (CRITICAL)
**Lines 130-139:**
```typescript
if (isLoading) {
  return (
    <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
      {/* FULL PAGE LOADER - REPLACES EVERYTHING */}
    </div>
  );
}
```

**Problem:**
- Unmounts header, service info, booking tabs
- Abrupt, jarring experience
- No placeholder content during load

---

### Issue #2: Contact Details Displayed
**Lines 231-240:**
```typescript
<Card>
  <CardHeader>Provider Contact</CardHeader>
  <CardContent>
    <Phone />
    <span>{service.provider.phone}</span>  {/* ❌ USER WANTS REMOVED */}
  </CardContent>
</Card>
```

**Problem:**
- User explicitly requested NO contact details
- Phone number shown prominently
- Entire "Provider Contact" card unnecessary

---

### Issue #3: Layout Clutter
**Problems:**
1. Image section takes 1/3 width (often empty)
2. Provider Contact card (unnecessary)
3. Too many cards/sections
4. Excessive padding (`space-y-6`)
5. Reviews tab always empty (backend returns `[]`)

---

### Issue #4: No Skeleton Loading
**Problem:**
- Full-page loader instead of skeleton cards
- No visual placeholder during data fetch
- Poor perceived performance

---

### Issue #5: Inconsistent Spacing
**Current:**
- `space-y-6` between major sections
- `p-6` padding in cards
- `gap-6` in flex layouts

**Issue:**
- Too much whitespace
- Content feels scattered
- Not compact or modern

---

## 🎨 Refactoring Plan

### Design Philosophy

**Marketplace-Style Service Page:**

```
┌─────────────────────────────────────────────────────────┐
│ ← Back                                    Share          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Service Name                                      ✓       │
│ by Business Name                    Rating  (120)      │
│                                                         │
│ Professional description text that tells customers...  │
│                                                         │
│ • 30 minutes  • Home Visit  • Cleaning Category          │
│                                                         │
│ ┌───────┐  ┌───────┐  ┌───────┐                           │
│ │  ₹500 │  │ Mumbai│  │ ⭐4.5│                           │
│ └───────┘  └───────┘  └───────┘                           │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │               ₹500  Book Now                     → │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

│ Reviews (12)                                      See All │
│ ┌───────────────────────────────────────────────────┐ │
│ │ ⭐⭐⭐⭐⭐  "Great service!" - John D.               │ │
│ │   2 days ago                                        │ │
│ └───────────────────────────────────────────────────┘ │
│
└─────────────────────────────────────────────────────────┘
```

---

### Component Structure

```typescript
<ServiceDetailsPage>
  <PageHeader />

  <ServiceHero>
    <TitleAndProvider />
    <Description />
    <MetaTags />
  </ServiceHero>

  <PricingCard />

  <BookingCTA />

  <ReviewsSection />
</ServiceDetailsPage>
```

---

### Loading Strategy

**NO Full-Page Loader:**
- Remove `isLoading` state entirely
- Use `hasLoadedOnce` flag (like services page)
- Skeleton cards only in service content area
- Header always visible

**Skeleton Structure:**
```typescript
// While loading:
<PageHeader />          {/* Always visible */}
<SkeletonHero />         {/* Instead of full loader */}
<SkeletonPricing />      {/* Instead of full loader */}
```

---

### Sections to Keep

✅ **Essential:**
1. Service title
2. Provider name
3. Description
4. Price
5. Rating & reviews count
6. Location (city, state)
7. Duration
8. Category (if available)
9. Verified badge
10. Booking CTA

✅ **Functional:**
1. Date selection (7 days)
2. Time slot selection
3. Address selection
4. Book Now button
5. Reviews display (when data available)

---

### Sections to Remove

❌ **Remove Completely:**
1. Service image (often empty, not needed)
2. Provider Contact card (phone number)
3. Provider Contact tab/section

❌ **Simplify:**
1. Remove tabs (Details/Reviews/Book Now)
2. Make single-page layout with sections
3. Remove "Book Now" tab - inline CTA instead

---

## 📐 Detailed Layout Plan

### Section 1: Header (Always Visible)
```typescript
<div className="flex items-center justify-between mb-6">
  <Link href="/customer/services">
    <Button variant="ghost" size="sm">
      <ArrowLeft className="h-4 w-4" />
      Back
    </Button>
  </Link>
  <div className="flex gap-2">
    <Button variant="outline" size="icon">
      <Share2 className="h-4 w-4" />
    </Button>
  </div>
</div>
```

---

### Section 2: Service Hero
```typescript
<Card className="border-2">
  <CardContent className="p-6 space-y-4">
    {/* Title & Badge */}
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl md:text-3xl font-bold">
            {service.name}
          </h1>
          {service.provider.isVerified && (
            <Badge className="bg-green-100 text-green-700">
              <CheckCircle className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          )}
        </div>
        <p className="text-lg text-muted-foreground">
          {service.provider.businessName}
        </p>
      </div>

      {/* Rating */}
      <div className="text-right">
        <div className="text-3xl font-bold text-primary">
          <Star className="h-8 w-8 fill-yellow-400 text-yellow-400" />
          {service.provider.rating.toFixed(1)}
        </div>
        <p className="text-xs text-muted-foreground">
          ({service.provider.totalReviews} reviews)
        </p>
      </div>
    </div>

    {/* Description */}
    <p className="text-muted-foreground leading-relaxed">
      {service.description}
    </p>

    {/* Meta Tags */}
    <div className="flex flex-wrap items-center gap-4 text-sm">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>{service.estimateDuration} minutes</span>
      </div>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <MapPin className="h-4 w-4" />
        <span>{service.provider.city}, {service.provider.state}</span>
      </div>
      {service.category && (
        <Badge variant="outline">{service.category.name}</Badge>
      )}
    </div>
  </CardContent>
</Card>
```

---

### Section 3: Pricing & Booking
```typescript
<div className="grid md:grid-cols-2 gap-4 mb-6">
  {/* Pricing Card */}
  <Card>
    <CardContent className="p-6">
      <h3 className="font-semibold mb-4">Pricing</h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Service Fee</span>
          <span className="font-semibold">₹{service.price}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Platform Fee</span>
          <span className="font-semibold">₹0</span>
        </div>
        <Separator />
        <div className="flex justify-between items-center">
          <span className="font-semibold">Total</span>
          <span className="text-2xl font-bold text-primary">
            ₹{service.price}
          </span>
        </div>
      </div>
    </CardContent>
  </Card>

  {/* Booking Card */}
  <Card>
    <CardContent className="p-6">
      <h3 className="font-semibold mb-4">Book This Service</h3>

      {/* Date Selection */}
      <div className="space-y-2 mb-4">
        <label className="text-sm font-medium">Select Date</label>
        <div className="flex flex-wrap gap-2">
          {/* Date buttons */}
        </div>
      </div>

      {/* Time Slots (when date selected) */}
      {selectedDate && (
        <div className="space-y-2 mb-4">
          <label className="text-sm font-medium">Select Time</label>
          <div className="grid grid-cols-4 gap-2">
            {/* Time slot buttons */}
          </div>
        </div>
      )}

      {/* Address Selection */}
      <div className="space-y-2 mb-4">
        <label className="text-sm font-medium">Service Address</label>
        <Select value={selectedAddress?.id?.toString()}>
          {/* Address options */}
        </Select>
      </div>

      {/* CTA Button */}
      <Button
        size="lg"
        className="w-full"
        disabled={!selectedDate || !selectedSlot || !selectedAddress}
        onClick={handleBookNow}
      >
        {isBooking ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            Confirm Booking
            <ArrowRight className="h-4 w-4 ml-2" />
          </>
        )}
      </Button>
    </CardContent>
  </Card>
</div>
```

---

### Section 4: Reviews
```typescript
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle>Customer Reviews</CardTitle>
      <Link href={`/customer/services/${id}/reviews`}>
        <Button variant="outline" size="sm">See All ({service.reviews.length})</Button>
      </Link>
    </div>
  </CardHeader>
  <CardContent>
    {service.reviews.length === 0 ? (
      <p className="text-center text-muted-foreground py-8">
        No reviews yet. Be the first to review!
      </p>
    ) : (
      <div className="space-y-4">
        {service.reviews.slice(0, 3).map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    )}
  </CardContent>
</Card>
```

---

## 🔧 Implementation Strategy

### Phase 1: Remove Full-Page Loader
- [ ] Remove `isLoading` state
- [ ] Add `hasLoadedOnce` flag
- [ ] Always render full layout
- [ ] Add skeleton components

### Phase 2: Redesign Layout
- [ ] Remove image section
- [ ] Remove Provider Contact card
- [ ] Remove tabs (single-page layout)
- [ ] Compact spacing (`p-4`, `space-y-4`)
- [ ] Inline booking CTA

### Phase 3: Hide Contact Details
- [ ] Remove Provider Contact card
- [ ] Remove phone from display
- [ ] Keep other provider info (name, location, etc.)

### Phase 4: Skeleton Loading
- [ ] Create ServiceHero skeleton
- [ ] Create PricingCard skeleton
- [ ] Create ReviewsSection skeleton
- [ ] Show skeletons during initial load

### Phase 5: Polish
- [ ] Better typography
- [ ] Consistent spacing
- [ ] Smooth transitions
- [ ] Responsive design

---

## 📦 Data Structure (What We Actually Get)

```typescript
// From API (confirmed from backend code)
ServiceDetails = {
  // Service Fields
  id: number,
  name: string,
  description: string,
  price: number,
  EstimateDuration: number,
  image: string | null,          // Can be null/empty
  isActive: boolean,
  businessProfileId: number,

  // Provider Fields (from business_profiles JOIN)
  provider: {
    id: number,
    businessName: string,
    description: string | null,
    phone: string,                // ⚠️ TO BE HIDDEN
    state: string,
    city: string,
    logo: string | null,
    rating: number,
    isVerified: boolean,
  },

  // Empty Arrays (TODO in backend)
  slots: [],                     // Always empty
  reviews: []                   // Always empty
}
```

---

## ✅ Success Criteria

After refactoring:

- [ ] No full-page loader (only skeleton in content area)
- [ ] Header and navigation always visible
- [ ] No contact details shown
- [ ] Clean, minimal layout
- [] Proper spacing (not too much, not too little)
- [] Single-page layout (no tabs)
- [] Skeleton loading during data fetch
- [ ] Responsive on all screen sizes
- [ ] Booking flow still functional
- [ ] Reviews display (when data available)

---

**Priority:** HIGH
**Risk Level:** LOW
**Breaking Changes:** None (UI only)
**Backend Changes:** None
