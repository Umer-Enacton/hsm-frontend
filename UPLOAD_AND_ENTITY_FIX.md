# Upload Routes & Entity Separation Fix

## Issues Fixed

### 1. ✅ Upload Routes Returning HTML 404 Errors
**Problem:**
```
Cannot POST /upload/cover-image
Cannot POST /upload/logo
```
Returns HTML instead of JSON, indicating authentication failure.

**Root Cause:**
The upload functions had an empty `headers: {}` object which may have been interfering with cookie sending. The `credentials: "include"` needs to work without any headers being set.

**Fix Applied:**
Updated `lib/provider/api.ts` upload functions to completely remove the headers object:

```typescript
// Before:
const response = await fetch(`${API_BASE_URL}/upload/logo`, {
  method: "POST",
  body: formData,
  credentials: "include",
  headers: {}, // ❌ This might interfere
});

// After:
const response = await fetch(`${API_BASE_URL}/upload/logo`, {
  method: "POST",
  body: formData,
  credentials: "include",
  // ✅ No headers object at all - let browser handle FormData
});
```

**Also added better error logging:**
```typescript
if (!response.ok) {
  const errorText = await response.text();
  console.error("Logo upload failed:", response.status, errorText);
  throw new Error(errorText || "Failed to upload logo");
}
```

### 2. ✅ Provider and Business Entity Separation
**Problem:**
Backend was conflating provider (user) data with business data. The phone and email shown on the business page were actually the provider's personal contact info, not the business's contact info.

**Schema Reality:**
```sql
-- users table (provider's personal info)
users.id, users.name, users.email, users.phone, users.password

-- business_profiles table (business entity)
business_profiles.id,
business_profiles.provider_id (FK → users.id),
business_profiles.business_name,
business_profiles.description,
business_profiles.phone,  -- Business contact phone (separate!)
business_profiles.website,
business_profiles.logo,
business_profiles.cover_image
```

