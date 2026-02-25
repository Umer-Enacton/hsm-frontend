# Services Page Issues & Fix Plan

**Date:** 2026-02-25
**Page:** `app/(pages)/customer/services/page.tsx`
**Status:** DIAGNOSIS COMPLETE - READY TO IMPLEMENT

---

## Issues Identified

### Issue #1: Page Blinking on Filter Changes 🔴 CRITICAL

**Problem:** When changing filters or price slider, the entire page blinks/flashes.

**Root Cause:**
```typescript
// Lines 39-56: useEffect triggers on every filter change
useEffect(() => {
  loadServices();
}, [page, filters]);

const loadServices = async () => {
  setIsLoading(true);  // ❌ This triggers full page loader on every filter change
  // ...
  setIsLoading(false);
};

// Lines 119-128: Shows full page loader
if (isLoading && page === 1) {
  return (
    <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
      {/* Full page loader replaces entire content */}
    </div>
  );
}
```

**Why It Happens:**
1. User changes filter → `setFilters()` called
2. `useEffect` detects `filters` changed → calls `loadServices()`
3. `loadServices()` sets `isLoading(true)` immediately
4. Component returns full-page loader (unmounts entire content)
5. API request completes → `isLoading(false)`
6. Content re-mounts → **blinking effect**

**Impact:** Poor UX, jarring experience, page feels unresponsive

---

### Issue #2: No Inline Loading State 🟡 MEDIUM

**Problem:** No loading indicator while fetching filtered results.

**Current Behavior:**
- First load: Full page loader ✅ (correct)
- Filter changes: Full page loader ❌ (should be inline)
- Pagination changes: Full page loader ❌ (should be inline)

**Expected Behavior:**
- First load: Full page loader
- Subsequent loads: Skeleton cards or inline spinner in grid area

---

### Issue #3: Layout Not Centered/Properly Aligned 🟡 MEDIUM

**Problem:** Page content not properly centered or aligned.

**Issues:**
1. No max-width container - content spreads too wide on large screens
2. Header, search, and main content not constrained
3. Search bar not centered
4. Grid becomes too wide on ultra-wide screens

**Current Layout:**
```typescript
// Line 131: Root div has no max-width
<div className="space-y-6">
  {/* Content spreads to full viewport width */}
</div>
```

**Expected:**
- Centered container with max-width (e.g., 1400px or 1600px)
- Content properly aligned on all screen sizes

---

### Issue #4: Price Slider Causes Immediate API Call 🔴 CRITICAL

**Problem:** Dragging the price slider triggers API call on every change.

**Root Cause:**
```typescript
// Lines 96-104: Slider onChange fires immediately
const handlePriceChange = (values: number[]) => {
  setPriceRange([values[0], values[1]]);
  setFilters({
    ...filters,
    minPrice: values[0] === 0 ? undefined : values[0],
    maxPrice: values[1] === 10000 ? undefined : values[1],
  });
  setPage(1); // ❌ Triggers useEffect immediately
};
```

**Impact:**
- Dragging slider from 1000 to 5000 → ~40+ API calls
- Unnecessary server load
- Page blinks continuously while dragging

**Solution:** Debounce the slider onChange (wait 300-500ms after user stops dragging)

---

### Issue #5: Search Not Debounced 🟡 MEDIUM

**Problem:** Search triggers API call immediately on Enter key.

**Current:**
```typescript
// Lines 154-162: Search fires immediately on Enter
<Input
  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
/>
```

**Issue:** Fast typists get interrupted by API calls

**Solution:** Debounce search input (wait 500ms after typing stops)

---

### Issue #6: Mobile Filter Overlay Issues 🟢 LOW

**Problem:** Mobile filter overlay has some UX issues.

**Issues:**
1. No backdrop/overlay behind filters
2. No close button (only "Show Results" at bottom)
3. Can swipe/scroll outside when filters open

---

### Issue #7: No Skeleton Loading Cards 🟢 ENHANCEMENT

**Problem:** When filtering, no visual placeholder while loading.

**Enhancement:**
- Show skeleton cards while loading filtered results
- Better than inline spinner
- Maintains layout stability

