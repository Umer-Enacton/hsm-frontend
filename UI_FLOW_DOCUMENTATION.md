# HSM Frontend - Complete UI Flow & User Journey Documentation

## Table of Contents
1. [Application Structure Overview](#application-structure-overview)
2. [Public Pages Flow](#public-pages-flow)
3. [Authentication Flow](#authentication-flow)
4. [Protected Dashboard Flows](#protected-dashboard-flows)
5. [Component Connections](#component-connections)
6. [User Journey Maps](#user-journey-maps)

---

## Application Structure Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     HSM Frontend Architecture                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  PUBLIC LAYER                                                │
│  ├── Landing Page (/) - Default Next.js page               │
│  ├── Authentication Pages                                   │
│  │   ├── /login                                             │
│  │   ├── /register (Customer/Provider tabs)                 │
│  │   └── /forgot-password (OTP flow)                        │
│  └── /unauthorized (Access denied page)                     │
│                                                               │
│  PROTECTED LAYER (Middleware Protected)                     │
│  ├── Admin Routes (/admin/*) - roleId: 3                    │
│  │   ├── /admin/dashboard                                   │
│  │   ├── /admin/categories                                  │
│  │   └── /admin/users (planned)                             │
│  ├── Provider Routes (/provider/*) - roleId: 2              │
│  │   └── /provider/dashboard (planned)                      │
│  └── Customer Routes (/customer/*) - roleId: 1              │
│      └── /customer/home (planned)                           │
│                                                               │
│  SHARED LAYER                                                │
│  ├── Root Layout (Fonts + Toaster)                          │
│  ├── Dashboard Layout (Sidebar + Header + Footer)           │
│  └── UI Components (shadcn/ui)                              │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Public Pages Flow

### 1. Landing Page (`/`)

**File:** `app/page.tsx`

**Current State:** Default Next.js template page (not yet customized for HSM)

**User Experience:**
```
User visits domain → Landing page displayed
                      ├── No authentication required
                      ├── Shows: "To get started, edit page.tsx"
                      ├── Links to: Next.js templates, docs
                      └── CTA buttons: Deploy Now, Documentation
```

**Planned Flow (To Be Implemented):**
```
Landing Page → Hero section with HSM branding
              ├── Features showcase
              ├── Service categories preview
              ├── "Get Started" CTA → /register
              └── "Login" CTA → /login
```

**Components Used:**
- None (static page)
- Uses root layout for fonts and toaster

**Connections:**
- No child routes
- No layout wrapper
- Direct page render

---

## Authentication Flow

### Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                     │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  UNAUTHENTICATED USER                                      │
│       │                                                     │
│       ├──→ /login (Login Page)                             │
│       │        ├── Enter credentials                        │
│       │        ├── Backend validates                        │
│       │        ├── Sets httpOnly cookie                    │
│       │        └── Redirects to dashboard                   │
│       │                                                     │
│       ├──→ /register (Registration Page)                   │
│       │        ├── Choose: Customer or Provider             │
│       │        ├── Fill form with validation                │
│       │        ├── Backend creates user                     │
│       │        └── Redirects to login                       │
│       │                                                     │
│       └──→ /forgot-password (Password Reset)              │
│                ├── Enter email → Send OTP                  │
│                ├── Verify OTP                              │
│                ├── Set new password                        │
│                └── Success → Redirect to login              │
│                                                             │
│  AUTHENTICATED USER                                        │
│       │                                                     │
│       ├──→ Tries to access /login or /register             │
│       │     └──→ Middleware redirects to role dashboard    │
│       │                                                     │
│       └──→ Accesses protected routes                        │
│             └──→ Middleware validates JWT + roleId         │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### 2. Login Page (`/login`)

**File:** `app/(auth)/login/page.tsx`

**User Flow:**
```
1. User arrives at /login
   ├── Middleware: If authenticated → redirect to dashboard
   └── If not authenticated → Show login form

2. User fills form:
   ├── Email (validation: required, valid format)
   ├── Password (validation: required, min 6 chars)
   └── Remember Me checkbox

3. User submits:
   ├── Client-side validation runs
   ├── POST to /login (backend)
   ├── Backend validates credentials
   ├── Backend sets httpOnly cookie: token=JWT
   └── Response: { token, user }

4. Success handling:
   ├── Store token in localStorage/sessionStorage
   ├── Store user data
   ├── Check for redirect query param
   │    ├── If exists → redirect to that path
   │    └── If not → role-based redirect:
   │         ├── roleId: 1 → /customer/home
   │         ├── roleId: 2 → /provider/dashboard
   │         └── roleId: 3 → /admin/dashboard
   └── Show success toast

5. Error handling:
   └── Show error toast with message from backend
```

**Component Structure:**
```
LoginPage (Client Component)
├── Form with email/password fields
├── "Remember Me" checkbox
├── Password visibility toggle
├── "Forgot Password?" link → /forgot-password
├── "Sign up" link → /register
├── Terms & Conditions links
└── Submit button with loading state
```

**API Calls:**
- `POST /login` with `{ email, password }`
- Response: `{ message, token, user }`

**State Management:**
- `loginData`: { email, password }
- `isLoading`: boolean
- `showPassword`: boolean
- `rememberMe`: boolean

**Validation:**
- Email: Regex validation
- Password: Min 6 characters
- All fields required

**Connections:**
- Uses `API_BASE_URL` from `lib/api.ts`
- Uses `storeAuthData()` from `lib/auth-utils.ts`
- Uses `UserRole` enum from `types/auth.ts`

---

### 3. Registration Page (`/register`)

**File:** `app/(auth)/register/page.tsx`

**User Flow:**
```
1. User arrives at /register
   ├── Middleware: If authenticated → redirect to dashboard
   └── If not authenticated → Show registration form

2. User selects account type (Tabs):
   ├── Customer Tab (default)
   │   └── roleId: 1
   └── Provider Tab
       └── roleId: 2

3. User fills form:
   ├── Name (3-50 characters)
   ├── Email (valid format)
   ├── Phone (Indian format: 10 digits, starts with 6-9)
   ├── Password (with strength indicator)
   ├── Confirm Password (must match)
   └── Terms & Conditions checkbox (required)

4. Real-time validation:
   ├── Name: Shows ✓/✗ as user types
   ├── Email: Shows ✓/✗ on blur
   ├── Phone: Shows ✓/✗ as user types
   ├── Password: Strength meter (Weak/Fair/Good/Strong)
   └── Confirm Password: Match indicator

5. User submits:
   ├── All validations run
   ├── POST to /register (backend)
   ├── Backend creates user
   └── Response: { id, name, email, phone, role_id, created_at }

6. Success handling:
   ├── Show success toast
   ├── Redirect to /login after 2 seconds
   └── User can now login

7. Error handling:
   └── Show error toast with message
```

**Component Structure:**
```
RegisterPage (Client Component)
├── Tabs (Customer | Provider)
│   └── Changes userType state
├── Form fields:
│   ├── Name (with validation indicator)
│   ├── Email (with validation indicator)
│   ├── Phone (with validation indicator)
│   ├── Password (with strength meter)
│   └── Confirm Password (with match indicator)
├── Terms & Conditions checkbox
├── "Already have an account? Sign in" link → /login
└── Submit button with loading state
```

**Form Fields & Validation:**

| Field | Validation Rules | Visual Feedback |
|-------|------------------|-----------------|
| Name | 3-50 characters | ✓/✗ icon appears |
| Email | Valid email format | ✓/✗ icon on blur |
| Phone | 10 digits, starts with 6-9 | ✓/✗ icon as typing |
| Password | Min 6 chars | Strength meter (4 levels) |
| Confirm Password | Must match password | Match indicator |
| Terms | Must be checked | Button disabled if not |

**Password Strength Indicator:**
```
Length      | Strength | Visual
------------|----------|------------------
< 6 chars   | Weak     | 1 red bar
6-9 chars   | Fair     | 2 orange bars
10-11 chars | Good     | 3 yellow bars
12+ chars   | Strong   | 4 green bars
```

**API Calls:**
- `POST /register` with `{ name, email, phone, password, roleId }`
- Response: `{ id, name, email, phone, role_id, created_at }`

**State Management:**
- `userType`: "customer" | "provider"
- `formData`: { name, email, phone, password, confirmPassword, agreeToTerms }
- `isLoading`: boolean
- `showPassword`, `showConfirmPassword`: boolean

**Connections:**
- Uses `API_BASE_URL` from `lib/api.ts`
- Uses `UserRole` enum from `types/auth.ts`
- Router to redirect to /login after success

---

### 4. Forgot Password Page (`/forgot-password`)

**File:** `app/(auth)/forgot-password/page.tsx`

**User Flow:**
```
MULTI-STEP FLOW (4 Steps)

Step 1: Request OTP
├── User enters email
├── Validation: Email format required
├── Submit → POST /forgot-password
├── Backend sends OTP to email (valid 10 min)
├── Success → Move to Step 2
└── Start resend timer (60 seconds)

Step 2: Verify OTP
├── User enters 6-digit OTP
├── Submit → POST /verify-otp
├── Backend validates OTP
├── Success → Move to Step 3
└── Error → Show invalid OTP message

Resend OTP (optional):
├── "Resend OTP" button
├── Disabled for 60 seconds after sending
├── Countdown timer shows
└── Re-enables after timer expires

Step 3: Reset Password
├── User enters new password
├── User confirms new password
├── Validation:
│   ├── Min 6 characters
│   └── Both passwords must match
├── Submit → POST /reset-password
├── Backend updates password
└── Success → Move to Step 4

Step 4: Success
├── Show success message
├── "Go to Login" button
└── Redirect to /login
```

**Component Structure:**
```
ForgotPasswordPage (Client Component)
├── State: step ("request" | "verify" | "reset" | "success")
│
├── [Step 1] Request OTP Form
│   ├── Email input
│   ├── Submit button
│   └── Back to login link
│
├── [Step 2] Verify OTP Form
│   ├── 6-digit OTP input
│   ├── Resend OTP button (with timer)
│   ├── Verify button
│   └── Back button
│
├── [Step 3] Reset Password Form
│   ├── New password input (with visibility toggle)
│   ├── Confirm password input (with visibility toggle)
│   ├── Reset button
│   └── Back button
│
└── [Step 4] Success Screen
    ├── Checkmark animation
    ├── Success message
    └── "Go to Login" button
```

**API Calls:**

| Step | Endpoint | Payload | Response |
|------|----------|---------|----------|
| 1 | POST `/forgot-password` | `{ email }` | Sends OTP |
| 2 | POST `/verify-otp` | `{ email, otp }` | Validates OTP |
| 3 | POST `/reset-password` | `{ email, otp, newPassword }` | Updates password |

**State Management:**
- `step`: Current step in flow
- `email`: User's email (carried through all steps)
- `otp`: Entered OTP
- `newPassword`, `confirmPassword`: New password
- `isLoading`: boolean
- `resendTimer`: Countdown (0-60 seconds)
- `showPassword`, `showConfirmPassword`: boolean

**Timer Logic:**
```
OTP sent → Start 60-second countdown
           ├── "Resend OTP" disabled
           ├── Shows "Resend in 59s..."
           └── At 0 → Re-enable button
```

**Connections:**
- Uses `API_BASE_URL` from `lib/api.ts`
- Router to redirect to /login after success
- No auth required (public flow)

---

## Protected Dashboard Flows

### Admin Dashboard Flow

**Protected Route:** `/admin/*`

**Middleware Protection:**
```
User visits /admin/dashboard
    │
    ├── Middleware checks:
    │   ├── Cookie has token?
    │   ├── Token valid (not expired)?
    │   └── Token has roleId = 3 (ADMIN)?
    │
    ├── If any check fails:
    │   └──→ /login?redirect=/admin/dashboard
    │
    └── If all pass:
        └──→ Show Admin Dashboard
```

**Layout Structure:**
```
AdminLayout (Client Component)
├── Authentication Check (useEffect)
│   ├── isAuthenticated()?
│   ├── getUserRole() === ADMIN?
│   ├── If not → Redirect to /login
│   └── Set loading state
│
├── DashboardLayout (Shell Component)
│   ├── Sidebar
│   │   ├── App Name: "HSM Admin"
│   │   ├── Nav Items:
│   │   │   ├── Dashboard (active route highlight)
│   │   │   ├── Categories
│   │   │   └── Users
│   │   └── Collapse toggle button
│   │
│   ├── Header
│   │   ├── User dropdown:
│   │   │   ├── Name (from token)
│   │   │   ├── Email
│   │   │   └── Role: "Administrator"
│   │   │   ├── Profile action
│   │   │   ├── Settings action
│   │   │   └── Logout action → handleLogout()
│   │   ├── Notifications bell (with badge)
│   │   ├── Theme toggle (dark/light)
│   │   └── Search bar
│   │
│   └── Main Content Area
│       └── Page content renders here
│
└── Children (Page Content)
    └── /admin/dashboard or /admin/categories
```

**Admin Pages:**

#### 1. Admin Dashboard (`/admin/dashboard`)

**File:** `app/(pages)/admin/dashboard/page.tsx`

**Content Displayed:**
```
┌─────────────────────────────────────────────────┐
│  Dashboard (Page Title)                         │
│  Welcome to the HSM Admin Dashboard...         │
├─────────────────────────────────────────────────┤
│  Stats Cards (4 columns)                        │
│  ├── Total Users: 1,234 (+20.1%)               │
│  ├── Active Services: 456 (+18.2%)             │
│  ├── Service Providers: 89 (+12 this week)     │
│  └── Revenue: $45,231 (+4.5%)                  │
├─────────────────────────────────────────────────┤
│  Recent Activity List                           │
│  ├── New user registration                      │
│  ├── Service request assigned                   │
│  ├── Payment processed                          │
│  └── New service provider application           │
└─────────────────────────────────────────────────┘
```

**Features:**
- Statistics overview with trend indicators
- Recent activity feed
- Responsive grid layout (1-4 columns based on screen size)

#### 2. Admin Categories (`/admin/categories`)

**Status:** Page exists but likely placeholder content

**Planned Features:**
- CRUD operations for service categories
- List view with add/edit/delete actions

#### 3. Admin Users (`/admin/users`)

**Status:** Navigation item exists but page not created yet

---

### Provider Dashboard Flow (Planned)

**Protected Route:** `/provider/*`

**Intended Flow:**
```
Provider Login
    │
    └──→ /provider/dashboard
         ├── Manage business profile
         ├── Add/edit services
         ├── Set availability slots
         ├── View booking requests
         └── Accept/reject bookings
```

**Current Status:** Route defined in middleware but pages not implemented

---

### Customer Dashboard Flow (Planned)

**Protected Route:** `/customer/*`

**Intended Flow:**
```
Customer Login
    │
    └──→ /customer/home
         ├── Browse service categories
         ├── Search for services
         ├── View provider profiles
         ├── Book appointments
         ├── Manage bookings
         └── Leave feedback
```

**Current Status:** Route defined in middleware but pages not implemented

---

## Component Connections

### Shell Component Hierarchy

```
RootLayout (app/layout.tsx)
├── Geist Sans & Geist Mono Fonts
├── Sonner Toaster (for toast notifications)
└── {children} (pages render here)

    ↓

AdminLayout (app/(pages)/admin/layout.tsx)
├── Auth check (getUserData, isAuthenticated)
├── Loading state
├── Error handling
└── DashboardLayout

    ↓

DashboardLayout (components/common/DashboardLayout.tsx)
├── Sidebar (left navigation)
│   ├── Nav items (clickable links)
│   ├── Active route highlighting
│   └── Collapse toggle
│
├── Header (top bar)
│   ├── User dropdown menu
│   ├── Notifications
│   ├── Theme toggle
│   └── Search
│
└── Main Content Area
    └── Page content (children)

    ↓

Page Content (e.g., admin/dashboard/page.tsx)
└── Actual page content renders here
```

### Navigation Flow

```
Sidebar Navigation Items (Admin)
├── Dashboard → /admin/dashboard
├── Categories → /admin/categories
└── Users → /admin/users

Header Actions
├── User Dropdown
│   ├── Profile → (action callback)
│   ├── Settings → (action callback)
│   └── Logout → handleLogout()
├── Notifications → (dropdown menu)
├── Theme Toggle → (switches theme)
└── Search → (filter callback)
```

### Data Flow

```
1. User logs in
   ↓
2. Backend returns { token, user }
   ↓
3. Frontend stores in localStorage/sessionStorage
   ↓
4. Token parsed for roleId
   ↓
5. Middleware checks roleId on every protected route
   ↓
6. If valid → Show page
   If invalid → Redirect to /login
```

---

## User Journey Maps

### New Customer Journey

```
1. Lands on homepage (/)
   ↓
2. Clicks "Sign Up" or "Get Started"
   ↓
3. Arrives at /register
   ↓
4. Selects "Customer" tab
   ↓
5. Fills registration form:
   - Name, Email, Phone, Password
   - Agrees to terms
   ↓
6. Submits → Account created
   ↓
7. Redirected to /login
   ↓
8. Enters credentials
   ↓
9. Logged in → Redirected to /customer/home
   ↓
10. Can now:
    - Browse services
    - Book appointments
    - Manage bookings
    - View profile
```

### New Provider Journey

```
1. Lands on homepage (/)
   ↓
2. Clicks "Become a Provider" or "Sign Up"
   ↓
3. Arrives at /register
   ↓
4. Selects "Provider" tab
   ↓
5. Fills registration form:
   - Business name, Email, Phone, Password
   - Agrees to terms
   ↓
6. Submits → Account created
   ↓
7. Redirected to /login
   ↓
8. Enters credentials
   ↓
9. Logged in → Redirected to /provider/dashboard
   ↓
10. Can now:
     - Setup business profile
     - Add services
     - Set availability
     - Manage bookings
```

### Admin Journey

```
1. Goes to /login
   ↓
2. Enters admin credentials
   ↓
3. Backend validates admin role (roleId: 3)
   ↓
4. Logged in → Redirected to /admin/dashboard
   ↓
5. Sees:
    - Statistics overview
    - Recent activity
    - Navigation menu
    ↓
6. Can navigate to:
    - /admin/dashboard (overview)
    - /admin/categories (manage categories)
    - /admin/users (manage users)
    ↓
7. Logout → Redirected to /login
```

### Password Reset Journey

```
1. User clicks "Forgot Password?" on login page
   ↓
2. Arrives at /forgot-password
   ↓
3. Enters email address
   ↓
4. Submits → Backend sends OTP to email
   ↓
5. Enters OTP (6 digits)
   ↓
6. Verifies OTP
   ↓
7. Enters new password
   ↓
8. Confirms new password
   ↓
9. Submits → Password updated
   ↓
10. Shows success message
    ↓
11. "Go to Login" button
    ↓
12. Logs in with new password
```

---

## Key Integration Points

### 1. Authentication → Dashboard Connection

```
Login Success
    ↓
storeAuthData(token, user, rememberMe)
    ↓
redirectBasedOnRole() or use API response
    ↓
Middleware validates cookie
    ↓
AdminLayout checks auth
    ↓
DashboardLayout renders shell
    ↓
Page content displays
```

### 2. Navigation → Page Connection

```
Sidebar Nav Item clicked
    ↓
Next.js <Link> navigates
    ↓
Middleware validates route
    ↓
AdminLayout wraps page
    ↓
Page content updates
    ↓
Active route highlights in Sidebar
```

### 3. Logout Flow

```
User clicks "Logout" in Header
    ↓
handleLogout() called
    ↓
Clears: localStorage, sessionStorage, cookies
    ↓
Calls backend /logout (optional)
    ↓
Redirects to /login
    ↓
Middleware sees no token
    ↓
Shows login page
```

### 4. Protected Route Access

```
User types /admin/dashboard directly
    ↓
Middleware runs FIRST
    ↓
Checks:
    ├── Cookie exists?
    ├── Token valid?
    └── roleId matches route requirement?
    ↓
If all pass → Allow access
If any fail → /login?redirect=/admin/dashboard
```

---

## Current Implementation Status

### ✅ Fully Implemented

| Feature | Status | Files |
|---------|--------|-------|
| Login Page | ✅ Complete | `app/(auth)/login/page.tsx` |
| Registration Page | ✅ Complete | `app/(auth)/register/page.tsx` |
| Forgot Password Flow | ✅ Complete | `app/(auth)/forgot-password/page.tsx` |
| Admin Layout | ✅ Complete | `app/(pages)/admin/layout.tsx` |
| Admin Dashboard | ✅ Complete | `app/(pages)/admin/dashboard/page.tsx` |
| Middleware Auth | ✅ Complete | `middleware.ts` |
| Auth Utilities | ✅ Complete | `lib/auth-utils.ts` |
| Shell Components | ✅ Complete | `components/common/*` |

### 🚧 Partially Implemented

| Feature | Status | Notes |
|---------|--------|-------|
| Landing Page | 🚧 Placeholder | Default Next.js page |
| Admin Categories | 🚧 Placeholder | Page exists, needs content |
| Admin Users | 🔴 Not Started | Nav item exists, no page |

| 🔴 Not Implemented | Status | Planned |
|-------------------|--------|---------|
| Provider Dashboard | 🔴 Not Started | /provider/dashboard |
| Customer Dashboard | 🔴 Not Started | /customer/home |
| Customer Bookings | 🔴 Not Started | /customer/bookings |
| Business Management | 🔴 Not Started | Provider features |
| Service Booking | 🔴 Not Started | Customer features |

---

## Summary

**Current Active Flows:**

1. **Public → Auth Flow:** Working ✅
   - Landing → Login/Register → Dashboard

2. **Admin Flow:** Working ✅
   - Login → Admin Dashboard → Categories → Logout

3. **Password Reset Flow:** Working ✅
   - Forgot Password → OTP → Reset → Login

**Missing Flows:**

1. **Provider Flow:** Not implemented
2. **Customer Flow:** Not implemented
3. **Landing Page:** Not customized

**Connection Points:**

- **Middleware:** Gatekeeper for all protected routes
- **Auth Utilities:** Token management and validation
- **Shell Components:** Consistent layout across dashboards
- **Router:** Navigation between pages
- **API Backend:** All data operations
