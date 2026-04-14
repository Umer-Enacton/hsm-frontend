import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware for authentication and role-based access control
 *
 * This middleware:
 * 1. Checks for authentication token in cookies
 * 2. Verifies user role from JWT token
 * 3. Protects routes based on user roles
 * 4. Redirects unauthenticated users to login
 * 5. Redirects authenticated users away from auth pages
 */

// User roles matching backend enum
export enum UserRole {
  CUSTOMER = 1,
  PROVIDER = 2,
  ADMIN = 3,
  STAFF = 4,
}

// Route configuration
const PROTECTED_ROUTES = {
  // Admin routes - require ADMIN role
  admin: {
    paths: [
      "/admin/dashboard",
      "/admin/categories",
      "/admin/users",
      "/admin/profile",
      "/admin/business",
      "/admin/business/",
      "/admin/services",
      // "/admin/services/",
      "/admin/bookings",
      "/admin/revenue",
      "/admin/payouts",
      "/admin/settings",
      "/admin/settings/",
      "/admin/subscriptions",
      "/admin/cron-jobs",
      "/admin/payments",
    ],
    allowedRoles: [UserRole.ADMIN],
  },
  // Provider routes - require PROVIDER role
  provider: {
    paths: [
      "/provider/dashboard",
      "/provider/business",
      "/provider/services",
      "/provider/availability",
      "/provider/bookings",
      "/provider/staff",
      "/provider/staff/",
      "/provider/staff-payouts",
      "/provider/reviews",
      "/provider/subscription",
      "/provider/payments",
      "/provider/profile",
    ],
    allowedRoles: [UserRole.PROVIDER],
  },
  // Customer routes - require CUSTOMER role
  customer: {
    paths: [
      "/customer",
      "/customer/services",
      "/customer/services/",
      "/customer/bookings",
      "/customer/profile",
    ],
    allowedRoles: [UserRole.CUSTOMER],
  },
  // Staff routes - require STAFF role
  staff: {
    paths: [
      "/staff/dashboard",
      "/staff/bookings",
      "/staff/leave",
      "/staff/profile",
      "/staff/earnings",
      "/staff/payment-details",
    ],
    allowedRoles: [UserRole.STAFF],
  },
};

// Public routes that should redirect authenticated users
const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];

// Routes that don't need auth
const PUBLIC_ROUTES = [
  "/",
  "/onboarding",
  "/privacy",
  "/terms",
  "/unauthorized",
];

/**
 * Verify JWT token (basic verification without secret)
 */
function verifyToken(token: string): { valid: boolean; payload?: any } {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return { valid: false };
    }

    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf-8"),
    );

    if (payload.exp && payload.exp < Date.now() / 1000) {
      return { valid: false };
    }

    return { valid: true, payload };
  } catch (error) {
    return { valid: false };
  }
}

/**
 * Check if the current path matches any of the given paths
 */
function pathMatches(currentPath: string, paths: string[]): boolean {
  return paths.some((path) => {
    if (currentPath === path) return true;
    if (currentPath.startsWith(path + "/")) return true;
    return false;
  });
}

/**
 * Get user role from JWT token payload
 */
function getUserRoleFromToken(token: string): UserRole | null {
  const { valid, payload } = verifyToken(token);
  if (!valid || !payload) return null;
  return payload.roleId || null;
}

/**
 * Proxy main function
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/static/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Get token from cookie
  const token = request.cookies.get("token")?.value;

  // Check if user is authenticated
  const isAuthenticated = Boolean(token && verifyToken(token).valid);

  // Get user role if authenticated
  const userRole =
    isAuthenticated && token ? getUserRoleFromToken(token) : null;

  // Debug logging (only in development)
  if (process.env.NODE_ENV === "development") {
    console.log(
      "[Middleware] Path:",
      pathname,
      "| Auth:",
      isAuthenticated,
      "| Role:",
      userRole,
    );
  }

  // Scenario 0: Handle root path "/"
  if (pathname === "/") {
    const url = request.nextUrl.clone();

    if (isAuthenticated && userRole) {
      switch (userRole) {
        case UserRole.ADMIN:
          url.pathname = "/admin/dashboard";
          break;
        case UserRole.PROVIDER:
          url.pathname = "/provider/dashboard";
          break;
        case UserRole.CUSTOMER:
          url.pathname = "/customer";
          break;
        case UserRole.STAFF:
          url.pathname = "/staff/dashboard";
          break;
        default:
          url.pathname = "/login";
      }
    } else {
      url.pathname = "/login";
    }

    return NextResponse.redirect(url);
  }

  // Allow access to public routes without auth
  if (
    PUBLIC_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(route + "/"),
    )
  ) {
    return NextResponse.next();
  }

  // Scenario 1: User is NOT authenticated
  if (!isAuthenticated) {
    // If trying to access protected routes, redirect to login
    for (const routeGroup of Object.values(PROTECTED_ROUTES)) {
      if (pathMatches(pathname, routeGroup.paths)) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("redirect", pathname);
        return NextResponse.redirect(url);
      }
    }

    return NextResponse.next();
  }

  // Scenario 2: User IS authenticated
  // If trying to access auth pages, redirect based on role
  if (AUTH_ROUTES.includes(pathname)) {
    const url = request.nextUrl.clone();

    switch (userRole) {
      case UserRole.ADMIN:
        url.pathname = "/admin/dashboard";
        break;
      case UserRole.PROVIDER:
        url.pathname = "/provider/dashboard";
        break;
      case UserRole.CUSTOMER:
        url.pathname = "/customer";
        break;
      case UserRole.STAFF:
        url.pathname = "/staff/dashboard";
        break;
      default:
        url.pathname = "/login";
    }

    return NextResponse.redirect(url);
  }

  // Scenario 3: Check role-based access for protected routes
  for (const [routeName, routeConfig] of Object.entries(PROTECTED_ROUTES)) {
    if (pathMatches(pathname, routeConfig.paths)) {
      if (!userRole || !routeConfig.allowedRoles.includes(userRole)) {
        const url = request.nextUrl.clone();

        if (userRole === UserRole.CUSTOMER) {
          url.pathname = "/customer";
        } else if (userRole === UserRole.PROVIDER) {
          url.pathname = "/provider/dashboard";
        } else if (userRole === UserRole.ADMIN) {
          url.pathname = "/admin/dashboard";
        } else if (userRole === UserRole.STAFF) {
          url.pathname = "/staff/dashboard";
        } else {
          url.pathname = "/unauthorized";
        }

        return NextResponse.redirect(url);
      }
    }
  }

  return NextResponse.next();
}

/**
 * Configure which routes the proxy should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (handled by backend)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
