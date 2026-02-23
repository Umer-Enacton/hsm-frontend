/**
 * Category API Utilities
 * API functions for category management
 */

import { api, API_ENDPOINTS } from "./api";
import type {
  Category,
  CategoryFormData,
  CategoriesResponse,
  CategoryResponse,
  CategoryUpdateResponse,
} from "@/types/category";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

/**
 * Fetch all categories
 * @returns Promise<Category[]> - Array of categories
 */
export const getCategories = async (): Promise<Category[]> => {
  try {
    const response = await api.get<CategoriesResponse>(
      API_ENDPOINTS.CATEGORIES,
    );
    return response.categories;
  } catch (error: any) {
    throw new Error(error.message || "Failed to fetch categories");
  }
};

/**
 * Add a new category (Admin only)
 * @param data - Category form data (with optional image URL)
 * @returns Promise<Category> - Created category
 */
export const addCategory = async (
  data: CategoryFormData,
): Promise<Category> => {
  try {
    const response = await api.post<CategoryResponse>(
      API_ENDPOINTS.CATEGORIES,
      data,
    );
    return response.category;
  } catch (error: any) {
    throw new Error(error.message || "Failed to add category");
  }
};

/**
 * Update a category (Admin only)
 * @param id - Category ID to update
 * @param data - Category form data (with optional image URL)
 * @returns Promise<Category> - Updated category
 */
export const updateCategory = async (
  id: number,
  data: CategoryFormData,
): Promise<Category> => {
  try {
    console.log("Updating category:", id, data);
    const response = await api.put<CategoryUpdateResponse>(
      `/categories/${id}`,
      data,
    );
    return response.category;
  } catch (error: any) {
    console.error("Update category error:", error);
    throw new Error(error.message);
  }
};

/**
 * Delete a category (Admin only)
 * @param id - Category ID to delete
 * @returns Promise<void>
 */
export const deleteCategory = async (id: number): Promise<void> => {
  try {
    await api.delete(API_ENDPOINTS.CATEGORY_BY_ID(id));
  } catch (error: any) {
    throw new Error(error.message || "Failed to delete category");
  }
};

/**
 * Upload category image to Cloudinary
 * @param file - Image file to upload
 * @returns Promise<{ url: string; publicId: string }> - Upload response with URL and public ID
 */
export const uploadCategoryImage = async (
  file: File,
): Promise<{ url: string; publicId: string }> => {
  try {
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch(`${API_BASE_URL}/category-image`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: "Upload failed",
      }));
      throw new Error(errorData.message || "Failed to upload image");
    }

    const data = await response.json();

    // Handle backend response format: { success: true, message: "...", data: { url, publicId, ... } }
    if (data.success && data.data) {
      return {
        url: data.data.url,
        publicId: data.data.publicId,
      };
    }

    throw new Error(data.message || "Invalid response from server");
  } catch (error: any) {
    throw new Error(error.message || "Failed to upload image");
  }
};

/**
 * Validation helpers for category form
 */
export const categoryValidators = {
  /**
   * Validate category name
   */
  name: (name: string): { valid: boolean; error?: string } => {
    const trimmed = name.trim();

    if (trimmed.length === 0) {
      return { valid: false, error: "Category name is required" };
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
   * Validate category description
   */
  description: (description: string): { valid: boolean; error?: string } => {
    const trimmed = description.trim();

    if (trimmed.length === 0) {
      return { valid: false, error: "Description is required" };
    }

    if (trimmed.length < 10) {
      return {
        valid: false,
        error: "Description must be at least 10 characters",
      };
    }

    if (trimmed.length > 500) {
      return {
        valid: false,
        error: "Description must not exceed 500 characters",
      };
    }

    return { valid: true };
  },

  /**
   * Validate image file
   */
  image: (
    file: File | null | undefined,
  ): { valid: boolean; error?: string } => {
    if (!file) {
      return { valid: true }; // Image is optional
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      return { valid: false, error: "Please select an image file" };
    }

    // Check file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return { valid: false, error: "Image size must be less than 5MB" };
    }

    return { valid: true };
  },
};
