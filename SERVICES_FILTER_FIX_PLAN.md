# Services Page Filters & Search Fix Plan

**Date:** 2026-02-25
**Status:** DIAGNOSIS COMPLETE - READY TO IMPLEMENT

---

## Problem Analysis

### Root Cause Identified

The **backend `getAllServices()` function does NOT implement any filtering logic**. It simply returns all services from the database without processing query parameters.

**Evidence:**
```javascript
// File: home-service-management-backend/controllers/service.controller.js
// Lines 5-50: getAllServices function

const getAllServices = async (req, res) => {
  try {
    const allServices = await db
      .select({...})
      .from(services)
      .leftJoin(businessProfiles, eq(services.businessProfileId, businessProfiles.id));

    // ❌ NO FILTERING LOGIC HERE
    // ❌ Query params (search, state, city, category_id, min_price, max_price) are ignored

    res.status(200).json({ services: servicesWithReviews, total: servicesWithReviews.length });
  }
}
```

### Current Data Flow

```
Frontend                                    Backend
───────                                    └──────┘
User selects filter → Update state
        │
        ▼
setFilters({state: "Maharashtra"})        ❌ Request received with ?state=Maharashtra
        │                                  but req.query is NEVER READ
        ▼
getServices(filters)
        │
        ▼
Build URL with query params                ❌ All services returned regardless of filters
        │
        ▼
GET /services?state=Maharashtra&city=Mumbai
        │
        ▼
❌ Shows all services (no filtering)
```

---

## Issues Summary

### Issue #1: Filters Not Working ❌

**Affected Filters:**
- State dropdown
- City dropdown (dependent on state)
- Category dropdown
- Price range slider (minPrice, maxPrice)

**Why It Fails:**
- Backend doesn't read `req.query.state`, `req.query.city`, `req.query.category_id`, `req.query.min_price`, `req.query.max_price`
- No WHERE clauses applied to database query
- No filtering logic in controller

**Current Frontend Implementation:** ✅ CORRECT
- Properly builds query string with filter parameters
- Sends correct API requests

**Example:**
```typescript
// Frontend (lib/customer/api.ts) - WORKING CORRECTLY
if (filters?.state) params.append("state", filters.state);
if (filters?.city) params.append("city", filters.city);
if (filters?.categoryId) params.append("category_id", filters.categoryId.toString());
if (filters?.minPrice) params.append("min_price", filters.minPrice.toString());
if (filters?.maxPrice) params.append("max_price", filters.maxPrice.toString());
```

### Issue #2: Search Not Working ❌

**Why It Fails:**
- Backend doesn't read `req.query.search`
- No SQL LIKE/ILIKE query for searching service names or descriptions
- Search parameter sent but ignored

**Current Frontend Implementation:** ✅ CORRECT
```typescript
// Frontend (lib/customer/api.ts) - WORKING CORRECTLY
if (filters?.search) params.append("search", filters.search);
```

### Issue #3: Database Query Missing JOIN Conditions

**Current Query:**
```javascript
const allServices = await db
  .select({...})
  .from(services)
  .leftJoin(businessProfiles, eq(services.businessProfileId, businessProfiles.id));
```

**Missing:**
- No filtering by `businessProfiles.state` or `businessProfiles.city`
- No filtering by `services.price` range
- No filtering by `services.categoryId` (if exists)
- No search on `services.name` OR `services.description`

---

## Implementation Plan

### Phase 1: Backend Filter Implementation (REQUIRED)

**File:** `home-service-management-backend/controllers/service.controller.js`

**Changes Required:**

1. **Import additional Drizzle ORM operators:**
```javascript
const { eq, and, or, like, ilike, gte, lte } = require("drizzle-orm");
```

2. **Read query parameters in getAllServices:**
```javascript
const {
  state,
  city,
  category_id,
  min_price,
  max_price,
  search
} = req.query;
```

3. **Build dynamic WHERE conditions:**
```javascript
const conditions = [];

// Search filter (search in service name OR description)
if (search) {
  conditions.push(
    or(
      ilike(services.name, `%${search}%`),
      ilike(services.description, `%${search}%`)
    )
  );
}

// Location filters (from business profile)
if (state) {
  conditions.push(eq(businessProfiles.state, state));
}
if (city) {
  conditions.push(eq(businessProfiles.city, city));
}

// Category filter (if category field exists on services)
if (category_id) {
  conditions.push(eq(services.categoryId, Number(category_id)));
}

// Price range filters
if (min_price) {
  conditions.push(gte(services.price, Number(min_price)));
}
if (max_price) {
  conditions.push(lte(services.price, Number(max_price)));
}

// Combine all conditions
const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
```

4. **Apply WHERE clause to query:**
```javascript
const query = db
  .select({...})
  .from(services)
  .leftJoin(businessProfiles, eq(services.businessProfileId, businessProfiles.id));

if (whereClause) {
  query.where(whereClause);
}

const allServices = await query;
```

