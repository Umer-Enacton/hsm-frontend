# Authentication Troubleshooting Guide

## Issues You're Experiencing

1. **Login redirects to `/` instead of `/admin/dashboard`**
2. **Manually going to `/admin/dashboard` shows infinite loading**

## Debug Steps

### Step 1: Check Token Structure

After logging in, visit **`/debug-auth`** to see:
- What's in your JWT token
- How it's being parsed
- What data is available

**What to look for:**
- `roleId` should be `3` for admin
- Check if `name` field exists (might not be in JWT)
- Verify `exp` (expiration) is in the future

### Step 2: Check Backend JWT Structure

Your backend JWT should include these fields:

```json
{
  "id": 1,
  "email": "admin@hsm.com",
  "roleId": 3,
  "name": "Admin User",  // Optional
  "iat": 1234567890,
  "exp": 1234567890
}
```

**Check your backend login route to verify the JWT payload:**

```javascript
// Backend - check what's in the token
const token = jwt.sign(
  {
    id: user.id,
    email: user.email,
    roleId: user.role_id,  // Make sure this matches!
    name: user.name        // Optional: add if needed
  },
  JWT_SECRET,
  { expiresIn: "7d" }
);
```

### Step 3: Common Issues & Solutions

#### Issue 1: Role ID Mismatch

**Problem:** Backend uses `role_id` but frontend expects `roleId`

**Backend Fix:**
```javascript
const token = jwt.sign(
  {
    id: user.id,
    email: user.email,
    roleId: user.role_id,  // Use camelCase
    // OR
    ...user,  // Spread entire user object
  },
  JWT_SECRET
);
```

**Frontend Fix (if backend can't be changed):**
```typescript
// In lib/auth-utils.ts, update parseToken:
export function parseToken(token: string): TokenPayload | null {
  const payload = JSON.parse(...);
  // Handle snake_case from backend
  return {
    ...payload,
    roleId: payload.roleId || payload.role_id,
  };
}
```

#### Issue 2: Token Not in Cookie

**Problem:** Backend not setting cookie properly

**Check:** Browser DevTools → Application → Cookies

**Should see:**
```
Name: token
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
HttpOnly: ✓ (checked)
```

**Backend Fix:**
```javascript
res.cookie("token", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});
```

#### Issue 3: CORS Issues

**Problem:** Cookie not being set due to CORS

**Backend Fix:**
```javascript
// CORS configuration
app.use(cors({
  origin: "http://localhost:3001",  // Your frontend URL
  credentials: true,  // Important!
}));
```

#### Issue 4: Infinite Loading on Admin Dashboard

**Problem:** Admin layout stuck in loading state

**Debug:**
1. Open browser console
2. Look for error messages
3. Check if `getUserData()` returns null

**Quick Fix:**
Add console logging in admin layout (already added in latest version):
```typescript
console.log("User data from token:", userData);
console.log("User role:", userData?.roleId);
```

### Step 4: Test Token Parsing Manually

1. **Get your token** from browser DevTools:
   - Application → Cookies → token (copy value)

2. **Decode it** at https://jwt.io or use Node.js:
   ```bash
   node -e "console.log(JSON.parse(Buffer.from('YOUR_TOKEN_PAYLOAD', 'base64url').toString()))"
   ```

3. **Verify the structure** matches what frontend expects

### Step 5: Check Middleware Logs

With the latest middleware update, you'll see console logs in development:

```bash
# In your terminal where Next.js is running
[Middleware] Path: /admin/dashboard
[Middleware] Token exists: true
[Middleware] User Role: 3
```

**What to look for:**
- Is `Token exists: true`? If not, cookie isn't being sent
- Is `User Role: 3`? If not, token parsing is failing
- Any error messages?

## Quick Fixes to Try

### Fix 1: Disable Middleware Temporarily

Comment out the middleware matcher to rule out middleware issues:

```typescript
// middleware.ts
export const config = {
  matcher: [],
  // Comment out the real matcher for testing
};
```

### Fix 2: Bypass Auth Checks Temporarily

In admin layout, comment out auth checks:

```typescript
useEffect(() => {
  // Temporarily bypass auth
  setUser({
    name: "Test Admin",
    email: "admin@test.com",
    role: "Administrator",
  });
  setIsLoading(false);
}, []);
```

### Fix 3: Use localStorage Instead of Cookie

Update login to store in localStorage regardless:

```typescript
// After successful login
localStorage.setItem("token", data.token);
localStorage.setItem("user", JSON.stringify(data.user));
```

## Checklist

- [ ] Backend sets `token` cookie with httpOnly
- [ ] JWT includes `roleId` field (value 1, 2, or 3)
- [ ] Frontend can parse JWT (check `/debug-auth`)
- [ ] CORS credentials enabled on backend
- [ ] Cookie visible in browser DevTools
- [ ] Middleware console logs show correct role
- [ ] No console errors in browser

## Still Having Issues?

### Gather This Information:

1. **Backend JWT payload** (decoded token)
2. **Browser console errors** (screenshot)
3. **Middleware logs** (from terminal)
4. **Debug auth page output** (visit `/debug-auth`)

### Test with a Known Good Token:

```javascript
// In browser console, test token parsing manually
const token = document.cookie.match(/token=([^;]+)/)?.[1];
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log("Token payload:", payload);
}
```

### Contact Information:

Include the above information when reporting issues.
