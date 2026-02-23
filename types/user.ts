/**
 * User Management Types
 * Type definitions for user management admin pages
 */

import { UserRole } from "./auth";

/**
 * Extended User type from backend
 * Matches the response from /users endpoint
 */
export interface AppUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  roleId: UserRole;
  avatar?: string | null; // Cloudinary URL for profile picture
  createdAt: string;
  updatedAt: string;
}

/**
 * Response from GET /users
 */
export interface UsersResponse {
  users: AppUser[];
}

/**
 * Response from GET /users/:id
 */
export interface UserResponse {
  user: AppUser;
}

/**
 * Form data for editing user
 */
export interface UserEditFormData {
  name: string;
  email: string;
  phone: string;
}

/**
 * Client-side filters for user list
 */
export interface UserFilters {
  role: UserRole | "all";
  search: string; // Search by name or email
}

/**
 * User display data with computed fields
 */
export interface UserDisplayData extends AppUser {
  initials: string;
  roleLabel: string;
}
