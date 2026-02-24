# Image Upload Troubleshooting - Step by Step

## Current Status
- Upload routes are registered in backend
- Backend is running on port 8000
- Frontend making requests to correct endpoints
- **Issue:** Getting HTML 404 responses instead of JSON

## Step-by-Step Debugging

### Step 1: Verify Backend is Running
```bash
curl http://localhost:8000
# Should return: {"message":"Welcome to HSM Backend API"}
```

**Status:** ✅ Working

### Step 2: Test Upload Endpoint Directly
```bash
curl -X POST http://localhost:8000/upload/logo
# Should return: {"message":"No Token Provided"}
# If returns HTML 404, route not found
```

**Status:** ✅ Returns "No Token Provided" (route exists)

### Step 3: Check Authentication
The upload routes require authentication via JWT cookie.

**Frontend sends:**
```typescript
credentials: "include"  // Should send cookies
```

**Backend expects:**
```javascript
router.post('/logo', auth, logo, uploadController.uploadLogo);
```

**Possible Issues:**
1. Cookie not being sent (CORS issue)
2. Cookie expired
3. Wrong cookie name

### Step 4: Check Browser DevTools

**Network Tab:**
1. Open DevTools → Network
2. Try uploading an image
3. Look for request to `/upload/logo` or `/upload/cover-image`
4. Check:
   - Request URL: Should be `http://localhost:8000/upload/logo`
   - Method: POST
   - Status Code: Should be 200 OK
   - Request Headers: Should have `Cookie: token=...`
   - Request Payload: Should have FormData with logo/coverImage

**If Status is 404:**
- Route not found (check backend routes)

**If Status is 401/403:**
- Authentication failed (check cookie)

**If Status is 500:**
- Server error (check backend console)

### Step 5: Check Application Tab

**DevTools → Application → Cookies:**
1. Check URL: `http://localhost:8000`
2. Look for cookie named `token`
3. If missing, need to login again

### Step 6: Check Backend Console

Backend should now log:
```
Logo upload request received
File: Found/Not found
Body: {...}
Uploading logo to Cloudinary...
Logo uploaded to Cloudinary: {...}
```

If you see "No file in request", multer didn't process the file.

### Step 7: Check CORS Configuration

**Backend index.js should have:**
```javascript
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,  // IMPORTANT: Allow cookies
  }),
);
```

**Frontend should have:**
```typescript
credentials: "include"  // IMPORTANT: Send cookies
```

## Common Issues & Solutions

### Issue 1: HTML 404 Response
**Cause:** Backend not running or route not registered

**Solution:**
1. Check backend is running: `node index.js`
2. Check console for errors
3. Verify upload routes are in `index.js`

### Issue 2: "No Token Provided"
**Cause:** Cookie not being sent

**Solution:**
1. Check browser has token cookie
2. Check CORS has `credentials: true`
3. Check fetch has `credentials: "include"`

### Issue 3: "No file uploaded"
**Cause:** Multer not processing file

**Solution:**
1. Check Content-Type header (should NOT be set for FormData)
2. Check field name matches multer config
   - Frontend: `formData.append("logo", file)`
   - Backend: `logo: upload.single("logo")`
3. Check file size (max 2MB for logo, 5MB for cover)

### Issue 4: Cloudinary Error
**Cause:** Cloudinary credentials wrong

**Solution:**
1. Check `.env` file has correct Cloudinary config
2. Check Cloudinary account is active
3. Check cloud name is correct

## Testing Procedure

### 1. Test Auth is Working
```bash
# Login first to get token
curl -X POST http://localhost:8000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password"}' \
  -c cookies.txt

# Try upload with cookie
curl -X POST http://localhost:8000/upload/logo \
  -F "logo=@/path/to/image.jpg" \
  -b cookies.txt
```

### 2. Test from Frontend
1. Open browser DevTools (F12)
2. Go to Console tab
3. Navigate to `/provider/business`
4. Click "Edit Profile"
5. Upload a logo
6. Check console for logs:
   ```
   Starting logo upload for file: logo.jpg 12345 image/jpeg
   Sending request to: http://localhost:8000/upload/logo
   Response status: 200 OK
   Upload response data: {success: true, data: {url: "..."}}
   Logo uploaded successfully: https://res.cloudinary.com/...
   ```

### 3. Check Backend Console
Should see:
```
Logo upload request received
File: Found
Body: { logo: [File] }
Uploading logo to Cloudinary...
Logo uploaded to Cloudinary: { url: '...', publicId: '...' }
```

## Current Logging Added

### Frontend (`lib/provider/api.ts`):
```typescript
console.log("Starting logo upload for file:", file.name, file.size, file.type);
console.log("Sending request to:", `${API_BASE_URL}/upload/logo`);
console.log("Response status:", response.status, response.statusText);
console.log("Upload response data:", data);
```

### Backend (`controllers/upload.controller.js`):
```javascript
console.log('Logo upload request received');
console.log('File:', req.file ? 'Found' : 'Not found');
console.log('Body:', req.body);
console.log('Uploading logo to Cloudinary...');
console.log('Logo uploaded to Cloudinary:', result);
```

## What to Check Now

### If Still Getting HTML 404:
1. **Check frontend API_BASE_URL:**
   ```typescript
   console.log("API_BASE_URL:", process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000");
   ```

2. **Check actual request URL in Network tab:**
   - Should be `http://localhost:8000/upload/logo`
   - NOT `http://localhost:8000/api/upload/logo`

3. **Check backend routes:**
   ```bash
   cd ../home-service-management-backend
   cat routes/upload.route.js
   ```

4. **Check route registration in index.js:**
   ```bash
   cat index.js | grep upload
   ```

### If Getting 401 Unauthorized:
1. **Check cookie exists:**
   - DevTools → Application → Cookies
   - Look for `token` cookie for `localhost:8000`

2. **Check cookie is being sent:**
   - Network tab → Request Headers
   - Look for `Cookie: token=...`

3. **Login again:**
   - Cookie might be expired
   - Logout and login again

## Files Modified

### Frontend:
1. `lib/provider/api.ts` - Added detailed logging
2. `app/(pages)/provider/business/components/EditBusinessDialog.tsx` - Upload logic
3. `app/(pages)/provider/business/page.tsx` - Update API call

### Backend:
1. `controllers/upload.controller.js` - Added detailed logging
2. `controllers/business.controller.js` - Entity separation
3. `models/schema.js` - No changes needed

## Next Steps

1. **Check browser console** for the detailed logs we added
2. **Check network tab** for actual request/response
3. **Check backend console** for upload logs
4. **Report back** with:
   - Console logs
   - Network tab screenshots
   - Backend console logs
   - Exact error messages

This will help identify exactly where the flow is breaking.
