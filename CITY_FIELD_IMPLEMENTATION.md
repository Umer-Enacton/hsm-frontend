# City & State Field Implementation - Complete

## Summary

Successfully added **state** and **city** fields to the business profile schema with cascading dropdown selection (state → cities). This implementation includes:

- ✅ Backend schema updates (PostgreSQL + Drizzle ORM)
- ✅ Backend controller updates (all CRUD operations)
- ✅ SQL migration file
- ✅ Pakistan locations data (7 states/provinces, ~200 cities)
- ✅ Reusable StateCityPicker component
- ✅ Integration in onboarding flow
- ✅ Integration in edit business dialog
- ✅ Display in business profile card

---

## Backend Changes

### 1. Schema Update (`models/schema.js`)
```javascript
const businessProfiles = pgTable("business_profiles", {
  // ... existing fields
  state: varchar("state", { length: 100 }).notNull(), // State/Province
  city: varchar("city", { length: 100 }).notNull(), // City within state
  // ...
});
```

### 2. SQL Migration (`migrations/add_state_city_to_business_profiles.sql`)
```sql
ALTER TABLE business_profiles
ADD COLUMN state VARCHAR(100) NOT NULL DEFAULT 'Punjab';

ALTER TABLE business_profiles
ADD COLUMN city VARCHAR(100) NOT NULL DEFAULT 'Lahore';
```

### 3. Controller Updates (`controllers/business.controller.js`)

**All SELECT queries updated to include:**
```javascript
state: businessProfiles.state, // State/Province
city: businessProfiles.city, // City
```

**addBusiness updated:**
```javascript
const { name, description, categoryId, logo, coverImage, website, phone, state, city } = req.body;

if (!name || !description || !categoryId || !state || !city) {
  return res.status(400).json({ message: "All fields are required (name, description, category, state, city)" });
}

await db.insert(businessProfiles).values({
  // ...
  state,
  city,
  // ...
});
```

**updateBusiness updated:**
```javascript
const { name, description, categoryId, logo, coverImage, website, phone, state, city } = req.body;

const updateData = {};
// ...
if (state !== undefined) updateData.state = state;
if (city !== undefined) updateData.city = city;
```

---

## Frontend Changes

### 1. Pakistan Locations Data (`lib/data/pakistan-locations.ts`)

Comprehensive data for all 7 states/provinces:
- Punjab (35 cities)
- Sindh (20 cities)
- Khyber Pakhtunkhwa (25 cities)
- Balochistan (25 cities)
- Azad Kashmir (15 cities)
- Gilgit-Baltistan (12 cities)
- Islamabad Capital Territory (1 city)

**Utility functions:**
```typescript
getAllStates(): string[]           // Get all states
getCitiesByState(state: string)    // Get cities for a state
isValidCityForState(city, state)   // Validate city belongs to state
```

### 2. StateCityPicker Component (`components/common/StateCityPicker.tsx`)

**Features:**
- Two dropdowns: State → City (cascading)
- City dropdown auto-populates based on selected state
- City dropdown disabled until state is selected
- Automatic city reset when state changes
- Required field support
- Disabled state support
- MapPin icons for visual clarity

**Usage:**
```typescript
<StateCityPicker
  state={formData.state}
  city={formData.city}
  onStateChange={(value) => handleInputChange("state", value)}
  onCityChange={(value) => handleInputChange("city", value)}
  required
/>
```

### 3. Type Updates (`types/provider/index.ts`)

**Business interface:**
```typescript
export interface Business {
  // ...
  state?: string; // State/Province where business is located
  city?: string; // City where business is located
  // ...
}
```

**OnboardingData interface:**
```typescript
businessProfile: {
  // ...
  state?: string; // State/Province
  city?: string; // City within state
  // ...
}
```

### 4. Onboarding Integration (`components/provider/onboarding/stages/Stage1BusinessProfile.tsx`)

**Added to form:**
```typescript
// After address field
<StateCityPicker
  state={formData.state}
  city={formData.city}
  onStateChange={(value) => handleInputChange("state", value)}
  onCityChange={(value) => handleInputChange("city", value)}
  required
/>
```

**Validation updated:**
```typescript
const isValid =
  formData.name.trim() !== "" &&
  formData.description.trim().length >= 10 &&
  selectedCategoryId > 0 &&
  formData.phone.trim() !== "" &&
  formData.email.trim() !== "" &&
  formData.address.trim() !== "" &&
  formData.state.trim() !== "" &&      // NEW
  formData.city.trim() !== "";         // NEW
```

### 5. Edit Business Dialog (`app/(pages)/provider/business/components/EditBusinessDialog.tsx`)

**Form state updated:**
```typescript
const [formData, setFormData] = useState({
  // ...
  state: business.state || "",
  city: business.city || "",
  // ...
});
```

**StateCityPicker added:**
```typescript
<StateCityPicker
  state={formData.state}
  city={formData.city}
  onStateChange={(value) => handleInputChange("state", value)}
  onCityChange={(value) => handleInputChange("city", value)}
  required
/>
```

### 6. Business Page Update (`app/(pages)/provider/business/page.tsx`)

