/**
 * Profile API Utilities
 * API functions and validators for user profile management
 */

import { api } from "./api";
import type { ProfileUpdateData } from "@/types/profile";
import type { User } from "@/types/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

/**
 * Get current user profile
 * @returns Promise<User> - Current user data
 */
export const getCurrentProfile = async (): Promise<User> => {
  try {
    const response = await api.get<{ user: User }>("/user/profile");
    return response.user;
  } catch (error: any) {
    throw new Error(error.message || "Failed to fetch profile");
  }
};

/**
 * Update user profile
 * @param data - Profile update data
 * @returns Promise<User> - Updated user data
 */
export const updateProfile = async (data: ProfileUpdateData): Promise<User> => {
  try {
    const response = await api.put<{ message: string; user: User }>(
      "/users",
      data,
    );
    return response.user;
  } catch (error: any) {
    throw new Error(error.message || "Failed to update profile");
  }
};

/**
 * Upload avatar to Cloudinary
 * @param file - Image file to upload
 * @returns Promise<{ url: string; publicId: string }> - Upload response with URL and public ID
 */
export const uploadAvatar = async (
  file: File,
): Promise<{ url: string; publicId: string }> => {
  console.log("⚠️⚠️⚠️ [API] uploadAvatar CALLED - This should ONLY happen on submit!", file.name);

  try {
    const formData = new FormData();
    formData.append("avatar", file);

    const response = await fetch(`${API_BASE_URL}/avatar`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: "Upload failed",
      }));
      throw new Error(errorData.message || "Failed to upload avatar");
    }

    const data = await response.json();

    // Handle backend response format: { success: true, message: "...", data: { url, publicId, ... } }
    if (data.success && data.data) {
      console.log("✅ [API] uploadAvatar SUCCESS", data.data.url);
      return {
        url: data.data.url,
        publicId: data.data.publicId,
      };
    }

    throw new Error(data.message || "Invalid response from server");
  } catch (error: any) {
    console.error("❌ [API] uploadAvatar FAILED", error);
    throw new Error(error.message || "Failed to upload avatar");
  }
};

/**
 * Validators for profile form
 */
export const profileValidators = {
  /**
   * Validate name
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
   * Validate phone
   */
  phone: (phone: string): { valid: boolean; error?: string } => {
    const trimmed = phone.trim();
    if (trimmed.length === 0) {
      return { valid: false, error: "Phone is required" };
    }
    const phoneRegex =
      /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
    if (!phoneRegex.test(trimmed)) {
      return { valid: false, error: "Please enter a valid phone number" };
    }
    return { valid: true };
  },

  /**
   * Validate avatar file
   */
  avatar: (
    file: File | null | undefined,
  ): { valid: boolean; error?: string } => {
    if (!file) {
      return { valid: true }; // Avatar is optional
    }
    if (!file.type.startsWith("image/")) {
      return { valid: false, error: "Please select an image file" };
    }
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { valid: false, error: "Image size must be less than 5MB" };
    }
    return { valid: true };
  },
};

/**
 * Validators for password form
 */
export const passwordValidators = {
  /**
   * Validate current password
   */
  currentPassword: (password: string): { valid: boolean; error?: string } => {
    if (!password || password.length === 0) {
      return { valid: false, error: "Current password is required" };
    }
    return { valid: true };
  },

  /**
   * Validate new password
   */
  newPassword: (password: string): { valid: boolean; error?: string } => {
    if (!password || password.length === 0) {
      return { valid: false, error: "New password is required" };
    }
    if (password.length < 8) {
      return { valid: false, error: "Password must be at least 8 characters" };
    }
    return { valid: true };
  },

  /**
   * Validate confirm password
   */
  confirmPassword: (
    confirmPassword: string,
    newPassword: string,
  ): { valid: boolean; error?: string } => {
    if (!confirmPassword || confirmPassword.length === 0) {
      return { valid: false, error: "Please confirm your password" };
    }
    if (confirmPassword !== newPassword) {
      return { valid: false, error: "Passwords do not match" };
    }
    return { valid: true };
  },
};
