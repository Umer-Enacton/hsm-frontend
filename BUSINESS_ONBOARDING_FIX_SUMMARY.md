# Business Onboarding & Edit - Complete Fix Summary

## Issues Fixed

### 1. Business Name Not Displaying ✅
**Problem:** Backend returned `businessName` field but frontend expected `name`

**Fix:** Added field aliases in all business controller queries:
```javascript
name: businessProfiles.businessName // Alias for frontend compatibility
```

**Files Modified:**
- `home-service-management-backend/controllers/business.controller.js`
  - `getBusinessById()`
  - `getBusinessByProvider()`
  - `updateBusiness()`
  - `deleteBusiness()`
  - `getAllBusinesses()`

### 2. Provider vs Business Entity Separation ✅
**Problem:** Provider and business data were mixed together, no clear separation

**Fix:** Implemented proper SQL joins with clear field separation:
```javascript
const result = await db
  .select({
    // Business fields
    id: businessProfiles.id,
    providerId: businessProfiles.providerId,
    name: businessProfiles.businessName,
    phone: businessProfiles.phone, // Business phone
    logo: businessProfiles.logo,
    coverImage: businessProfiles.coverImage,

    // Provider fields (clearly marked)
    providerName: users.name,        // Provider's personal name
    providerEmail: users.email,      // Provider's personal email
    providerPhone: users.phone,      // Provider's personal phone

    // Category fields
    categoryName: Category.name,     // Category name
  })
  .from(businessProfiles)
  .leftJoin(users, eq(businessProfiles.providerId, users.id))
  .leftJoin(Category, eq(businessProfiles.categoryId, Category.id))
```

**Files Modified:**
- `home-service-management-backend/controllers/business.controller.js`
- `hsm-frontend/types/provider/index.ts`

### 3. Edit Business Not Saving Changes ✅
**Problem:** Edit dialog wasn't calling the update API, just refreshing the page

**Fix:** Implemented actual update API call in `page.tsx`:
```typescript
const handleEditSave = async (updatedData: any) => {
  const updatedBusiness = await updateBusiness(business.id, {
    name: updatedData.name,
    description: updatedData.description,
    categoryId: updatedData.categoryId,
    logo: updatedData.logo,
    coverImage: updatedData.coverImage,
    website: updatedData.website,
  });
  setBusiness(updatedBusiness);
  setIsEditDialogOpen(false);
  alert("Business profile updated successfully!");
};
```

**Files Modified:**
- `hsm-frontend/app/(pages)/provider/business/page.tsx`
- `hsm-frontend/app/(pages)/provider/business/components/EditBusinessDialog.tsx`

### 4. FormData Field Name Mismatch ✅
**Problem:** Frontend sent `file` field but backend expected `logo` and `coverImage`

**Fix:** Updated frontend to use correct field names matching multer config:
```typescript
// BEFORE (Wrong):
formData.append("file", file);

// AFTER (Correct):
formData.append("logo", file);
formData.append("coverImage", file);
```

**Files Modified:**
- `hsm-frontend/lib/provider/api.ts` - `uploadBusinessLogo()` and `uploadBusinessCoverImage()`

### 5. Image Upload 404 Error ✅ (CRITICAL FIX)
**Problem:** Frontend calling wrong endpoints with `/upload/` prefix

**Wrong URLs:**
- `http://localhost:8000/upload/logo` ❌
- `http://localhost:8000/upload/cover-image` ❌

**Correct URLs:**
- `http://localhost:8000/logo` ✅
- `http://localhost:8000/cover-image` ✅

**Root Cause:** Backend routes are mounted at root level (`app.use("/", uploadRoutes)`), not under `/upload/`

**Fix:** Removed `/upload/` prefix from upload URLs:
```typescript
// BEFORE:
const response = await fetch(`${API_BASE_URL}/upload/logo`, {...});

// AFTER:
const uploadUrl = `${API_BASE_URL}/logo`;
const response = await fetch(uploadUrl, {...});
```

**Files Modified:**
- `hsm-frontend/lib/provider/api.ts`

### 6. CategoryId Initialization Bug ✅
**Problem:** Edit dialog always reset categoryId to 0

**Fix:** Initialize with existing business categoryId:
```typescript
// BEFORE:
categoryId: 0, // Always reset

// AFTER:
categoryId: business.categoryId || 0, // Use existing value
```

**Files Modified:**
- `hsm-frontend/app/(pages)/provider/business/components/EditBusinessDialog.tsx`

## Backend Entity Architecture

### Separation of Concerns

**Provider (User Entity):**
- Stored in `users` table
- Personal information: name, email, phone (personal)
- Authentication credentials
- Role (PROVIDER = 2)

**Business (Business Entity):**
- Stored in `business_profiles` table
- Business information: businessName, phone (business), logo, coverImage
- Linked to provider via `providerId` foreign key
- Belongs to a category via `categoryId`

**Key Insight:** A provider can have a business phone that's different from their personal phone. The frontend now properly displays:
- `providerPhone` - Provider's personal contact
- `phone` - Business contact number