---

### Issue #8: Filter State Management Clunky 🟡 MEDIUM

**Problem:** Filter state is duplicated between UI state and filter state.

**Current:**
```typescript
// Duplicated state
const [selectedState, setSelectedState] = useState<string>("all");
const [selectedCity, setSelectedCity] = useState<string>("all");
const [selectedCategory, setSelectedCategory] = useState<string>("all");
const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);

const [filters, setFilters] = useState<ServiceFilters>({});

// Each handler updates both ❌
const handleStateChange = (state: string) => {
  setSelectedState(state);        // Update UI state
  setFilters({                   // Update filter state
    ...filters,
    state: state === "all" ? undefined : state,
    city: undefined,
  });
};
```

**Issue:** Easy to get out of sync, verbose code

---

## Comprehensive Fix Plan

### Phase 1: Fix Page Blinking & Loading States (CRITICAL)

#### Fix 1.1: Separate Initial Loading from Filter Loading

**File:** `app/(pages)/customer/services/page.tsx`

**Changes:**
```typescript
// Add separate loading states
const [isInitialLoading, setIsInitialLoading] = useState(true);
const [isLoadingServices, setIsLoadingServices] = useState(false);

const loadServices = async () => {
  try {
    // Only show full-page loader on first load
    if (services.length === 0) {
      setIsInitialLoading(true);
    } else {
      setIsLoadingServices(true); // Inline loading for filters
    }

    const result = await getServices(filters);
    setServices(result.data || []);
    setTotal(result.total || 0);
  } catch (error) {
    // error handling
  } finally {
    setIsInitialLoading(false);
    setIsLoadingServices(false);
  }
};

// Update conditional render
if (isInitialLoading) {
  return <FullPageLoader />;
}

return (
  <div className="container">
    {/* Always show filters + grid */}
    {/* Show inline loading when isLoadingServices */}
  </div>
);
```

#### Fix 1.2: Add Inline Loading State to Grid

**Location:** In the services grid section

```typescript
{/* Services Grid */}
{isLoadingServices ? (
  <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
    {/* Show 6 skeleton cards while loading */}
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <Card key={i} className="animate-pulse">
        <CardContent className="p-6 space-y-4">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/2" />
          <div className="h-20 bg-muted rounded" />
        </CardContent>
      </Card>
    ))}
  </div>
) : (
  /* Actual services grid */
)}
```

---

### Phase 2: Debounce Price Slider & Search (CRITICAL)

#### Fix 2.1: Debounce Price Slider

**Add debounce hook:**
```typescript
import { useState, useEffect, useMemo } from "react";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// Use for price range
const priceRange = useState<[number, number]>([0, 10000]);
const debouncedPriceRange = useDebounce(priceRange, 500);

useEffect(() => {
  // Only update filters when debounced price changes
  setFilters(prev => ({
    ...prev,
    minPrice: debouncedPriceRange[0] === 0 ? undefined : debouncedPriceRange[0],
    maxPrice: debouncedPriceRange[1] === 10000 ? undefined : debouncedPriceRange[1],
  }));
}, [debouncedPriceRange]);
```

#### Fix 2.2: Debounce Search Input

**Changes:**
```typescript
const [searchQuery, setSearchQuery] = useState("");
const debouncedSearchQuery = useDebounce(searchQuery, 500);

useEffect(() => {
  // Trigger search when debounced query changes
  if (debouncedSearchQuery !== undefined) {
    setFilters(prev => ({
      ...prev,
      search: debouncedSearchQuery.trim() || undefined,
    }));
  }
}, [debouncedSearchQuery]);
```

---

### Phase 3: Fix Layout & Alignment (MEDIUM)

#### Fix 3.1: Add Container with Max-Width

**Changes:**
```typescript
return (
  <div className="space-y-6">
    {/* Wrap entire content in container */}
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        {/* ... */}
      </div>

      {/* Search Bar - Center it */}
      <div className="flex justify-center">
        <div className="flex gap-2 w-full max-w-2xl">
          {/* Search input */}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Filters sidebar */}
        {/* Services grid */}
      </div>
    </div>
  </div>
);
```