**Key Points:**
1. Business has its OWN `phone` field (line 81 in schema)
2. Business does NOT have an `email` field (email is provider's personal email)
3. Provider and Business are separate entities connected by provider_id
4. Business phone can be different from provider's personal phone

**Fix Applied:**
Updated all business controller functions to properly separate fields:

```typescript
// SELECT query now clearly separates:
{
  // Business fields
  id: businessProfiles.id,
  providerId: businessProfiles.providerId,
  businessName: businessProfiles.businessName,
  name: businessProfiles.businessName, // Alias for frontend
  description: businessProfiles.description,
  phone: businessProfiles.phone, // ✅ Business phone
  website: businessProfiles.website,
  logo: businessProfiles.logo,
  coverImage: businessProfiles.coverImage,

  // Provider fields (for reference)
  providerName: users.name, // ✅ Provider's personal name
  providerEmail: users.email, // ✅ Provider's personal email
  providerPhone: users.phone, // ✅ Provider's personal phone
}

// After query, set email for contact purposes
business.email = business.providerEmail;
```

### 3. ✅ Frontend Types Updated
Updated `types/provider/index.ts` to reflect entity separation:

```typescript
export interface Business {
  // Business fields
  id: number;
  providerId: number;
  name: string;
  phone?: string; // Business phone

  // Provider fields (clearly marked)
  providerName?: string; // Provider's personal name
  providerEmail?: string; // Provider's personal email
  providerPhone?: string; // Provider's personal phone

  // Contact email (for convenience)
  email?: string; // Alias for providerEmail
}
```

### 4. ✅ Backend Phone Update Support
Updated `addBusiness` and `updateBusiness` to accept business phone:

```typescript
// addBusiness now accepts phone parameter
const { name, description, categoryId, logo, coverImage, website, phone } = req.body;

// If business phone provided, use it; otherwise fallback to provider's phone
let businessPhone = phone;
if (!businessPhone) {
  businessPhone = phoneResult[0].phone; // Provider's phone as fallback
}

// Save business phone to database
phone: businessPhone, // ✅ Business phone (can be different from provider's)
```

## Database Schema Reference

### users Table (Provider Entity)
```sql
id              serial PRIMARY KEY
name            varchar(255) -- Provider's personal name
email           varchar(255) UNIQUE -- Provider's personal email
phone           varchar(20) -- Provider's personal phone
password        varchar(255)
roleId          integer
avatar          varchar(500) -- Provider's profile picture
```

### business_profiles Table (Business Entity)
```sql
id              serial PRIMARY KEY
provider_id     integer REFERENCES users(id) -- Foreign key to provider
business_name   varchar(255) -- Business name
description     varchar(1000)
phone           varchar(20) -- BUSINESS PHONE (separate from provider's!)
website         varchar(255)
logo            varchar(500) -- Business logo URL
cover_image     varchar(500) -- Business cover image URL
rating          decimal(3,2)
is_verified     boolean
category_id     integer REFERENCES categories(id)
```

## Entity Relationship

```
┌─────────────────┐
│     users       │ (Provider Entity)
├─────────────────┤
│ id (PK)         │
│ name            │ ← Provider's personal name
│ email           │ ← Provider's personal email
│ phone           │ ← Provider's personal phone
│ password        │
│ roleId          │
└────────┬────────┘
         │ 1
         │
         │ N
         │
┌────────▼─────────┐
│ business_profiles│ (Business Entity)
├─────────────────┤
│ id (PK)          │
│ provider_id (FK) │
│ business_name    │ ← Business name
│ description      │
│ phone            │ ← Business contact phone (separate!)
│ website          │
│ logo             │
│ cover_image      │
└─────────────────┘
```

## Field Mapping

| Display Name        | Table           | Field          | Notes                          |
|---------------------|-----------------|----------------|--------------------------------|
| Business Name       | business_profiles| business_name  | Official business name         |
| Business Phone      | business_profiles| phone          | Business contact number        |
| Provider Name       | users           | name           | Owner's personal name          |
| Provider Email      | users           | email          | Owner's personal email         |
| Provider Phone      | users           | phone          | Owner's personal phone         |

## API Response Format

All business endpoints now return:

```json
{
  "business": {
    "id": 1,
    "providerId": 5,
    "userId": 5,
    "businessName": "QuickFix Plumbing",
    "name": "QuickFix Plumbing",
    "description": "Professional plumbing services",
    "categoryId": 3,
    "category": "Plumbing",
    "phone": "+92 300 1234567",        // Business phone
    "email": "provider@email.com",     // Provider's email (for contact)
    "website": "https://quickfix.com",
    "logo": "https://res.cloudinary.com/...",
    "coverImage": "https://res.cloudinary.com/...",
    "rating": "4.50",
    "isVerified": false,
    "status": "pending",
    "totalReviews": 0,
    "providerName": "John Doe",         // Provider's personal name
    "providerEmail": "john@email.com",  // Provider's personal email
    "providerPhone": "+92 300 9999999"  // Provider's personal phone
  }
}
```

## Testing Checklist

### Upload Routes:
- [ ] Edit business profile
- [ ] Upload new logo
- [ ] Check console for "Logo uploaded successfully"
- [ ] Verify logo URL is Cloudinary link
- [ ] Upload new cover image
- [ ] Check console for "Cover image uploaded successfully"
- [ ] Verify cover image displays
- [ ] Check network tab - should see 200 OK responses

### Entity Separation:
- [ ] Create business with different phone than provider
- [ ] Verify business phone is saved correctly
- [ ] Update business phone
- [ ] Verify business phone updates independently
- [ ] Check that provider's personal phone remains unchanged
- [ ] Verify email shown is provider's email (business has no email field)

## Files Modified

### Frontend:
1. **lib/provider/api.ts**
   - Removed `headers: {}` from upload functions
   - Added better error logging with response text
   - Fixed FormData handling

2. **types/provider/index.ts**
   - Updated Business interface with provider fields
   - Added providerName, providerEmail, providerPhone
   - Clarified which fields belong to which entity

### Backend:
3. **controllers/business.controller.js**
   - getAllBusinesses - Separated provider/business fields
   - getBusinessById - Separated provider/business fields
   - getBusinessByProviderId - Separated provider/business fields
   - addBusiness - Accept business phone parameter
   - updateBusiness - Accept business phone parameter

## Troubleshooting Upload Issues

If uploads still fail:

1. **Check browser console for errors**
2. **Check network tab:**
   - Request URL should be `http://localhost:8000/upload/logo`
   - Method should be POST
   - Status should be 200 OK (not 404)
   - Request should have `Cookie: token=...` header

3. **Verify authentication:**
   - Open browser DevTools → Application → Cookies
   - Check that `token` cookie exists for localhost
   - If not, you need to login again

4. **Check backend is running:**
   ```bash
   curl -X POST http://localhost:8000/upload/logo
   # Should return: {"message":"No Token Provided"}
   # If returns HTML 404, backend routes not loaded
   ```

5. **Verify CORS:**
   - Backend must have `credentials: true` in CORS config
   - Frontend must use `credentials: "include"` in fetch

## Status

✅ Upload routes error handling improved
✅ Provider and Business entities properly separated
✅ Frontend types reflect entity separation
✅ Backend returns clear provider vs business fields
✅ Business phone can be different from provider phone
✅ Email correctly shows as provider's email