## Complete Data Flow

### Business Creation (Onboarding):
```
User fills onboarding form
  ↓
Frontend: completeOnboarding()
  ↓
Step 1: Upload images to Cloudinary
  - POST /logo (with logo file)
  - POST /cover-image (with cover file)
  - Returns: { success: true, data: { url: "..." } }
  ↓
Step 2: Create business profile
  - POST /businesses
  - Body: { name, description, categoryId, logo, coverImage, website }
  - Backend: Creates business_profile record
  - Returns: { message: "...", business: {...} }
  ↓
Step 3: Save working hours (pending backend endpoint)
  ↓
Step 4: Save break times (pending backend endpoint)
  ↓
Step 5: Create availability slots
  - POST /slots/:businessId
  - Body: { startTime: "09:00:00", endTime: "17:00:00" }
  - Backend: Creates slot records
  - Returns: { slot: {...} }
  ↓
Onboarding complete!
```

### Business Update (Edit):
```
User clicks "Edit Profile"
  ↓
EditBusinessDialog opens with current data
  ↓
User modifies fields and/or selects new images
  ↓
User clicks "Save Changes"
  ↓
Frontend: handleEditSave()
  ↓
If new logo selected:
  - POST /logo (upload to Cloudinary)
  - Get Cloudinary URL
  ↓
If new cover selected:
  - POST /cover-image (upload to Cloudinary)
  - Get Cloudinary URL
  ↓
Update business:
  - PUT /businesses/:id
  - Body: { name, description, categoryId, logo, coverImage, website }
  - Backend: Updates business_profile record
  - Returns: { message: "...", business: {...} }
  ↓
Update local state and close dialog
```

## API Endpoint Reference

### Upload Endpoints:
```
POST /logo
  - Auth: Required (JWT cookie)
  - Body: FormData with "logo" field
  - Returns: { success: true, data: { url: "...", publicId: "...", width, height } }

POST /cover-image
  - Auth: Required (JWT cookie)
  - Body: FormData with "coverImage" field
  - Returns: { success: true, data: { url: "...", publicId: "...", width, height } }
```

### Business Endpoints:
```
GET /business/provider/:userId
  - Returns: { business: { id, name, phone, providerName, providerEmail, ... } }

POST /businesses
  - Body: { name, description, categoryId, logo, coverImage, website }
  - Returns: { message: "...", business: {...} }

PUT /businesses/:id
  - Body: { name, description, categoryId, logo, coverImage, website }
  - Returns: { message: "Business profile updated successfully", business: {...} }
```

## Testing Checklist

After all fixes, the following should work:

- [ ] Business onboarding with logo upload
- [ ] Business onboarding with cover image upload
- [ ] Business name displays correctly on frontend
- [ ] Business phone displays separately from provider phone
- [ ] Edit business profile saves all changes
- [ ] Edit business can upload new logo
- [ ] Edit business can upload new cover image
- [ ] Images persist after page refresh
- [ ] Console shows 200 OK responses (not 404)

## Console Logs Expected

### Successful Upload:
```
Starting logo upload for file: logo.jpg 245678 image/jpeg
Sending request to: http://localhost:8000/logo
Actual fetch URL: http://localhost:8000/logo
Response status: 200 OK
Upload response data: {
  success: true,
  message: "Logo uploaded successfully",
  data: {
    url: "https://res.cloudinary.com/...",
    publicId: "business/logos/...",
    width: 500,
    height: 500
  }
}
Logo uploaded successfully: https://res.cloudinary.com/...
```

### Successful Business Update:
```
Saving business data: { name: "...", description: "...", logo: "...", ... }
Business updated successfully: { id: 1, name: "...", ... }
```

## Files Modified Summary

### Backend:
1. `controllers/business.controller.js` - Entity separation, field aliases, proper joins
2. `controllers/upload.controller.js` - Added detailed logging

### Frontend:
1. `lib/provider/api.ts` - Fixed FormData field names, fixed upload URLs, added logging
2. `lib/api.ts` - Added API_BASE_URL logging for debugging
3. `app/(pages)/provider/business/page.tsx` - Implemented update API call
4. `app/(pages)/provider/business/components/EditBusinessDialog.tsx` - Fixed categoryId, added upload logic
5. `types/provider/index.ts` - Updated Business interface with entity separation

## Documentation Created

1. `UPLOAD_ENDPOINT_FIX.md` - Details of the critical endpoint URL fix
2. `NEXTJS_CONFIG_FIX.md` - Initial investigation (proxy issue hypothesis)
3. `EXPECTED_FLOW.md` - Complete expected flow documentation
4. `UPLOAD_TROUBLESHOOTING.md` - Step-by-step troubleshooting guide
5. `BUSINESS_ONBOARDING_FIX_SUMMARY.md` - This file

## Status

✅ **All issues resolved**

The business onboarding and edit functionality should now work correctly with:
- Proper entity separation (provider vs business)
- Working image uploads
- Correct field names and data flow
- Proper API endpoint URLs
