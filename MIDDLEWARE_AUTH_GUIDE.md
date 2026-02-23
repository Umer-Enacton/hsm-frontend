# Authentication & Middleware Guide

This document explains the authentication system and middleware implementation for the HSM Frontend application.

## Overview

The application uses a **JWT-based authentication system** with role-based access control (RBAC) that mirrors the backend middleware implementation.

### Key Components

1. **Middleware** (`middleware.ts`) - Server-side route protection
2. **Auth Utilities** (`lib/auth-utils.ts`) - Client-side auth helpers
3. **Token Storage** - localStorage/sessionStorage for tokens
4. **Role-Based Routes** - Protected routes for Admin, Provider, and Customer

## Backend Integration

The frontend authentication is designed to work with the backend middleware:

### Backend Auth Middleware
```javascript
// Backend checks token from cookies
const token = req.cookies.token;
const user = jwt.verify(token, JWT_SECRET);

// Role authorization
const authorizeRole = (...allowedRoleIds) => {
  return (req, res, next) => {
    if (!allowedRoleIds.includes(req.token.roleId)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};
```

### Frontend Alignment
- **Token Format**: JWT with `roleId` in payload
- **Roles**: CUSTOMER=1, PROVIDER=2, ADMIN=3
- **Cookie Name**: `token` (httpOnly)

## Middleware Configuration

### Protected Routes

The middleware protects these routes based on user roles:

| Route Group | Paths | Required Role |
|-------------|-------|---------------|
| Admin | `/admin/dashboard`, `/admin/users` | ADMIN (3) |
| Provider | `/provider/dashboard` | PROVIDER (2) |
| Customer | `/customer/home`, `/customer/bookings` | CUSTOMER (1) |

### Route Behavior

#### Unauthenticated Users
- **Protected Routes** → Redirect to `/login?redirect=<original_path>`
- **Auth Pages** → Allow access
- **Public Pages** → Allow access

#### Authenticated Users
- **Auth Pages** (`/login`, `/register`, `/forgot-password`) → Redirect to role-based dashboard
- **Authorized Routes** → Allow access
- **Unauthorized Routes** → Redirect to appropriate dashboard for their role

## Auth Utilities

### Client-Side Functions

```typescript
// Check if user is authenticated
isAuthenticated(): boolean

// Get user role from token
getUserRole(): UserRole | null

// Parse JWT token
parseToken(token: string): TokenPayload | null

// Check if token is expired
isTokenExpired(token: string): boolean

// Store auth data
storeAuthData(token: string, user: any, remember: boolean): void

// Clear auth data
clearAuthData(): void

// Handle logout
handleLogout(redirectUrl?: string): Promise<void>

// Redirect based on role
redirectBasedOnRole(): string
```

## Token Storage Strategy

### Implementation

```typescript
// Login with "Remember Me"
storeAuthData(token, user, true);  // Stores in localStorage

// Login without "Remember Me"
storeAuthData(token, user, false); // Stores in sessionStorage
```

### Storage Locations
- **localStorage**: Persistent storage (when "Remember Me" is checked)
- **sessionStorage**: Session-only storage (default)
- **Cookie**: `token` (httpOnly, set by backend)

### Note on httpOnly Cookies
Since the backend sets an `httpOnly` cookie, the client-side storage serves as:
1. A backup for JWT parsing
2. A way to access user data without additional API calls
3. Support for "Remember Me" functionality

## Role-Based Access Control

### User Roles

```typescript
enum UserRole {
  CUSTOMER = 1,
  PROVIDER = 2,
  ADMIN = 3,
}
```

### Role Checks

```typescript
// Check if user has specific role
hasRole([UserRole.ADMIN])  // Returns true/false

// Get current user role
const role = getUserRole()  // Returns UserRole or null
```

## Implementation Examples

### Protected Page Component

```typescript
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserData, isAuthenticated } from "@/lib/auth-utils";

export default function AdminPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    // Get user data
    const user = getUserData();
    if (!user || user.roleId !== UserRole.ADMIN) {
      router.push("/unauthorized");
      return;
    }

    setIsLoading(false);
  }, [router]);

  if (isLoading) return <div>Loading...</div>;

  return <div>Admin Content</div>;
}
```

### Logout Handler

```typescript
const handleLogout = async () => {
  await handleLogout("/login"); // Clears storage and redirects
};
```

### Login Flow

```typescript
// 1. User submits login form
const response = await fetch(`${API_BASE_URL}/login`, {
  method: "POST",
  credentials: "include", // Important: includes cookies
  body: JSON.stringify({ email, password }),
});

const { token, user } = await response.json();

// 2. Store token and user data
storeAuthData(token, user, rememberMe);

// 3. Redirect based on role
const redirectPath = redirectBasedOnRole();
router.push(redirectPath);
```

## Redirect Behavior

### Automatic Redirects

| Scenario | Redirect To |
|----------|-------------|
| Unauthenticated → Admin/Provider/Customer routes | `/login?redirect=<path>` |
| Authenticated → Auth pages | Role-based dashboard |
| Insufficient permissions | Appropriate dashboard for user's role |
| Post-login (with redirect param) | Original requested path |
| Post-login (without redirect param) | Role-based dashboard |

### Role-Based Dashboard Mapping

| Role | Dashboard Path |
|------|----------------|
| ADMIN | `/admin/dashboard` |
| PROVIDER | `/provider/dashboard` |
| CUSTOMER | `/customer/home` |
| Unknown | `/` |

## Security Considerations

### Current Implementation
✅ JWT token validation
✅ Expiration checking
✅ Role-based access control
✅ Protected routes
✅ Automatic redirects

### Recommendations for Production

1. **Refresh Token Pattern**: Implement token refresh logic
2. **CSRF Protection**: Add CSRF tokens for state-changing operations
3. **Token Verification**: Verify tokens with backend on sensitive operations
4. **Secure Storage**: Consider using only httpOnly cookies for token storage
5. **Rate Limiting**: Implement rate limiting on login endpoints
6. **Audit Logging**: Log authentication events for security monitoring

## Troubleshooting

### Common Issues

#### "Access Denied" Errors
- Check that user's `roleId` matches the required role
- Verify token is not expired
- Clear localStorage and login again

#### Redirect Loops
- Ensure middleware is correctly configured
- Check that routes aren't both protected and in AUTH_ROUTES
- Verify role matching logic

#### Token Not Persisting
- Check browser's localStorage/sessionStorage settings
- Verify `storeAuthData` is being called with correct parameters
- Check browser console for storage errors

## Testing Checklist

- [ ] Unauthenticated users cannot access protected routes
- [ ] Authenticated users redirected away from auth pages
- [ ] Users can only access routes matching their role
- [ ] "Remember Me" functionality works correctly
- [ ] Logout clears all auth data
- [ ] Token expiration redirects to login
- [ ] Redirect query parameter works post-login
- [ ] Admin users can access admin routes
- [ ] Provider users can access provider routes
- [ ] Customer users can access customer routes

## Future Enhancements

1. **Auth Context Provider**: Global auth state management
2. **Token Refresh**: Automatic token refresh before expiration
3. **API Interceptor**: Axios interceptor for automatic token inclusion
4. **Permission System**: Fine-grained permissions beyond roles
5. **Session Timeout**: Auto-logout after inactivity
6. **Multi-Factor Auth**: Add 2FA support
7. **Social Login**: OAuth integration (Google, Facebook, etc.)
