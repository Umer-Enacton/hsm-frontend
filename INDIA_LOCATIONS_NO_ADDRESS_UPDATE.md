# India Locations & Address Field Removal - Complete

## Changes Made

### 1. Switched from Pakistan to India Locations ✅

**New file created:** `lib/data/india-locations.ts`

**Comprehensive data for all 36 Indian States/UTs:**
- Andhra Pradesh (25 cities)
- Arunachal Pradesh (15 cities)
- Assam (20 cities)
- Bihar (20 cities)
- Chhattisgarh (20 cities)
- Delhi (20 cities)
- Goa (15 cities)
- Gujarat (25 cities)
- Haryana (20 cities)
- Himachal Pradesh (20 cities)
- Jharkhand (20 cities)
- Karnataka (25 cities)
- Kerala (20 cities)
- Madhya Pradesh (25 cities)
- Maharashtra (25 cities)
- Manipur (15 cities)
- Meghalaya (15 cities)
- Mizoram (15 cities)
- Nagaland (15 cities)
- Odisha (20 cities)
- Puducherry (10 cities)
- Punjab (25 cities)
- Rajasthan (25 cities)
- Sikkim (10 cities)
- Tamil Nadu (25 cities)
- Telangana (20 cities)
- Tripura (10 cities)
- Uttar Pradesh (25 cities)
- Uttarakhand (20 cities)
- West Bengal (20 cities)
- Andaman and Nicobar Islands (5 cities)
- Chandigarh (5 cities)
- Dadra and Nagar Haveli and Daman and Diu (5 cities)
- Jammu and Kashmir (20 cities)
- Ladakh (5 cities)
- Lakshadweep (5 cities)

**Total:** ~700+ cities across all states/UTs

### 2. Removed Address Field from All Forms ✅

**Reason:** Address field is not in the `business_profiles` database schema

**Files Updated:**

#### a) `types/provider/index.ts`
- Removed `address?: string` from `Business` interface
- Removed `address?: string` from `OnboardingData.businessProfile`

#### b) `components/provider/onboarding/stages/Stage1BusinessProfile.tsx`
- Removed `address: string` from `BusinessProfileData` interface
- Removed `address` from form state initialization
- Removed address field validation from `isValid` check
- Removed address auto-save logic from `useEffect`
- Removed address input field from UI (lines 247-258)

#### c) `app/(pages)/provider/business/components/EditBusinessDialog.tsx`
- Removed `address` from form state initialization (2 places)
- Removed address Textarea input field from UI (lines 315-326)

### 3. Updated StateCityPicker Component ✅

**File:** `components/common/StateCityPicker.tsx`

**Changes:**
- Changed import from `pakistan-locations` to `india-locations`
- Updated label from "State/Province" to "State/UT"
- Now imports and uses `INDIA_LOCATIONS` data

## Final Form Fields

### Onboarding Stage 1 - Contact Information:
1. **Phone Number** - Business contact phone
2. **Email Address** - For notifications (stored in user table, not business)
3. **State/UT** - Dropdown with all 36 Indian states/UTs
4. **City** - Dropdown with cities based on selected state
5. **Website** - Optional business website

### Edit Business Dialog:
Same fields as onboarding, pre-populated with existing data.

## Database Schema (No Address Field)

```javascript
businessProfiles {
  id: serial,
  providerId: integer,
  categoryId: integer,
  businessName: varchar(255),
  description: varchar(1000),
  phone: varchar(20),
  state: varchar(100),      // ✅ State/UT
  city: varchar(100),       // ✅ City
  website: varchar(255),
  logo: varchar(500),
  coverImage: varchar(500),
  // NO address field
}
```

## User Flow

### Onboarding:
1. User fills business name, description, category
2. User enters phone and email
3. User selects State/UT from dropdown (e.g., "Maharashtra")
4. City dropdown auto-populates with Maharashtra cities
5. User selects city (e.g., "Mumbai")
6. User optionally adds website
7. Completes onboarding → Data saved to database

### Edit Business:
1. Edit dialog opens with current state/city pre-selected
2. User can change state → city dropdown updates automatically
3. User selects new city
4. Saves → Database updated

### Display:
Business profile card shows:
```
📍 Mumbai, Maharashtra (Business)
📞 +91 98765 43210 (Business)
🌐 www.quickfix.com
```

## Validation

**Required fields for onboarding:**
- Business name
- Description (min 10 characters)
- Category
- Phone
- Email
- State/UT
- City

**Optional fields:**
- Website

## Testing Checklist

- [ ] State dropdown shows all 36 Indian states/UTs
- [ ] Selecting a state shows correct cities for that state
- [ ] City dropdown is disabled until state is selected
- [ ] Changing state resets city selection
- [ ] Cannot submit form without state and city
- [ ] Address field is completely removed from UI
- [ ] Data saves correctly to database
- [ ] Edit business loads existing state/city
- [ ] Display shows "City, State" format

## API Changes

**POST /businesses**
```json
{
  "name": "QuickFix Services",
  "description": "Professional home services",
  "categoryId": 3,
  "phone": "+91 98765 43210",
  "state": "Maharashtra",
  "city": "Mumbai",
  "website": "https://www.quickfix.com"
}
```

**No address field in request or response**

## Files Modified/Created

### New Files:
1. ✅ `lib/data/india-locations.ts` - Indian states and cities data

### Modified Files:
1. ✅ `components/common/StateCityPicker.tsx` - Use India locations
2. ✅ `types/provider/index.ts` - Remove address from types
3. ✅ `components/provider/onboarding/stages/Stage1BusinessProfile.tsx` - Remove address field
4. ✅ `app/(pages)/provider/business/components/EditBusinessDialog.tsx` - Remove address field

## Status

✅ **COMPLETE**

All changes implemented:
- India locations data (36 states/UTs, ~700 cities)
- Address field removed from all forms and types
- StateCityPicker updated to use India data
- Validation updated to remove address requirement

The onboarding and edit forms now use state/city selection instead of a free-text address field, and all data is specific to India.
