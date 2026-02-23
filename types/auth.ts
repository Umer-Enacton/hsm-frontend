/**
 * Authentication Types
 * Type definitions for authentication-related API responses
 */

/**
 * User roles as defined in the backend
 */
export enum UserRole {
  CUSTOMER = 1,
  PROVIDER = 2,
  ADMIN = 3,
}

/**
 * User object from backend
 */
export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  roleId: UserRole;
  avatar?: string | null; // Cloudinary URL for profile picture
  createdAt?: string;
  updatedAt?: string;
}

/**
 * JWT token payload structure
 */
export interface TokenPayload {
  id: number;
  name: string;
  email: string;
  roleId: UserRole;
  iat?: number;
  exp?: number;
}

/**
 * Login response from backend
 */
export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

/**
 * Register response from backend
 */
export interface RegisterResponse {
  id: number;
  name: string;
  email: string;
  phone: string;
  role_id: number;
  created_at: string;
  message?: string;
  errors?: string[];
}

/**
 * Login request payload
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Register request payload
 */
export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  roleId?: UserRole; // Optional, defaults to Customer (1)
}

/**
 * Auth context type (for future use)
 */
export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/**
 * Stored auth data (for localStorage/sessionStorage)
 */
export interface StoredAuthData {
  token: string;
  user: User;
}