### Phase 2: Frontend Enhancements (OPTIONAL - Only for UX improvements)

**Current Frontend:** ✅ ALREADY WORKING
- Filter state management is correct
- URL building is correct
- API calls are correct

**Optional Enhancements:**
1. Add loading indicator during filter changes
2. Debounce search input (wait 300ms after typing stops)
3. Show "No results found" message when filters return empty
4. Persist filter state in URL query params (for shareable links)
5. Add "Clear All Filters" button to main content area

---

## Implementation Steps

### Step 1: Update Backend Controller
- [ ] Add Drizzle operator imports (like, ilike, gte, lte, sql)
- [ ] Extract query parameters from req.query
- [ ] Build dynamic WHERE conditions array
- [ ] Apply WHERE clause to database query
- [ ] Test each filter independently

### Step 2: Test Filter Functionality
- [ ] Test state filter (select Maharashtra → show only Maharashtra services)
- [ ] Test city filter (select Mumbai → show only Mumbai services)
- [ ] Test category filter (select Cleaning → show only cleaning services)
- [ ] Test price range (set min=500, max=2000 → show services in range)
- [ ] Test search (type "plumbing" → show plumbing services)
- [ ] Test combined filters (state + city + category + price)

### Step 3: Verify Frontend Integration
- [ ] Check browser DevTools → Network tab
- [ ] Verify query parameters are being sent correctly
- [ ] Verify response contains filtered results
- [ ] Check console logs from getServices() function

### Step 4: Edge Cases & Error Handling
- [ ] Handle invalid filter values (non-numeric price)
- [ ] Handle empty results (show "No services found" message)
- [ ] Handle SQL injection prevention (use parameterized queries)
- [ ] Add console.log debugging for backend (development mode)

---

## Expected Outcome

### Before Fix:
```
User filters: State=Maharashtra, City=Mumbai, Price=500-2000
API Request: GET /services?state=Maharashtra&city=Mumbai&min_price=500&max_price=2000
API Response: ALL services (50 total) ❌
Display: All 50 services shown ❌
```

### After Fix:
```
User filters: State=Maharashtra, City=Mumbai, Price=500-2000
API Request: GET /services?state=Maharashtra&city=Mumbai&min_price=500&max_price=2000
API Response: Filtered services (5 total) ✅
Display: Only 5 services matching filters ✅
```

---

## Backend Schema Requirements

**Required for category filter:**
The `services` table should have a `categoryId` field. If it doesn't exist:

**Option A:** Add categoryId to services table
```javascript
// In models/schema.js
export const services = pgTable("services", {
  // ... existing fields
  categoryId: integer("category_id").references(() => categories.id),
});
```

**Option B:** Remove category filter from frontend if not needed

---

## Testing Checklist

### Manual Testing Steps:
1. ✅ Navigate to `/customer/services`
2. ✅ Select "Maharashtra" from State dropdown
3. ✅ Verify only services from Maharashtra are shown
4. ✅ Select "Mumbai" from City dropdown (should appear after selecting state)
5. ✅ Verify only services from Mumbai, Maharashtra are shown
6. ✅ Move price slider to min=500, max=2000
7. ✅ Verify only services within price range are shown
8. ✅ Select "Cleaning" from Category dropdown
9. ✅ Verify only cleaning services are shown
10. ✅ Type "plumbing" in search box and click Search
11. ✅ Verify only services matching "plumbing" are shown
12. ✅ Click "Clear All Filters"
13. ✅ Verify all services are shown again

### API Testing (using curl or Postman):
```bash
# Test state filter
curl "http://localhost:8000/services?state=Maharashtra"

# Test city filter
curl "http://localhost:8000/services?city=Mumbai"

# Test price range
curl "http://localhost:8000/services?min_price=500&max_price=2000"

# Test search
curl "http://localhost:8000/services?search=plumbing"

# Test combined filters
curl "http://localhost:8000/services?state=Maharashtra&city=Mumbai&min_price=500&max_price=2000&search=cleaning"
```

---

## Notes

- **Frontend does NOT need changes** for basic filtering to work
- **Backend MUST implement filter logic** in the controller
- Consider adding pagination support (page, limit parameters)
- Consider adding sorting options (price_asc, price_desc, rating)
- Consider adding total count before pagination (for UI display)

---

## Related Files

**Backend:**
- `home-service-management-backend/controllers/service.controller.js` - MODIFY
- `home-service-management-backend/models/schema.js` - CHECK for categoryId
- `home-service-management-backend/routes/service.route.js` - NO CHANGE NEEDED

**Frontend:**
- `app/(pages)/customer/services/page.tsx` - NO CHANGE NEEDED (already correct)
- `lib/customer/api.ts` - NO CHANGE NEEDED (already correct)
- `types/customer/index.ts` - NO CHANGE NEEDED (already correct)

---

**Priority:** CRITICAL - Core functionality broken
**Estimated Time:** 30-60 minutes for backend implementation
**Risk Level:** LOW - Isolated change to one controller function
