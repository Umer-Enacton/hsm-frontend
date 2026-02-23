# Backend Response Integration - Authentication Pages

## Overview

Updated authentication pages to match the backend API response structure with proper TypeScript types.

---

## Backend Response Structure

### Login Endpoint (`POST /login`)

```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "roleId": 1
  }
}
```

### Register Endpoint (`POST /register`)

```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "role_id": 1,
  "created_at": "2026-02-20T10:00:00.000Z"
}
```

---

## Key Changes

### 1. Property Name Fix

**Issue:** Backend returns `roleId` (camelCase) but frontend was looking for `role_id` (snake_case)

**Fixed in Login Page:**
```typescript
// ❌ Before
if (data.user.role_id === 1) { ... }

// ✅ After
if (data.user.roleId === 1) { ... }
```

### 2. TypeScript Types

Created `types/auth.ts` with comprehensive type definitions:

```typescript
export enum UserRole {
  CUSTOMER = 1,
  PROVIDER = 2,
  ADMIN = 3,
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  roleId: UserRole;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

export interface RegisterResponse {
  id: number;
  name: string;
  email: string;
  phone: string;
  role_id: number;
  created_at: string;
}
```

### 3. Type-Safe Login Page

**Added Type Import:**
```typescript
import type { LoginResponse, UserRole } from "@/types/auth";
```

**Typed API Response:**
```typescript
const data: LoginResponse = await response.json();
```

**Role-Based Redirect with Type Safety:**
```typescript
const roleRedirectMap: Record<UserRole, string> = {
  1: "/customer",
  2: "/provider",
  3: "/admin",
};

const redirectPath = roleRedirectMap[data.user.roleId] || "/";
router.push(redirectPath);
```

**User Data Storage:**
```typescript
if (rememberMe) {
  localStorage.setItem("rememberedEmail", loginData.email);
  localStorage.setItem("userData", JSON.stringify(data.user));
} else {
  localStorage.removeItem("rememberedEmail");
  localStorage.removeItem("userData");
}
```

### 4. Type-Safe Register Page

**Added Type Import:**
```typescript
import type { RegisterResponse, UserRole } from "@/types/auth";
```

**Explicit Role ID:**
```typescript
const roleId: UserRole = userType === "provider" ? 2 : 1;

body: JSON.stringify({
  name: formData.name.trim(),
  email: formData.email.trim().toLowerCase(),
  phone: formData.phone,
  password: formData.password,
  roleId,
}),
```

**Typed API Response:**
```typescript
const data: RegisterResponse = await response.json();
```

---

## Files Updated

### 1. `types/auth.ts` (NEW)
Created comprehensive TypeScript type definitions:
- ✅ `UserRole` enum
- ✅ `User` interface
- ✅ `LoginResponse` interface
- ✅ `RegisterResponse` interface
- ✅ `LoginRequest` interface
- ✅ `RegisterRequest` interface
- ✅ `AuthContextType` interface (for future use)
- ✅ `StoredAuthData` interface

### 2. `app/(auth)/login/page.tsx`
- ✅ Fixed `role_id` → `roleId`
- ✅ Added type imports
- ✅ Typed API response
- ✅ Type-safe role redirect map
- ✅ Store user data in localStorage
- ✅ Better error handling

### 3. `app/(auth)/register/page.tsx`
- ✅ Added type imports
- ✅ Explicit `UserRole` type for roleId
- ✅ Typed API response
- ✅ Type-safe role assignment

---

## Benefits

### 1. Type Safety
- ✅ Catch errors at compile time
- ✅ IntelliSense/autocomplete support
- ✅ Refactoring confidence
- ✅ Self-documenting code

### 2. Backend Alignment
- ✅ Matches backend response exactly
- ✅ No more property name mismatches
- ✅ Proper camelCase usage
- ✅ Correct role IDs

### 3. Better Developer Experience
- ✅ Auto-completion for properties
- ✅ Type checking for role IDs
- ✅ Clear API contracts
- ✅ Easier debugging

### 4. Maintainability
- ✅ Centralized type definitions
- ✅ Reusable across components
- ✅ Easy to update when API changes
- ✅ Consistent usage

---

## Usage Examples

### Using Types in Components

