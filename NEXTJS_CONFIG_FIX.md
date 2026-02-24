# Next.js Proxy Issue - Root Cause Found

## Problem Analysis

From the console logs:
```
api.ts:76 Sending request to: http://localhost:8000/upload/logo
api.ts:78  POST http://localhost:8000/upload/logo 404 (Not Found)
```

The URL looks correct (`http://localhost:8000/upload/logo`), BUT:

1. **curl to backend works:** Returns `{"message":"No Token Provided"}`
2. **Browser gets HTML 404:** Returns `Cannot POST /upload/logo`

This means the browser request is **NOT actually reaching the backend**!

## Root Cause

**Next.js Development Server Proxy Issue:**

When you're in development mode, Next.js dev server runs on port 3000. When the frontend code makes a fetch request to `http://localhost:8000`, the browser might be:

1. **Going through Next.js proxy** (if there's a rewrite rule)
2. **Getting blocked by CORS**
3. **Actually hitting localhost:3000 instead of localhost:8000**

## Solutions

### Solution 1: Add Next.js Rewrite (RECOMMENDED)

Create `next.config.ts`:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/:path*',
      },
      {
        source: '/upload/:path*',
        destination: 'http://localhost:8000/upload/:path*',
      },
    ]
  },
};

export default nextConfig;
```

Then update frontend to use relative URLs:
```typescript
// Change API_BASE_URL to use relative path or proxy
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
// OR use '/api' prefix for API calls
```

### Solution 2: Fix CORS on Backend (Current Setup)

Backend already has CORS configured:
```javascript
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);
```

This should work, but something is blocking it.

### Solution 3: Check Browser Request

**In your browser DevTools (F12) → Network tab:**

1. Clear all filters
2. Try uploading an image
3. Find the request to `/upload/logo`
4. Click on it
5. Check the **Headers** tab:
   - What is the **Request URL**?
   - Is it `http://localhost:8000/upload/logo` or `http://localhost:3000/upload/logo`?
   - Is there a **Cookie** header?

**The URL will tell us what's wrong:**
- If URL is `localhost:3000/...` → Next.js proxy issue
- If URL is `localhost:8000/...` → CORS issue

### Solution 4: Use Relative Paths (Temporary Fix)

Update `lib/provider/api.ts`:

```typescript
// For uploads, use window.location to ensure we hit the right server
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.protocol + '//' + window.location.hostname + ':8000';
  }
  return 'http://localhost:8000';
};

export async function uploadBusinessLogo(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("logo", file);

  const response = await fetch(`${getBaseUrl()}/upload/logo`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });
  // ... rest of code
}
```

## What to Check Now

**In Browser DevTools Network Tab:**

Look at the actual request URL when you try to upload. It will show one of:

1. `http://localhost:3000/upload/logo` → Next.js is intercepting (use Solution 1)
2. `http://localhost:8000/upload/logo` → Request is reaching backend but being blocked (CORS issue)
3. Something else entirely

## Quick Test

Open browser console and run:
```javascript
fetch('http://localhost:8000/upload/logo', {
  method: 'POST',
  credentials: 'include'
}).then(r => r.text()).then(console.log)
```

This will tell us if the browser can reach the backend directly.

## Most Likely Fix

Based on the logs, I believe the issue is **Next.js proxying**. The frontend code says `http://localhost:8000` but the browser is actually hitting `localhost:3000`.

**Try this fix now:**

Add to `lib/provider/api.ts`:

```typescript
// Force direct requests to backend, bypassing any proxy
const DIRECT_BACKEND_URL = 'http://localhost:8000';

export async function uploadBusinessLogo(file: File): Promise<{ url: string }> {
  console.log("Starting logo upload for file:", file.name, file.size, file.type);
  console.log("Backend URL:", DIRECT_BACKEND_URL);

  const formData = new FormData();
  formData.append("logo", file);

  const response = await fetch(`${DIRECT_BACKEND_URL}/upload/logo`, {
    method: "POST",
    body: formData,
    credentials: "include",
    mode: 'cors', // Explicitly set CORS mode
  });

  console.log("Response status:", response.status, response.statusText);
  // ... rest
}
```

Let me know what the Network tab shows for the Request URL!