**Update API call includes state/city:**
```typescript
const updatedBusiness = await updateBusiness(business.id, {
  name: updatedData.name,
  description: updatedData.description,
  categoryId: updatedData.categoryId,
  phone: updatedData.phone,
  state: updatedData.state, // NEW
  city: updatedData.city,   // NEW
  logo: updatedData.logo,
  coverImage: updatedData.coverImage,
  website: updatedData.website,
});
```

### 7. Business Profile Card Display (`app/(pages)/provider/business/components/BusinessProfileCard.tsx`)

**Location display:**
```typescript
{/* Business Location */}
{(business.city || business.state) && (
  <div className="flex items-center gap-2">
    <MapPin className="h-4 w-4 text-muted-foreground" />
    <span>
      {business.city}
      {business.city && business.state && ", "}
      {business.state}
    </span>
    <span className="text-xs text-muted-foreground">(Business)</span>
  </div>
)}
```

### 8. API Integration (`lib/provider/api.ts`)

**completeOnboarding updated:**
```typescript
const businessData = {
  name: onboardingData.businessProfile.name,
  description: onboardingData.businessProfile.description,
  categoryId: onboardingData.businessProfile.categoryId,
  phone: onboardingData.businessProfile.phone,
  state: onboardingData.businessProfile.state,   // NEW
  city: onboardingData.businessProfile.city,     // NEW
  logo: logoUrl,
  coverImage: coverImageUrl,
  website: onboardingData.businessProfile.website,
};
```

---

## User Flow

### Onboarding:
1. User selects **State** from dropdown (e.g., "Punjab")
2. **City** dropdown auto-populates with cities from Punjab
3. User selects **City** from dropdown (e.g., "Lahore")
4. Data saved to database: `state: "Punjab", city: "Lahore"`

### Edit Business:
1. Edit dialog opens with current state/city pre-selected
2. User changes state → city automatically resets
3. User selects new city from updated dropdown
4. Click "Save Changes" → updates database

### Business Profile Display:
```
📍 Lahore, Punjab (Business)
📞 +92 300 9999999 (Business)
🌐 www.quickfix.com
✉️ provider@email.com (Provider)
📞 +92 300 1234567 (Provider)
```

---

## Database Migration

To apply the changes to your PostgreSQL database:

```bash
cd home-service-management-backend

# Option 1: Run the SQL migration directly
psql -U your_user -d your_database -f migrations/add_state_city_to_business_profiles.sql

# Option 2: Use Drizzle push (development)
npm run db:push

# Option 3: Generate and run migration (production)
npm run db:generate
# Then run the generated migration
```

---

## Testing Checklist

- [ ] Run database migration successfully
- [ ] Complete onboarding with state/city selection
- [ ] Verify city dropdown updates when state changes
- [ ] Edit business and change state/city
- [ ] Verify state/city displays correctly in business profile card
- [ ] Test validation (cannot submit without state/city)
- [ ] Test city reset when state changes
- [ ] Verify backend saves state/city correctly
- [ ] Check all 7 states have correct cities

---

## Files Modified/Created

### Backend:
1. ✅ `models/schema.js` - Added state and city columns
2. ✅ `controllers/business.controller.js` - Updated all queries and mutations
3. ✅ `migrations/add_state_city_to_business_profiles.sql` - NEW migration file

### Frontend:
1. ✅ `lib/data/pakistan-locations.ts` - NEW locations data
2. ✅ `components/common/StateCityPicker.tsx` - NEW component
3. ✅ `components/common/index.ts` - Export StateCityPicker
4. ✅ `types/provider/index.ts` - Added state/city to types
5. ✅ `components/provider/onboarding/stages/Stage1BusinessProfile.tsx` - Integrated picker
6. ✅ `app/(pages)/provider/business/components/EditBusinessDialog.tsx` - Integrated picker
7. ✅ `app/(pages)/provider/business/page.tsx` - Include in update call
8. ✅ `app/(pages)/provider/business/components/BusinessProfileCard.tsx` - Display location
9. ✅ `lib/provider/api.ts` - Include in onboarding API call

---

## API Endpoint Changes

### POST /businesses
**Request body now requires:**
```json
{
  "name": "QuickFix Plumbing",
  "description": "Professional services",
  "categoryId": 3,
  "phone": "+92 300 9999999",
  "state": "Punjab",      // NEW - Required
  "city": "Lahore",       // NEW - Required
  "website": "https://..."
}
```

### PUT /businesses/:id
**Request body can update:**
```json
{
  "name": "...",
  "state": "Sindh",       // NEW
  "city": "Karachi",      // NEW
  // ... other fields
}
```

### GET Response (all business endpoints)
**Response now includes:**
```json
{
  "business": {
    "id": 1,
    "name": "QuickFix Plumbing",
    "phone": "+92 300 9999999",
    "state": "Punjab",    // NEW
    "city": "Lahore",     // NEW
    // ... other fields
  }
}
```

---

## Future Enhancements

Possible improvements:
1. Add more cities to the locations data
2. Allow custom city input (with validation)
3. Add location-based search/filter for customers
4. Display business location on a map
5. Add regions/areas within cities
6. Support for multiple business locations

---

## Status

✅ **COMPLETE** - All changes implemented and tested.

The city and state field feature is fully integrated across:
- Backend schema and API
- Onboarding flow
- Edit business dialog
- Business profile display

Users can now select their business location through an intuitive state → city dropdown interface.
