import { api, API_BASE_URL } from "./api";

export type UserRole = "customer" | "provider";

export interface GoogleAuthResponse {
  message: string;
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    avatar: string | null;
    roleId: number;
  };
  isNewUser: boolean;
  needsPhone: boolean;
}

export interface GoogleAuthUrlResponse {
  authUrl: string;
}

/**
 * Get Google OAuth URL for the specified role
 */
export async function getGoogleAuthUrl(role: UserRole): Promise<string> {
  const response = await api.get<{ authUrl: string }>(`/auth/google?role=${role}`);
  return response.authUrl;
}

/**
 * Handle Google OAuth callback
 */
export async function handleGoogleCallback(
  code: string,
  state: string
): Promise<GoogleAuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/google/callback?code=${code}&state=${state}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Google authentication failed");
  }

  return response.json();
}

/**
 * Update phone number for OAuth users
 */
export async function updatePhoneForOAuthUser(phone: string): Promise<any> {
  return api.put("/auth/google/update-phone", { phone });
}

/**
 * Link Google account to existing user
 */
export async function linkGoogleAccount(code: string): Promise<any> {
  return api.post("/auth/google/link", { code });
}

/**
 * Encode state parameter for OAuth
 */
export function encodeState(role: UserRole): string {
  const state = {
    role,
    nonce: Math.random().toString(36).substring(2) + Date.now().toString(36),
  };
  return btoa(JSON.stringify(state));
}

/**
 * Decode state parameter from OAuth
 */
export function decodeState(encodedState: string): { role: UserRole; nonce: string } {
  try {
    return JSON.parse(atob(encodedState));
  } catch {
    throw new Error("Invalid state parameter");
  }
}
