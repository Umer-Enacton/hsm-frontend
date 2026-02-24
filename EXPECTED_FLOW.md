# EXPECTED FLOW - Image Upload & Business Edit

## Complete User Flow

### 1. User Edits Business Profile
```
User navigates to: /provider/business
  ↓
User clicks: "Edit Profile" button
  ↓
EditBusinessDialog opens
  ↓
User sees: Basic Info tab (default)
  ↓
User fills out form (name, description, category)
  ↓
Validation passes → "Images" tab becomes enabled
  ↓
User clicks "Images" tab
  ↓
User sees: Logo and Cover Image upload controls
  ↓
User selects new logo file
  ↓
ImageUpload component shows preview
  ↓
User clicks "Save Changes" button
```

### 2. Frontend Processing (EditBusinessDialog.tsx)
```typescript
handleSave() is called
  ↓
validate() checks form is valid
  ↓
setIsUploading(true) → Button shows "Uploading Images..."
  ↓
Check if logo is a File object (user selected new file)
  ↓
IF YES:
  await uploadBusinessLogo(formData.logo)
    ↓
    lib/provider/api.ts uploadBusinessLogo()
      ↓
      Create FormData: formData.append("logo", file)
      ↓
      fetch("http://localhost:8000/upload/logo", {
        method: "POST",
        body: formData,
        credentials: "include"  // Sends auth cookie
      })
      ↓
      Backend receives request
        ↓
        Multer processes file → req.file
        ↓
        Upload to Cloudinary → Get URL
        ↓
        Return JSON: { success: true, data: { url: "..." } }
      ↓
    Frontend receives response
      ↓
    return { url: data.data.url }
  ↓
logoUrl = logoResult.url  // Cloudinary URL
  ↓
Same process for coverImage if selected
  ↓
onSave({
  ...formData,        // All form fields
  logo: logoUrl,      // Cloudinary URL or existing
  coverImage: coverImageUrl  // Cloudinary URL or existing
})
```

### 3. Business Page Processing (page.tsx)
```typescript
handleEditSave(updatedData)
  ↓
Call updateBusiness(business.id, {
  name: updatedData.name,
  description: updatedData.description,
  categoryId: updatedData.categoryId,
  logo: updatedData.logo,          // Cloudinary URL
  coverImage: updatedData.coverImage,  // Cloudinary URL
  website: updatedData.website
})
  ↓
lib/provider/api.ts updateBusiness()
  ↓
  api.put(`/businesses/${businessId}`, businessData)
    ↓
    fetch("http://localhost:8000/businesses/1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(businessData)
    })
    ↓
    Backend receives request
      ↓
      business.controller.js updateBusiness()
        ↓
        Update database with new data
        ↓
        Fetch complete business with joins
        ↓
        Return JSON: {
          message: "Business profile updated successfully",
          business: { ... }
        }
      ↓
    Frontend receives response
      ↓
  return response.business
  ↓
setBusiness(updatedBusiness)  // Update local state
  ↓
setIsEditDialogOpen(false)  // Close dialog
  ↓
alert("Business profile updated successfully!")
```

## Expected Console Logs

### Frontend Console (Browser DevTools):
```
Starting logo upload for file: logo.jpg 245678 image/jpeg
Sending request to: http://localhost:8000/upload/logo
Response status: 200 OK
Upload response data: {
  success: true,
  message: "Logo uploaded successfully",
  data: {
    url: "https://res.cloudinary.com/dzj8ztyiv/image/upload/...",
    publicId: "business/logos/...",
    width: 500,
    height: 500
  }
}
Logo uploaded successfully: https://res.cloudinary.com/...
Saving business data: { name: "...", description: "...", logo: "...", ... }
Business updated successfully: { ... }
```

### Backend Console:
```
Logo upload request received
File: Found
Body: { logo: [File] }
Uploading logo to Cloudinary...
Logo uploaded to Cloudinary: {
  url: 'https://res.cloudinary.com/...',
  publicId: 'business/logos/abc123'
}
PUT /businesses/1 - Update business request
Updating business fields: { businessName: "...", logo: "...", ... }
Business updated successfully
```

## Expected Network Requests

### 1. Upload Logo
```
Request URL: http://localhost:8000/upload/logo
Method: POST
Status Code: 200 OK
Request Headers:
  Cookie: token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...
Request Payload:
  ------WebKitFormBoundary...
  Content-Disposition: form-data; name="logo"; filename="logo.jpg"
  Content-Type: image/jpeg

  [binary data]
  ------WebKitFormBoundary...--
Response:
{
  "success": true,
  "message": "Logo uploaded successfully",
  "data": {
    "url": "https://res.cloudinary.com/dzj8ztyiv/image/upload/v1/...",
    "publicId": "business/logos/abc123",
    "width": 500,
    "height": 500
  }
}
```

### 2. Update Business
```
Request URL: http://localhost:8000/businesses/1
Method: PUT
Status Code: 200 OK
Request Headers:
  Cookie: token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  Content-Type: application/json
Request Payload:
{
  "name": "QuickFix Plumbing",
  "description": "Professional plumbing services",
  "categoryId": 3,
  "logo": "https://res.cloudinary.com/dzj8ztyiv/image/upload/v1/...",
  "coverImage": "https://res.cloudinary.com/dzj8ztyiv/image/upload/v1/...",
  "website": "https://quickfix.com"
}
Response:
{
  "message": "Business profile updated successfully",
  "business": {
    "id": 1,
    "name": "QuickFix Plumbing",
    "phone": "+92 300 1234567",
    "logo": "https://res.cloudinary.com/dzj8ztyiv/image/upload/v1/...",
    "coverImage": "https://res.cloudinary.com/dzj8ztyiv/image/upload/v1/...",
    ...
  }
}
```

## What's NOT Working Currently

Based on your error "Cannot POST /upload/cover-image" (HTML response):

### Possible Issue #1: Frontend API_URL is wrong
```typescript
// Check what this actually is
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
```

**Should be:** `http://localhost:8000`
**Might be:** `http://localhost:8000/api` (WRONG - no /api prefix!)

### Possible Issue #2: Backend not receiving requests
- Backend might not be running
- Port might be different
- Routes not registered

### Possible Issue #3: Cookie not sent
- User not logged in
- Cookie expired
- CORS misconfiguration

## Debug Steps for You

1. **Open Browser DevTools (F12)**

2. **Go to Console Tab**
   - Look for our detailed logs
   - What do you see?

3. **Go to Network Tab**
   - Filter by "upload" or "logo"
   - Try uploading an image
   - What is the Request URL?
   - What is the Status Code?
   - What are the Request Headers?
   - Is there a Cookie header?

4. **Go to Application Tab → Cookies**
   - Select `http://localhost:8000`
   - Is there a `token` cookie?
   - What is its value?

5. **Check Backend Console**
   - Are the logs appearing?
   - What errors do you see?

6. **Report Back:**
   - Frontend console logs (copy/paste)
   - Network tab screenshot
   - Backend console logs
   - Exact error message

This will help pinpoint exactly where it's failing!
