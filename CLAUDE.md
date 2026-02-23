# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HSM (Home Service Management) Frontend - A Next.js 16 application connecting customers with service providers. Built with App Router, TypeScript, Tailwind CSS v4, and shadcn/ui components.

**Key Architecture Patterns:**
- App Router with route groups for organization
- JWT-based authentication with role-based access control (RBAC)
- Custom dashboard shell components (Sidebar, Header, DashboardLayout)
- Centralized API configuration with endpoint definitions
- Middleware-based route protection

## Commands

### Development
```bash
npm run dev          # Start development server (runs on port 3000 or 3001 if occupied)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Type Checking
```bash
npx tsc --noEmit    # Check TypeScript errors without building
```

## Architecture

### Route Organization

```
app/
├── (auth)/          # Authentication route group (login, register, forgot-password)
│   ├── login/
│   ├── register/
│   └── forgot-password/
├── (pages)/         # Protected application pages
│   ├── admin/       # Admin dashboard (roleId: 3)
│   └── provider/    # Provider dashboard (roleId: 2)
├── debug-auth/      # Auth debugging utility
├── unauthorized/    # Access denied page
├── layout.tsx       # Root layout
└── page.tsx         # Landing page
```

**Route Groups:** Parentheses `(auth)` and `(pages)` create logical groups without affecting URLs.

### User Roles

```typescript
enum UserRole {
  CUSTOMER = 1,   // /customer/* routes
  PROVIDER = 2,   // /provider/* routes
  ADMIN = 3,      // /admin/* routes
}
```

**Important:** JWT tokens MUST include `roleId` field (not `role_id`). Backend should use camelCase in JWT payload.

### Authentication Flow

1. **Login:** Backend sets `token` cookie (httpOnly) → Frontend stores token in localStorage/sessionStorage
2. **Middleware:** Validates JWT from cookie on every protected route request
3. **Protected Routes:** Middleware checks `roleId` and redirects unauthorized users
4. **Logout:** Clears storage + redirects to `/login`

**Storage Strategy:**
- "Remember Me" checked → `localStorage`
- Not checked → `sessionStorage`
- Cookie → `token` (httpOnly, set by backend)

### Custom Shell Components

Located in `components/common/`:

- **DashboardLayout:** Composes Sidebar + Header + Footer. Props: `sidebar: SidebarProps`, `header?: HeaderProps`, `footer?: FooterProps`
- **Sidebar:** Navigation with collapsible state, active route highlighting, badges. Props: `navItems: NavItem[]`, `appName`, `logo`
- **Header:** User menu, notifications, theme toggle, search. Props: `user: HeaderUser`, `onLogout`, `showSearch`
- **Footer:** Simple footer with links

**Usage Pattern:**
```typescript
// In layout files (must be client components)
"use client";

import { DashboardLayout } from "@/components/common";

export default function AdminLayout({ children }) {
  return (
    <DashboardLayout
      sidebar={{ navItems, appName: "App" }}
      header={{ user: {...}, onLogout }}
    >
      {children}
    </DashboardLayout>
  );
}
```

### API Integration

**Centralized Configuration** (`lib/api.ts`):
- `API_BASE_URL`: Environment variable or fallback to `http://localhost:8000`
- `API_ENDPOINTS`: All backend endpoints defined as constants
- `apiRequest<T>()`: Generic fetch wrapper with error handling
- `api.get/post/put/delete/patch`: Convenience methods

**Usage:**
```typescript
import { api, API_ENDPOINTS } from "@/lib/api";

const users = await api.get<User[]>(API_ENDPOINTS.USERS);
const response = await api.post(API_ENDPOINTS.LOGIN, { email, password });
```

**Backend Integration Notes:**
- Backend uses httpOnly cookies (no manual token header needed)
- `credentials: "include"` required for all requests
- API routes mounted at root level (no `/api` prefix)
- Backend JWT must include: `id`, `email`, `roleId`, `name` (optional)

### Middleware

**File:** `middleware.ts` (runs on edge runtime)

**Protected Routes Configuration:**
```typescript
const PROTECTED_ROUTES = {
  admin: { paths: ["/admin/dashboard", "/admin/users"], allowedRoles: [UserRole.ADMIN] },
  provider: { paths: ["/provider/dashboard"], allowedRoles: [UserRole.PROVIDER] },
  customer: { paths: ["//home", "/customer/bookings"], allowedRoles: [UserRole.CUSTOMER] },
};
```

**Middleware Behavior:**
- Unauthenticated → Protected route: Redirect to `/login?redirect=<path>`
- Authenticated → Auth route: Redirect to role-based dashboard
- Insufficient role: Redirect to appropriate dashboard for user's role

**Debug Mode:** Set `NODE_ENV=development` to see middleware console logs.

### Auth Utilities

**File:** `lib/auth-utils.ts`