---

### Phase 4: Improve Mobile Filter Overlay (LOW)

#### Fix 4.1: Add Backdrop & Close Button

**Changes:**
```typescript
{/* Mobile Filter Overlay */}
{isMobileFilterOpen && (
  <>
    {/* Backdrop */}
    <div
      className="fixed inset-0 bg-black/50 z-40 md:hidden"
      onClick={() => setIsMobileFilterOpen(false)}
    />

    {/* Sidebar with close button */}
    <aside className="fixed inset-y-0 left-0 w-80 z-50 bg-background md:hidden overflow-y-auto">
      <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Filters</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileFilterOpen(false)}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Filter content */}
    </aside>
  </>
)}
```

---

### Phase 5: Refactor Filter State Management (OPTIONAL - ENHANCEMENT)

#### Fix 5.1: Consolidate Filter State

**Option A: Single State Object**
```typescript
const [filterState, setFilterState] = useState({
  state: "all",
  city: "all",
  category: "all",
  priceRange: [0, 10000] as [number, number],
  search: "",
});

// Derive filters from state
const filters = useMemo(() => ({
  state: filterState.state === "all" ? undefined : filterState.state,
  city: filterState.city === "all" ? undefined : filterState.city,
  categoryId: filterState.category === "all" ? undefined : parseInt(filterState.category),
  minPrice: filterState.priceRange[0] === 0 ? undefined : filterState.priceRange[0],
  maxPrice: filterState.priceRange[1] === 10000 ? undefined : filterState.priceRange[1],
  search: filterState.search || undefined,
}), [filterState]);
```

---

## Implementation Priority

### Priority 1 (CRITICAL - Must Fix):
1. ✅ Fix page blinking (separate loading states)
2. ✅ Debounce price slider (prevent multiple API calls)
3. ✅ Debounce search input

### Priority 2 (MEDIUM - Should Fix):
4. ✅ Add max-width container for proper centering
5. ✅ Center search bar
6. ✅ Add inline skeleton loading cards

### Priority 3 (LOW - Nice to Have):
7. ⚪ Improve mobile filter overlay
8. ⚪ Refactor filter state management
9. ⚪ Add animation transitions

---

## Expected Results

### Before Fix:
- ❌ Page blinks/flashes when changing filters
- ❌ Slider drags cause 40+ API calls
- ❌ No loading feedback during filter changes
- ❌ Content spreads too wide on large screens
- ❌ Search bar not centered

### After Fix:
- ✅ Smooth filter changes with inline loading
- ✅ Slider debounced (1 API call after user stops dragging)
- ✅ Search debounced (500ms delay)
- ✅ Centered, properly constrained layout
- ✅ Centered search bar
- ✅ Skeleton cards during loading
- ✅ Better mobile filter UX

---

## Files to Modify

**Primary:**
- `app/(pages)/customer/services/page.tsx` - Main fixes

**Potential New Files:**
- `components/services/ServiceCardSkeleton.tsx` - Reusable skeleton component
- `hooks/useDebounce.ts` - Debounce hook (if used elsewhere)

---

## Testing Checklist

### Manual Testing:
1. ✅ First page load shows full loader
2. ✅ Changing state filter → inline loading (no blink)
3. ✅ Dragging price slider → no API calls until stop
4. ✅ Typing search → debounced (waits 500ms)
5. ✅ Layout is centered on all screen sizes
6. ✅ Mobile filter overlay has backdrop
7. ✅ Mobile filter has close button
8. ✅ Skeleton cards shown during loading
9. ✅ Pagination works smoothly
10. ✅ Clear all filters resets everything

---

## Performance Impact

**Before:**
- 40+ API calls during price slider drag
- Full page re-render on every filter change
- Layout shifts causing CLS (Cumulative Layout Shift)

**After:**
- 1 API call after slider stops (500ms debounce)
- Minimal re-renders (only grid area)
- Stable layout with skeletons (no CLS)
- Better perceived performance

---

**Priority:** HIGH - Critical UX issues
**Estimated Time:** 1-2 hours
**Risk Level:** LOW - Isolated component changes
**Breaking Changes:** None
