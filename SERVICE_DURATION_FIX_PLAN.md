# Service Duration Fix Plan 🔧

## Root Causes Identified

### 1. Backend Field Name Mismatch
- **Backend database schema:** `EstimateDuration`
- **Backend controller returns:** `duration` (should be mapped)
- **Frontend expects:** `duration`
- **Issue:** Field may not be properly mapped, causing undefined

### 2. TypeScript Generic Syntax Issue
```typescript
// ❌ Wrong - causes "Cannot read properties of undefined"
useState<"minutes" | "hours" | "days">("minutes")

// ✅ Correct
useState<"minutes" | "hours" | "days">("minutes")
// But better to avoid complex generics in Next.js
```

### 3. Duration Value Issues
- When service.duration is undefined → `toString()` fails
- When formatDuration gets NaN/undefined → shows "NaN day"

## Fix Strategy

### Phase 1: Fix Backend Controller (Map Fields Properly)
**File:** `controllers/service.controller.js`

Update response to ensure proper field mapping:
```javascript
// When returning service, map EstimateDuration to duration
const serviceResponse = {
  ...newService,
  duration: newService.EstimateDuration, // Map field
};
```

### Phase 2: Fix Frontend Type Safety
**File:** `types/provider/index.ts`

Make duration optional and add getter:
```typescript
export interface Service {
  id: number;
  businessId: number;
  name: string;
  description?: string;
  price: number;
  duration?: number; // Make optional
  EstimateDuration?: number; // Also support backend field
  image?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}
```

### Phase 3: Fix ServiceDialog Component
**File:** `components/provider/services/ServiceDialog.tsx`

1. Fix TypeScript syntax
2. Add safety checks for undefined duration
3. Handle duration parsing correctly

### Phase 4: Fix ServiceCard Component
**File:** `components/provider/services/ServiceCard.tsx`

Add safety checks for undefined/NaN duration

### Phase 5: Fix API Response Mapping
**File:** `lib/provider/services.ts`

Add field mapping in getBusinessServices to normalize data

## Implementation Order

1. **Backend first** - Fix controller to return `duration` field
2. **Frontend types** - Update Service interface
3. **API layer** - Add field mapping for safety
4. **Components** - Add safety checks

## Expected Outcome

After fixes:
- Duration displays correctly (e.g., "2 hours", "30 mins")
- No "NaN day" messages
- No undefined toString() errors
- Create/Edit works with duration in minutes

## Testing Checklist

- [ ] Load services - duration displays correctly
- [ ] Create service - duration saves properly
- [ ] Edit service - duration loads and updates
- [ ] Format duration shows correct units
- [ ] No NaN or undefined errors