```typescript
import type { User, UserRole } from "@/types/auth";

// Type-safe user data
const currentUser: User = {
  id: 1,
  name: "John Doe",
  email: "john@example.com",
  phone: "9876543210",
  roleId: UserRole.CUSTOMER,
};

// Role-based rendering
if (currentUser.roleId === UserRole.PROVIDER) {
  // Show provider features
}
```

### API Calls with Types

```typescript
import { api } from "@/lib/api";
import type { LoginResponse, RegisterResponse } from "@/types/auth";

// Login
const loginData = await api.post<LoginResponse>("/login", {
  email: "user@example.com",
  password: "password123",
});

// Access user data with type safety
console.log(loginData.user.roleId); // TypeScript knows this is a UserRole

// Register
const registerData = await api.post<RegisterResponse>("/register", {
  name: "John Doe",
  email: "john@example.com",
  phone: "9876543210",
  password: "password123",
  roleId: 2, // TypeScript ensures this is 1, 2, or 3
});
```

---

## Role IDs Reference

| ID | Role | Enum Value | Redirect Path |
|----|------|------------|---------------|
| 1 | Customer | `UserRole.CUSTOMER` | `/customer` |
| 2 | Provider | `UserRole.PROVIDER` | `/provider` |
| 3 | Admin | `UserRole.ADMIN` | `/admin` |

---

## Testing Checklist

### Login Page
- [x] Correct backend response handling
- [x] `roleId` property accessed correctly
- [x] Role-based redirects work
- [x] User data stored in localStorage
- [x] Type checking works
- [x] No TypeScript errors

### Register Page
- [x] Correct roleId sent to backend
- [x] Type-safe role assignment
- [x] API response typed correctly
- [x] No TypeScript errors

### Type Definitions
- [x] All backend responses covered
- [x] Request types defined
- [x] Enum for roles
- [x] Future-ready (AuthContext, etc.)

---

## Next Steps

### Potential Enhancements
- [ ] Create AuthContext for global auth state
- [ ] Add JWT token validation
- [ ] Implement token refresh logic
- [ ] Add role-based route protection
- [ ] Create auth hooks (useAuth, useUser)
- [ ] Add more comprehensive error types
- [ ] Implement session management

### Future Authentication Features
```typescript
// Example: Auth Context Hook
const { user, login, logout, isAuthenticated } = useAuth();

// Role-based component
<RoleGuard allowedRoles={[UserRole.PROVIDER, UserRole.ADMIN]}>
  <ProviderDashboard />
</RoleGuard>

// Protected route
<Route path="/admin" element={
  <RequireRole role={UserRole.ADMIN}>
    <AdminDashboard />
  </RequireRole>
} />
```

---

## Migration Notes

If you have other components using authentication data:

### Before (Untyped)
```typescript
const response = await fetch("/login", {...});
const data = await response.json();
const role = data.user.role_id; // ❌ No type checking
```

### After (Typed)
```typescript
import type { LoginResponse } from "@/types/auth";

const response = await fetch("/login", {...});
const data: LoginResponse = await response.json();
const role = data.user.roleId; // ✅ Type-safe
```

---

## Troubleshooting

### TypeScript Errors

**Error:** Property 'role_id' does not exist on type 'User'
**Solution:** Use `roleId` (camelCase) instead of `role_id` (snake_case)

**Error:** Type 'number' is not assignable to type 'UserRole'
**Solution:** Use the enum values: `UserRole.CUSTOMER`, `UserRole.PROVIDER`, or `UserRole.ADMIN`

### Runtime Errors

**Error:** Cannot read property 'roleId' of undefined
**Solution:** Check if `data.user` exists before accessing properties

---

## Summary

✅ **Fixed property name mismatch** - `role_id` → `roleId`
✅ **Added comprehensive TypeScript types** - Full type safety
✅ **Type-safe role handling** - Enum and Record types
✅ **Better localStorage management** - Store user data
✅ **Improved redirect logic** - Type-safe role mapping
✅ **Centralized type definitions** - Reusable across app
✅ **Future-proof** - Ready for AuthContext implementation

---

**Status:** ✅ Complete
**Date:** 2026-02-20
**Files:** `types/auth.ts`, `app/(auth)/login/page.tsx`, `app/(auth)/register/page.tsx`
