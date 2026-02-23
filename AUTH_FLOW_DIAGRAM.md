# Authentication Flow Diagram

## Visual Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER REQUESTS PAGE                           │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  NEXT.JS APP   │
                    └────────┬───────┘
                             │
                             ▼
                    ┌────────────────────────┐
                    │     MIDDLEWARE         │
                    │  (middleware.ts)       │
                    └────────┬───────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
    ┌───────────────────┐    ┌─────────────────────┐
    │  Cookie Present?  │    │   Path Protected?   │
    └───────┬───────────┘    └─────────┬───────────┘
            │                          │
       ┌────┴────┐              ┌──────┴──────┐
       │         │              │             │
      YES       NO            YES           NO
       │         │              │             │
       ▼         ▼              ▼             ▼
  ┌────────┐ ┌──────┐    ┌──────────┐  ┌──────────┐
  │ Verify │ │Allow │    │ Check    │  │ Allow   │
  │ Token  │ │Auth  │    │ Token    │  │ Public  │
  └───┬────┘ └──────┘    └────┬─────┘  └──────────┘
      │                         │
      ▼                         ▼
  ┌────────────┐         ┌──────────┐
  │ Valid?     │         │ Valid?   │
  └────┬───────┘         └────┬─────┘
       │                      │
    ┌──┴──┐               ┌────┴────┐
    │     │               │          │
   YES   NO              YES        NO
    │     │               │          │
    ▼     ▼               ▼          ▼
┌──────┐ ┌──────┐    ┌────────┐ ┌──────────┐
│Check │ │Redirect│   │ Check  │ │Redirect │
│Role  │ │ /login│   │ Role   │ │ /login   │
└───┬──┘ └──────┘    └────┬───┘ └──────────┘
    │                      │
    ▼                      ▼
┌──────────┐         ┌──────────────┐
│Allowed?  │         │ Allowed?     │
└────┬─────┘         └──────┬───────┘
     │                      │
  ┌──┴──┐               ┌────┴────┐
  │     │               │          │
 YES    NO              YES        NO
  │     │               │          │
  ▼     ▼               ▼          ▼
┌────┐ ┌──────┐    ┌────────┐ ┌──────────┐
│Allow│ │Redirect│   │ Allow  │ │Redirect │
│Page │ │ /unauth│   │ Page   │ │ /unauth  │
└────┘ └──────┘    └────────┘ └──────────┘
```

## Login Flow

```
┌────────────────┐
│ User Submits   │
│ Login Form     │
└────────┬───────┘
         │
         ▼
┌────────────────────────────┐
│ POST /login (Backend)      │
│ { email, password }        │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│ Backend Validates          │
│ - Check credentials        │
│ - Generate JWT token       │
│ - Set httpOnly cookie      │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│ Response: { token, user }  │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│ Frontend Stores Data       │
│ - storeAuthData()          │
│ - localStorage OR          │
│   sessionStorage           │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│ Redirect Based on Role     │
│ - ADMIN → /admin/dashboard │
│ - PROVIDER → /provider/dash │
│ - CUSTOMER → /customer/home│
└────────────────────────────┘
```

## Protected Route Access Flow

```
┌─────────────────────────────┐
│ User Requests: /admin/dash  │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Middleware Checks           │
│ 1. Cookie has token?        │
│ 2. Token valid?             │
│ 3. User role = ADMIN?       │
└────────┬────────────────────┘
         │
    ┌────┴────┐
    │         │
   All OK    Has Issue
    │         │
    ▼         ▼
┌────────┐ ┌──────────────┐
│ Render │ │ Redirect     │
│ Page   │ │ /login       │
└────────┘ │ ?redirect=   │
           │ /admin/dash  │
           └──────────────┘
```

## Role-Based Dashboard Mapping

```
┌──────────────────────────────────────────────────────┐
│                   USER ROLE                          │
└──────────────┬───────────────────────────────────────┘
               │
      ┌────────┼────────┐
      │        │        │
      ▼        ▼        ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│CUSTOMER │ │PROVIDER │ │  ADMIN  │
│  (1)    │ │  (2)    │ │   (3)   │
└────┬────┘ └────┬────┘ └────┬────┘
     │           │           │
     ▼           ▼           ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
/customer │ /provider │ /admin   │
 /home    │ /dash     │ /dash    │
└─────────┘ └─────────┘ └─────────┘
```

## Token Storage Flow

```
┌───────────────────────────────┐
│ User Logs In                 │
│ with "Remember Me" checkbox   │
└───────────┬───────────────────┘
            │
       ┌────┴────┐
       │         │
     Checked    Unchecked
       │         │
       ▼         ▼
  ┌─────────┐ ┌─────────────┐
  │localStorage│sessionStorage│
  │ (Persistent)│ (Session)  │
  └────┬─────┘ └──────┬──────┘
       │              │
       └──────┬───────┘
              │
              ▼
     ┌────────────────────┐
     │ Token Available   │
     │ for Client-Side   │
     │ Auth Checks       │
     └────────────────────┘
```

## Logout Flow

```
┌──────────────────┐
│ User Clicks      │
│ Logout Button    │
└────────┬─────────┘
         │
         ▼
┌────────────────────────────┐
│ 1. Call handleLogout()     │
│    - Call backend /logout  │
│    - Clear localStorage    │
│    - Clear sessionStorage  │
│    - Clear cookies         │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│ 2. Redirect to /login      │
└────────────────────────────┘
```

## Error Handling Flow

```
┌─────────────────────────────┐
│ Token Error Detected        │
│ (Expired/Invalid/Missing)   │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Clear All Auth Data         │
│ - localStorage              │
│ - sessionStorage            │
│ - Cookies                   │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Redirect to /login          │
│ + error message             │
└─────────────────────────────┘
```

## Middleware Matcher Configuration

```
Protected Routes (Middleware runs):
├── /admin/*                  → Requires ADMIN
├── /provider/*               → Requires PROVIDER
├── /customer/*               → Requires CUSTOMER
├── /login                    → Redirect if authenticated
├── /register                 → Redirect if authenticated
└── /forgot-password          → Redirect if authenticated

Excluded Routes (Middleware skipped):
├── /api/*                    → Backend handles auth
├── /_next/*                  → Next.js internals
├── /favicon.ico              → Static assets
└── /*.{svg,png,jpg,etc}      → Static files
```

## Security Layers

```
┌─────────────────────────────────────────────┐
│          SECURITY LAYERS                    │
├─────────────────────────────────────────────┤
│ 1. Middleware (Server)                      │
│    - Route protection                       │
│    - Token validation                       │
│    - Role checks                            │
├─────────────────────────────────────────────┤
│ 2. Auth Utilities (Client)                  │
│    - Token parsing                          │
│    - Expiration checks                      │
│    - Local validation                       │
├─────────────────────────────────────────────┤
│ 3. Backend Middleware                       │
│    - JWT verification                       │
│    - Role authorization                     │
│    - Request validation                     │
└─────────────────────────────────────────────┘
```