**Key Functions:**
- `isAuthenticated()`: Check if user is logged in
- `getUserRole()`: Get user role from token
- `parseToken(token)`: Decode JWT payload
- `storeAuthData(token, user, remember)`: Store token (localStorage/sessionStorage)
- `handleLogout(redirectUrl)`: Clear auth and redirect
- `redirectBasedOnRole()`: Get dashboard path for current user

**Debug Auth:** Visit `/debug-auth` to see token contents and auth state.

### UI Components

**shadcn/ui** configuration:
- Style: "new-york"
- Base color: neutral
- Icons: lucide-react
- CSS variables: enabled
- Path alias: `@/components/ui`

**Form Validation:**
- React Hook Form + Zod
- `@hookform/resolvers` for schema integration

**Notifications:**
- Sonner toast library
- Usage: `import { toast } from "sonner";`

**Styling:**
- Tailwind CSS v4 with `@tailwindcss/postcss`
- Utility function: `cn()` from `@/lib/utils` (clsx + tailwind-merge)
- CSS variables for theming in `app/globals.css`

### Type System

**Key Types** (`types/auth.ts`):
- `UserRole`: Enum (1=Customer, 2=Provider, 3=Admin)
- `User`: `{ id, name, email, phone, roleId }`
- `TokenPayload`: `{ id, name, email, roleId, iat?, exp? }`
- `LoginResponse`: `{ message, token, user }`
- `RegisterResponse`: `{ id, name, email, phone, role_id, created_at }`

**Path Aliases:**
- `@/*` → Root directory
- `@/components/*` → Components
- `@/lib/*` → Library utilities
- `@/hooks/*` → Custom hooks

## Common Patterns

### Creating a New Protected Page

1. Add page file to appropriate route group folder
2. If using shell components, create client component layout:
```typescript
"use client";

export default function Layout({ children }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    setIsLoading(false);
  }, [router]);

  if (isLoading) return <div>Loading...</div>;
  return <DashboardLayout sidebar={...} header={...}>{children}</DashboardLayout>;
}
```
3. Add route to `PROTECTED_ROUTES` in `middleware.ts` if needed

### Adding API Endpoints

1. Add endpoint constant to `API_ENDPOINTS` in `lib/api.ts`
2. Use `api.get/post/put/delete/patch` methods:
```typescript
const result = await api.post(API_ENDPOINTS.NEW_ENDPOINT, data);
```

### Debugging Auth Issues

1. Visit `/debug-auth` to inspect token and auth state
2. Check browser DevTools → Application → Cookies for `token` cookie
3. Check console for auth errors
4. Verify JWT includes `roleId` field with correct value (1, 2, or 3)
5. Check middleware logs (development mode shows console output)

## Important File Locations

- **Middleware:** `middleware.ts` (root)
- **Auth utilities:** `lib/auth-utils.ts`
- **API config:** `lib/api.ts`
- **Auth types:** `types/auth.ts`
- **Shell components:** `components/common/`
- **UI components:** `components/ui/`
- **Root layout:** `app/layout.tsx`
- **Auth pages:** `app/(auth)/*`
- **Protected pages:** `app/(pages)/*`

## Backend Integration Requirements

**Backend must:**
1. Set `token` cookie with httpOnly flag
2. Include `roleId` (not `role_id`) in JWT payload
3. Support CORS with `credentials: true`
4. Return `{ token, user }` from login endpoint
5. Use same role IDs: CUSTOMER=1, PROVIDER=2, ADMIN=3

**Frontend expects:**
- JWT payload: `{ id, email, roleId, name?, iat?, exp? }`
- Cookie name: `token`
- CORS enabled on backend

## Environment Variables

- `NEXT_PUBLIC_API_BASE_URL`: Backend API URL (default: `http://localhost:8000`)
- `NODE_ENV`: Development/production (affects middleware logging)

## Troubleshooting

**Login redirects to `/` instead of dashboard:**
- Check JWT has `roleId` field
- Use `/debug-auth` to inspect token
- Verify backend uses camelCase in JWT

**Infinite loading on protected routes:**
- Check browser console for errors
- Verify token parsing in `lib/auth-utils.ts`
- Check if token is expired

**Middleware not protecting routes:**
- Ensure matcher includes route patterns
- Check token cookie is being sent
- Verify JWT structure matches expectations

**Role-based redirects not working:**
- Confirm `roleId` is correct (1, 2, or 3)
- Check `PROTECTED_ROUTES` config in middleware
- Use `/debug-auth` to verify role extraction

## Documentation Files

- `API_DOCUMENTATION.md`: Complete backend API reference
- `BACKEND_FRONTEND_INTEGRATION.md`: API contracts and endpoints
- `MIDDLEWARE_AUTH_GUIDE.md`: Authentication system documentation
- `AUTH_FLOW_DIAGRAM.md`: Visual flow diagrams
- `TROUBLESHOOTING_AUTH.md`: Debugging guide for auth issues
- `QUICK_FIX_CHECKLIST.md`: Common auth issues and fixes
