/**
 * Category Types
 * Type definitions for category management
 */

/**
 * Category object from backend
 */
export interface Category {
  id: number;
  name: string;
  description: string;
  image?: string | null; // Cloudinary URL for category image
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Form data for adding/editing category
 */
export interface CategoryFormData {
  name: string;
  description: string;
  image?: string | null; // Image URL (optional)
}

/**
 * Form data with file upload for adding/editing category
 */
export interface CategoryFormWithImage {
  name: string;
  description: string;
  imageFile?: File | null; // File object for upload
}

/**
 * Response from GET /categories
 */
export interface CategoriesResponse {
  categories: Category[];
}

/**
 * Response from POST /categories
 */
export interface CategoryResponse {
  message: string;
  category: Category;
}

/**
 * Response from PUT /categories/:id
 */
export interface CategoryUpdateResponse {
  message: string;
  category: Category;
}

/**
 * Validation errors for category form
 */
export interface CategoryFormErrors {
  name?: string;
  description?: string;
  image?: string;
}

/**
 * Backend upload response (from /api/upload/* endpoints)
 */
export interface BackendUploadResponse {
  success: boolean;
  message: string;
  data: {
    url: string;
    publicId: string;
    width: number;
    height: number;
  };
}
