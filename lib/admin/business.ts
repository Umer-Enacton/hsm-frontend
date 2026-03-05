/**
 * Admin Business API Functions
 * API calls for admin to manage businesses
 */

import { api, API_ENDPOINTS } from "@/lib/api";
import type { Business } from "@/types/provider";

/**
 * Admin business list query parameters
 */
export interface AdminBusinessListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: "all" | "pending" | "verified";
  state?: string;
  categoryId?: number;
  sortBy?: "name" | "createdAt" | "rating" | "status";
  sortOrder?: "asc" | "desc";
}

/**
 * Business statistics
 */
export interface BusinessStats {
  total: number;
  pending: number;
  verified: number;
  suspended: number;
}

/**
 * Get all businesses with optional filters
 */
export async function getAllBusinesses(
  params: AdminBusinessListParams = {}
): Promise<{ businesses: Business[] }> {
  try {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.search) queryParams.append("search", params.search);
    if (params.status && params.status !== "all") queryParams.append("status", params.status);
    if (params.state) queryParams.append("state", params.state);
    if (params.categoryId) queryParams.append("categoryId", params.categoryId.toString());
    if (params.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);

    const endpoint = queryParams.toString()
      ? `${API_ENDPOINTS.BUSINESSES}?${queryParams.toString()}`
      : API_ENDPOINTS.BUSINESSES;

    return await api.get<{ businesses: Business[] }>(endpoint);
  } catch (error) {
    console.error("Error fetching businesses:", error);
    return { businesses: [] };
  }
}

/**
 * Get business by ID (admin view with full details)
 */
export async function getBusinessById(
  businessId: number
): Promise<{ business: Business }> {
  try {
    return await api.get<{ business: Business }>(
      API_ENDPOINTS.BUSINESS_BY_ID(businessId)
    );
  } catch (error) {
    console.error("Error fetching business:", error);
    throw error;
  }
}

/**
 * Verify business (admin action)
 */
export async function verifyBusiness(
  businessId: number
): Promise<{ message: string; business: Business }> {
  try {
    return await api.put<{ message: string; business: Business }>(
      API_ENDPOINTS.VERIFY_BUSINESS(businessId),
      {}
    );
  } catch (error) {
    console.error("Error verifying business:", error);
    throw error;
  }
}

/**
 * Unverify business (admin action)
 */
export async function unverifyBusiness(
  businessId: number
): Promise<{ message: string; business: Business }> {
  try {
    // Use update endpoint to set isVerified to false
    return await api.put<{ message: string; business: Business }>(
      API_ENDPOINTS.UPDATE_BUSINESS(businessId),
      { isVerified: false }
    );
  } catch (error) {
    console.error("Error unverifying business:", error);
    throw error;
  }
}

/**
 * Delete business (admin action)
 */
export async function deleteBusiness(
  businessId: number
): Promise<{ message: string }> {
  try {
    return await api.delete<{ message: string }>(
      API_ENDPOINTS.DELETE_BUSINESS(businessId)
    );
  } catch (error) {
    console.error("Error deleting business:", error);
    throw error;
  }
}

/**
 * Update business (admin action)
 */
export async function updateBusiness(
  businessId: number,
  data: Partial<Business>
): Promise<{ message: string; business: Business }> {
  try {
    return await api.put<{ message: string; business: Business }>(
      API_ENDPOINTS.UPDATE_BUSINESS(businessId),
      data
    );
  } catch (error) {
    console.error("Error updating business:", error);
    throw error;
  }
}

/**
 * Get business statistics for admin dashboard
 */
export async function getBusinessStats(): Promise<BusinessStats> {
  try {
    // For now, calculate from all businesses
    // TODO: Create dedicated stats endpoint in backend
    const result = await getAllBusinesses({ limit: 1000 });

    const stats: BusinessStats = {
      total: result.businesses.length,
      pending: result.businesses.filter(b => !b.isVerified).length,
      verified: result.businesses.filter(b => b.isVerified).length,
      suspended: 0, // No suspended state yet
    };

    return stats;
  } catch (error) {
    console.error("Error fetching business stats:", error);
    return {
      total: 0,
      pending: 0,
      verified: 0,
      suspended: 0,
    };
  }
}
