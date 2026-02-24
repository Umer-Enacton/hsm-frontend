import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware for authentication and role-based access control
 *
 * This middleware:
 * 1. Checks for authentication token in cookies
 * 2. Verifies user role from localStorage (client-side) or token
 * 3. Protects routes based on user roles
 * 4. Redirects unauthenticated users to login
 * 5. Redirects authenticated users away from auth pages
 */

// User roles matching backend enum
export enum UserRole {
  CUSTOMER = 1,
  PROVIDER = 2,
  ADMIN = 3,
}

// Route configuration
const PROTECTED_ROUTES = {
  // Admin routes - require ADMIN role
  admin: {
    paths: ["/admin/dashboard", "/admin/categories", "/admin/users", "/admin/profile"],
    allowedRoles: [UserRole.ADMIN],
  },
  // Provider routes - require PROVIDER role
  provider: {
    paths: ["/provider"],
    allowedRoles: [UserRole.PROVIDER],
  },
  // Customer routes - require CUSTOMER role
  customer: {
    paths: ["/customer"],
    allowedRoles: [UserRole.CUSTOMER],
  },
};

// Public routes that should redirect authenticated users
const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];

/**
 * Verify JWT token (basic verification without secret)
 * In production, you might want to verify against backend
 */
function verifyToken(token: string): { valid: boolean; payload?: any } {
  try {
    // Split JWT into parts
    const parts = token.split(".");
    if (parts.length !== 3) {
      return { valid: false };
    }

    // Decode payload (base64url)
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf-8")
    );

    // Check expiration
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
    // Exact match
    if (currentPath === path) return true;
    // Prefix match for nested routes
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

  // The backend stores roleId in the JWT
  return payload.roleId || null;
}

/**
 * Middleware main function
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  // Debug logging (only in development)
  if (process.env.NODE_ENV === "development") {
    console.log("[Middleware] Path:", pathname);
    console.log("[Middleware] Token exists:", !!token);
  }

  // Check if user is authenticated
  const isAuthenticated = Boolean(token && verifyToken(token).valid);

  // Get user role if authenticated
  const userRole = isAuthenticated && token ? getUserRoleFromToken(token) : null;

  if (process.env.NODE_ENV === "development" && isAuthenticated) {
    console.log("[Middleware] User Role:", userRole);
  }

  // Scenario 1: User is NOT authenticated
  if (!isAuthenticated) {
    // If trying to access protected routes, redirect to login
    for (const routeGroup of Object.values(PROTECTED_ROUTES)) {
      if (pathMatches(pathname, routeGroup.paths)) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        // Add redirect URL to query params for post-login redirect
        url.searchParams.set("redirect", pathname);
        return NextResponse.redirect(url);
      }
    }

    // Allow access to auth pages and public pages
    return NextResponse.next();
  }

  // Scenario 2: User IS authenticated
  // If trying to access auth pages, redirect based on role
  if (AUTH_ROUTES.includes(pathname)) {
    const url = request.nextUrl.clone();

    // Redirect to appropriate dashboard based on role
    switch (userRole) {
      case UserRole.ADMIN:
        url.pathname = "/admin/dashboard";
        break;
      case UserRole.PROVIDER:
        url.pathname = "/provider/dashboard";
        break;
      case UserRole.CUSTOMER:
        url.pathname = "/customer/home";
        break;
      default:
        // If role is null or unrecognized, try to get from token payload
        const tokenPayload = token ? verifyToken(token).payload : null;
        console.log("[Middleware] Unrecognized role, token payload:", tokenPayload);
        // Default to admin dashboard for now (you can change this)
        url.pathname = "/admin/dashboard";
    }

    return NextResponse.redirect(url);
  }

  // Scenario 3: Check role-based access for protected routes
  for (const [routeName, routeConfig] of Object.entries(PROTECTED_ROUTES)) {
    if (pathMatches(pathname, routeConfig.paths)) {
      // User doesn't have required role
      if (!userRole || !routeConfig.allowedRoles.includes(userRole)) {
        const url = request.nextUrl.clone();

        // Redirect to unauthorized page or appropriate dashboard
        if (userRole === UserRole.CUSTOMER) {
          url.pathname = "/customer/home";
        } else if (userRole === UserRole.PROVIDER) {
          url.pathname = "/provider/dashboard";
        } else if (userRole === UserRole.ADMIN) {
          url.pathname = "/admin/dashboard";
        } else {
          // If no valid role, redirect to unauthorized page
          url.pathname = "/unauthorized";
        }

        return NextResponse.redirect(url);
      }
    }
  }

  // Scenario 4: Allow access to public routes
  return NextResponse.next();
}

/**
 * Configure which routes the middleware should run on
 * Exclude static files, API routes, and Next.js internals
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
