/**
 * User API Utilities
 * API functions and validators for user management
 */

import { api } from "./api";
import type {
  AppUser,
  UsersResponse,
  UserResponse,
  UserEditFormData,
  UserFilters,
} from "@/types/user";

/**
 * Get all users (Admin only)
 * @returns Promise<AppUser[]> - Array of users without passwords
 */
export const getUsers = async (): Promise<AppUser[]> => {
  try {
    const response = await api.get<UsersResponse>("/users");
    return response.users;
  } catch (error: any) {
    throw new Error(error.message || "Failed to fetch users");
  }
};

/**
 * Get user by ID (Admin only)
 * @param id - User ID
 * @returns Promise<AppUser> - Single user without password
 */
export const getUserById = async (id: number): Promise<AppUser> => {
  try {
    const response = await api.get<UserResponse>(`/users/${id}`);
    return response.user;
  } catch (error: any) {
    throw new Error(error.message || "Failed to fetch user");
  }
};

/**
 * Delete user (Admin only)
 * @param id - User ID to delete
 * @returns Promise<void>
 */
export const deleteUser = async (id: number): Promise<void> => {
  try {
    await api.delete(`/users/${id}`);
  } catch (error: any) {
    throw new Error(error.message || "Failed to delete user");
  }
};

/**
 * Update current user profile
 * Note: This only updates own profile, not other users
 * @param data - User form data
 * @returns Promise<AppUser> - Updated user
 */
export const updateCurrentUser = async (
  data: UserEditFormData
): Promise<AppUser> => {
  try {
    const response = await api.put<UserResponse>("/users", data);
    return response.user;
  } catch (error: any) {
    throw new Error(error.message || "Failed to update profile");
  }
};

/**
 * Client-side filter users
 * Since backend doesn't support filtering, we filter on the client
 * @param users - Array of users to filter
 * @param filters - Filter criteria
 * @returns Filtered array of users
 */
export const filterUsers = (
  users: AppUser[],
  filters: UserFilters
): AppUser[] => {
  return users.filter((user) => {
    // Role filter
    if (filters.role !== "all" && user.roleId !== filters.role) {
      return false;
    }

    // Search filter (name or email)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase().trim();
      const matchesName = user.name.toLowerCase().includes(searchLower);
      const matchesEmail = user.email.toLowerCase().includes(searchLower);
      if (!matchesName && !matchesEmail) {
        return false;
      }
    }

    return true;
  });
};

/**
 * Validators for user forms
 */
export const userValidators = {
  /**
   * Validate user name
   */
  name: (name: string): { valid: boolean; error?: string } => {
    const trimmed = name.trim();

    if (trimmed.length === 0) {
      return { valid: false, error: "Name is required" };
    }

    if (trimmed.length < 2) {
      return { valid: false, error: "Name must be at least 2 characters" };
    }

    if (trimmed.length > 100) {
      return { valid: false, error: "Name must not exceed 100 characters" };
    }

    return { valid: true };
  },

  /**
   * Validate email
   */
  email: (email: string): { valid: boolean; error?: string } => {
    const trimmed = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (trimmed.length === 0) {
      return { valid: false, error: "Email is required" };
    }

    if (!emailRegex.test(trimmed)) {
      return { valid: false, error: "Please enter a valid email" };
    }

    return { valid: true };
  },

  /**
   * Validate phone number
   */
  phone: (phone: string): { valid: boolean; error?: string } => {
    const trimmed = phone.trim();

    if (trimmed.length === 0) {
      return { valid: false, error: "Phone is required" };
    }

    // Accept various phone formats: +1234567890, (123) 456-7890, 123-456-7890, etc.
    const phoneRegex =
      /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;

    if (!phoneRegex.test(trimmed)) {
      return { valid: false, error: "Please enter a valid phone number" };
    }

    return { valid: true };
  },
};

/**
 * Helper: Get user initials from name
 * @param name - User's full name
 * @returns 1-2 character initials
 */
export const getUserInitials = (name: string): string => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Helper: Get role label from roleId
 * @param roleId - User role ID
 * @returns Human-readable role label
 */
export const getRoleLabel = (roleId: number): string => {
  switch (roleId) {
    case 1:
      return "Customer";
    case 2:
      return "Provider";
    case 3:
      return "Admin";
    default:
      return "Unknown";
  }
};

/**
 * Helper: Get role color classes
 * @param roleId - User role ID
 * @returns Tailwind CSS classes for role badge
 */
export const getRoleColor = (roleId: number): string => {
  switch (roleId) {
    case 1:
      return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
    case 2:
      return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800";
    case 3:
      return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
  }
};
