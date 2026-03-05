# Business Phone & Edit Update - Fixed

## Issues Found & Fixed

### Issue 1: Business Phone Not Being Saved During Onboarding ✅
**Problem:** The onboarding form collected phone number but wasn't sending it to the backend API.

**Root Cause:** In `lib/provider/api.ts`, the `completeOnboarding` function had this code:
```typescript
const businessData = {
  name: onboardingData.businessProfile.name,
  description: onboardingData.businessProfile.description,
  categoryId: onboardingData.businessProfile.categoryId,
  logo: logoUrl,
  coverImage: coverImageUrl,
  website: onboardingData.businessProfile.website,
  // Note: phone is pulled from user profile by backend  ❌ WRONG!
};
```

**Fix:** Now sends the phone field:
```typescript
const businessData = {
  name: onboardingData.businessProfile.name,
  description: onboardingData.businessProfile.description,
  categoryId: onboardingData.businessProfile.categoryId,
  phone: onboardingData.businessProfile.phone, // ✅ Send business phone
  logo: logoUrl,
  coverImage: coverImageUrl,
  website: onboardingData.businessProfile.website,
};
```

### Issue 2: Edit Business Not Saving Phone ✅
**Problem:** When editing business profile, changes to phone number weren't being saved.

**Root Cause:** In `page.tsx`, the `handleEditSave` function wasn't including phone in the update:
```typescript
const updatedBusiness = await updateBusiness(business.id, {
  name: updatedData.name,
  description: updatedData.description,
  categoryId: updatedData.categoryId,
  logo: updatedData.logo,
  coverImage: updatedData.coverImage,
  website: updatedData.website,
  // ❌ Missing phone field!
});
```

**Fix:** Added phone field to update:
```typescript
const updatedBusiness = await updateBusiness(business.id, {
  name: updatedData.name,
  description: updatedData.description,
  categoryId: updatedData.categoryId,
  phone: updatedData.phone, // ✅ Include business phone
  logo: updatedData.logo,
  coverImage: updatedData.coverImage,
  website: updatedData.website,
});
```

## Backend Schema Clarification

### business_profiles Table Fields:
```javascript
{
  id: serial,
  providerId: integer,           // FK to users table
  categoryId: integer,            // FK to categories table
  businessName: varchar(255),     // Business name
  description: varchar(1000),     // Business description
  phone: varchar(20),             // ✅ BUSINESS PHONE (separate from provider's)
  website: varchar(255),          // Business website
  logo: varchar(500),             // Cloudinary URL
  coverImage: varchar(500),       // Cloudinary URL
  rating: decimal,
  isVerified: boolean,
  createdAt: timestamp
}
```

### What's NOT in business_profiles:
- ❌ `email` - Comes from `users` table (provider's email)
- ❌ `address` - Not in current schema

### Backend Fallback Logic:
The backend's `addBusiness` function has a fallback:
```javascript
// Use business phone if provided, otherwise use provider's phone as fallback
let businessPhone = phone;
if (!businessPhone) {
  const phoneResult = await db
    .select({ phone: users.phone })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  businessPhone = phoneResult[0].phone;
}
```

This means if you don't send a phone during onboarding, it uses provider's phone. But we want to send the business phone explicitly!

## Data Flow

### Onboarding (Now Fixed):
```
User fills Stage1 form
  ├─ name: "QuickFix Plumbing"
  ├─ phone: "+92 300 9999999"  (Business phone)
  ├─ email: "contact@quickfix.com" (Collected but not saved to business table)
  └─ address: "123 Main St" (Collected but not in schema)
  ↓
completeOnboarding() called
  ↓
 Sends to backend:
 {
   name: "QuickFix Plumbing",
   phone: "+92 300 9999999",  ✅ NOW INCLUDED!
   description: "...",
   categoryId: 3,
   logo: "https://...",
   website: "https://..."
 }
  ↓
Backend saves to business_profiles:
  phone: "+92 300 9999999"  ✅ Business phone saved!
```

### Edit Business (Now Fixed):
```
User clicks "Edit Profile"
  ↓
Dialog opens with current data
  ↓
User changes phone: "+92 300 8888888"
  ↓
Clicks "Save Changes"
  ↓
handleEditSave() sends:
 {
   name: "QuickFix Plumbing",
   phone: "+92 300 8888888",  ✅ NOW INCLUDED!
   description: "...",
   ...
 }
  ↓
Backend updates business_profiles:
  phone: "+92 300 8888888"  ✅ Updated!
```

## Frontend Display (Already Fixed)

BusinessProfileCard shows:
```
Contact Information:
📞 +92 300 9999999 (Business)    <- From business_profiles.phone
🌐 www.quickfix.com              <- From business_profiles.website
✉️ vikram.provider@gmail.com (Provider)  <- From users.email
📞 +92 300 1234567 (Provider)    <- From users.phone
```

## Important Notes

### Email & Address Fields:
The onboarding form asks for email and address (they're required), but:
- **Email** is NOT saved to business table - it's only used for validation/display
- **Address** is NOT in the schema at all

This is confusing! The form should either:
1. Not ask for email/address, OR
2. Save them to the business table (schema migration needed)

For now, the form still asks for them (for validation), but they're not saved.

### Provider vs Business Phone:
- **Provider Phone** (users.phone): Personal contact for the service provider
- **Business Phone** (business_profiles.phone): Official business contact number
- These can be DIFFERENT numbers!

## Files Modified

1. **lib/provider/api.ts**
   - Added `phone` field to businessData in `completeOnboarding()`
   - Removed misleading comments about backend pulling phone

2. **app/(pages)/provider/business/page.tsx**
   - Added `phone` field to `updateBusiness()` call in `handleEditSave()`

## Testing Checklist

- [ ] Complete onboarding with different business phone
- [ ] Verify business phone is saved (not provider phone)
- [ ] Edit business and change phone number
- [ ] Verify phone number updates successfully
- [ ] Check business page shows correct business phone
- [ ] Check provider phone is shown separately with "(Provider)" label

## Console Logs Expected

### Onboarding:
```
Starting onboarding completion...
Creating business profile...
Sending business data: {
  name: "QuickFix Plumbing",
  phone: "+92 300 9999999",  ✅
  description: "...",
  categoryId: 3,
  logo: "https://...",
  website: "https://..."
}
Business created: { id: 1, phone: "+92 300 9999999", ... }  ✅
```

### Edit Business:
```
Saving business data: { name: "...", phone: "+92 300 8888888", ... }
Business updated successfully: { id: 1, phone: "+92 300 8888888", ... }  ✅
```

## Status

✅ **All issues resolved**

- Business phone is now saved during onboarding
- Edit business now saves phone number changes
- Business and provider phones are properly separated
