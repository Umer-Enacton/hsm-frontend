/**
 * Client-side authentication utilities
 * Helper functions to work with authentication tokens and user data
 */

import { UserRole } from "@/types/auth";

export interface TokenPayload {
  id: number;
  email: string;
  roleId: UserRole;
  name?: string;  // Optional: might not be in JWT token
  iat?: number;
  exp?: number;
}

/**
 * Parse JWT token and return payload
 * Handles both base64 and base64url encoding
 */
export function parseToken(token: string): TokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      console.error("Invalid token format: expected 3 parts, got", parts.length);
      return null;
    }

    // Try base64url first (standard JWT format)
    let payload: any;
    try {
      payload = JSON.parse(
        Buffer.from(parts[1], "base64url").toString("utf-8")
      );
    } catch {
      // Fallback to regular base64
      try {
        payload = JSON.parse(
          Buffer.from(parts[1], "base64").toString("utf-8")
        );
      } catch (e) {
        console.error("Failed to decode token payload:", e);
        return null;
      }
    }

    console.log("Parsed token payload:", payload);
    return payload;
  } catch (error) {
    console.error("Error parsing token:", error);
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const payload = parseToken(token);
  if (!payload || !payload.exp) {
    return true;
  }

  // Expiration time is in seconds
  const expirationTime = payload.exp * 1000;
  return Date.now() >= expirationTime;
}

/**
 * Get token from cookie (client-side)
 * Note: This won't work with httpOnly cookies, used for localStorage tokens
 */
export function getTokenFromStorage(): string | null {
  if (typeof window === "undefined") return null;

  // Check localStorage first
  const localToken = localStorage.getItem("token");
  if (localToken) {
    return localToken;
  }

  // Check sessionStorage
  const sessionToken = sessionStorage.getItem("token");
  if (sessionToken) {
    return sessionToken;
  }

  return null;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const token = getTokenFromStorage();
  return token !== null && !isTokenExpired(token);
}

/**
 * Get user role from token
 */
export function getUserRole(): UserRole | null {
  const token = getTokenFromStorage();
  if (!token) return null;

  const payload = parseToken(token);
  return payload?.roleId || null;
}

/**
 * Get user data from localStorage
 */
export function getUserData(): TokenPayload | null {
  const token = getTokenFromStorage();
  if (!token) return null;

  return parseToken(token);
}

/**
 * Check if user has required role(s)
 */
export function hasRole(allowedRoles: UserRole[]): boolean {
  const userRole = getUserRole();
  return userRole !== null && allowedRoles.includes(userRole);
}

/**
 * Clear authentication data from storage
 */
export function clearAuthData(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem("token");
  localStorage.removeItem("userData");
  localStorage.removeItem("rememberedEmail");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("userData");
}

/**
 * Store token and user data
 */
export function storeAuthData(
  token: string,
  user: any,
  remember: boolean = false
): void {
  if (typeof window === "undefined") return;

  const storage = remember ? localStorage : sessionStorage;

  // Clear previous data from both storages
  localStorage.removeItem("token");
  localStorage.removeItem("userData");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("userData");

  // Store in chosen storage
  storage.setItem("token", token);
  storage.setItem("userData", JSON.stringify(user));
}

/**
 * Redirect to login with return URL
 */
export function redirectToLogin(returnUrl?: string): void {
  if (typeof window === "undefined") return;

  const loginUrl = new URL("/login", window.location.origin);
  if (returnUrl) {
    loginUrl.searchParams.set("redirect", returnUrl);
  }

  window.location.href = loginUrl.toString();
}

/**
 * Handle logout and redirect
 */
export async function handleLogout(
  redirectUrl: string = "/login"
): Promise<void> {
  if (typeof window === "undefined") return;

  // Clear local storage first
  clearAuthData();

  try {
    // Call backend logout endpoint if available
    // Using the API base URL and /logout endpoint
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
    await fetch(`${API_BASE_URL}/logout`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    }).catch(() => {
      // Ignore errors, proceed with redirect
      console.log("Backend logout call failed or unavailable, proceeding with client-side logout");
    });
  } catch (error) {
    // Ignore errors, proceed with redirect
    console.log("Logout error:", error);
  }

  // Always redirect to login, even if backend call fails
  window.location.href = redirectUrl;
}

/**
 * Role-based redirect helper
 */
export function redirectBasedOnRole(): string {
  const role = getUserRole();

  switch (role) {
    case UserRole.ADMIN:
      return "/admin/dashboard";
    case UserRole.PROVIDER:
      return "/provider/dashboard";
    case UserRole.CUSTOMER:
      return "/customer/home";
    default:
      return "/";
  }
}
