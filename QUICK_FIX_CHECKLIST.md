# Quick Fix Checklist for Login Issues

## 🔴 Immediate Issues to Fix

### Issue 1: Login redirects to `/` instead of `/admin/dashboard`

**Most Likely Cause:** JWT token doesn't have `roleId` field or has different field name

**Solution:**
1. After login, go to `/debug-auth` in your browser
2. Check the "Parsed Token" section
3. Look for `roleId` or `role_id`
4. If missing, backend needs to include it in JWT

**Backend Code Check:**
```javascript
// In your backend login route
const token = jwt.sign(
  {
    id: user.id,
    email: user.email,
    roleId: user.role_id,  // ← MUST INCLUDE THIS
    name: user.name        // Optional
  },
  process.env.JWT_SECRET
);
```

### Issue 2: Admin dashboard shows infinite loading

**Most Likely Cause:** Token not being read correctly or role check failing

**Solution:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for red error messages
4. Check what logs appear

**Expected Logs:**
```
User data from token: {id: 1, email: "admin@...", roleId: 3, ...}
```

**If you see errors or null values:**
- Token not being parsed correctly
- Token doesn't have required fields
- Token is expired

## ✅ Step-by-Step Debugging

### Step 1: Verify Backend is Setting Cookie

1. Login with your admin account
2. Open DevTools → Application → Cookies
3. Look for `token` cookie
4. **Expected:** Should see cookie with httpOnly checked

**If no cookie:** Backend not setting it correctly

### Step 2: Visit Debug Page

After login, navigate to: `http://localhost:3001/debug-auth`

**Look for:**
- **Is Authenticated:** `true`
- **Parsed Token:** Should have `roleId: 3`
- **User Data:** Should have user info

**Take a screenshot of this page!**

### Step 3: Check Middleware Logs

Look at the terminal where you ran `npm run dev`

**Should see:**
```
[Middleware] Path: /admin/dashboard
[Middleware] Token exists: true
[Middleware] User Role: 3
```

**If different:** Issue with token or parsing

### Step 4: Test with Manual Token

In browser console (after logging in):

```javascript
// Get token from cookie
const token = document.cookie.match(/token=([^;]+)/)?.[1];

// Decode it
const payload = JSON.parse(atob(token.split('.')[1]));

// Check what's inside
console.log(payload);
```

**Expected output:**
```javascript
{
  id: 1,
  email: "admin@example.com",
  roleId: 3,  // ← This MUST exist and be 3 for admin
  name: "Admin User",
  iat: 1234567890,
  exp: 1234567890
}
```

## 🛠️ Common Backend Issues

### Issue: Using `role_id` instead of `roleId`

**Backend might have:**
```javascript
{
  role_id: 3,  // Snake case
  ...
}
```

**Frontend expects:**
```javascript
{
  roleId: 3,  // Camel case
  ...
}
```

**Fix - Backend:**
```javascript
const tokenPayload = {
  id: user.id,
  email: user.email,
  roleId: user.role_id,  // Use camelCase in JWT
  name: user.name
};
```

**OR Fix - Frontend (if backend can't change):**
```typescript
// In lib/auth-utils.ts
export function parseToken(token: string): TokenPayload | null {
  const payload = JSON.parse(...);
  return {
    ...payload,
    roleId: payload.roleId || payload.role_id,
  };
}
```

### Issue: Not including roleId in JWT at all

**Backend might only have:**
```javascript
{
  id: 1,
  email: "admin@hsm.com"
}
```

**Fix - Add roleId:**
```javascript
const token = jwt.sign(
  {
    id: user.id,
    email: user.email,
    roleId: user.role_id,  // ← ADD THIS
    name: user.name
  },
  process.env.JWT_SECRET
);
```

## 🚪 Temporary Bypass (For Testing)

To verify the admin layout works, temporarily bypass auth:

**In `app/(pages)/admin/layout.tsx`:**

```typescript
useEffect(() => {
  // TEMPORARY: Bypass auth for testing
  setUser({
    name: "Test Admin",
    email: "admin@test.com",
    role: "Administrator",
  });
  setIsLoading(false);

  /* ORIGINAL CODE (commented out for testing)
  const userData = getUserData();
  if (!userData) {
    router.push("/login");
    return;
  }
  if (userData.roleId !== UserRole.ADMIN) {
    router.push("/unauthorized");
    return;
  }
  setUser({...});
  setIsLoading(false);
  */
}, [router]);
```

This will let you see if the layout itself works.

## 📋 What to Report If Still Broken

If after all this it still doesn't work, provide:

1. **Screenshot of `/debug-auth` page**
2. **Browser console errors** (screenshot)
3. **Decoded JWT token** (from Step 4 above)
4. **Backend login route code** (the part that creates the JWT)
5. **Middleware logs** (from terminal)

## 🎯 Most Likely Fixes (In Order)

1. **Backend JWT missing `roleId`** → Add it to token payload
2. **Backend using `role_id` (snake_case)** → Change to `roleId` or update frontend
3. **Cookie not being set** → Check CORS and backend cookie settings
4. **Token expired** → Check `exp` in JWT, increase expiration
5. **Parsing error** → Check if token is valid JWT format

## 🔧 Files That Were Updated

All these files have improved error handling and logging:

- `lib/auth-utils.ts` - Better token parsing, handles both base64/base64url
- `app/(pages)/admin/layout.tsx` - Added detailed logging, error handling
- `middleware.ts` - Added debug logging for development
- `app/(auth)/login/page.tsx` - Uses response data directly for redirect
- `app/debug-auth/page.tsx` - NEW: Debug page to see auth state
