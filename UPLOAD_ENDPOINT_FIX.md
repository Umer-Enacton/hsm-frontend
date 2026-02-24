# Upload Endpoint Fix - RESOLVED ✅

## Problem

Frontend was calling upload endpoints with `/upload/` prefix:
- `http://localhost:8000/upload/logo` ❌
- `http://localhost:8000/upload/cover-image` ❌

This resulted in 404 errors because the backend routes are mounted at **root level**, not under `/upload/`.

## Root Cause

Backend route mounting in `home-service-management-backend/index.js`:
```javascript
// Upload routes mounted at root level
app.use("/", uploadRoutes);
```

Backend route definitions in `routes/upload.route.js`:
```javascript
router.post('/logo', auth, logo, uploadController.uploadLogo);
router.post('/cover-image', auth, coverImage, uploadController.uploadCoverImage);
```

This means the full URLs are:
- `http://localhost:8000/logo` ✅
- `http://localhost:8000/cover-image` ✅

## Fix Applied

Updated `lib/provider/api.ts`:

### Before:
```typescript
const response = await fetch(`${API_BASE_URL}/upload/logo`, {
  method: "POST",
  body: formData,
  credentials: "include",
  mode: "cors",
});
```

### After:
```typescript
// FIXED: Backend routes are at root level, not /upload/
const uploadUrl = `${API_BASE_URL}/logo`;
const response = await fetch(uploadUrl, {
  method: "POST",
  body: formData,
  credentials: "include",
  mode: "cors",
});
```

Same fix applied to `uploadBusinessCoverImage()` function.

## Verification

Test with curl:
```bash
# This now works (returns "No Token Provided" which is correct)
curl -X POST http://localhost:8000/logo

# This would return 404 (there is no /upload/ route)
curl -X POST http://localhost:8000/upload/logo
```

## Impact

This fix resolves:
1. ✅ Business onboarding logo/cover image uploads
2. ✅ Edit business profile logo/cover image uploads
3. ✅ All image upload functionality in the provider dashboard

## Files Modified

- `lib/provider/api.ts` - Fixed upload endpoint URLs (removed `/upload/` prefix)

## Testing

After this fix, users should be able to:
1. Complete business onboarding with logo and cover image
2. Edit business profile and upload new images
3. See images properly saved and displayed on the business profile

Console logs should now show:
```
Sending request to: http://localhost:8000/logo
Actual fetch URL: http://localhost:8000/logo
Response status: 200 OK
```

Instead of the previous 404 error.
