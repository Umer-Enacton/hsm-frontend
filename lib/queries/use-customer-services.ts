"use client";

import { useQuery } from "@tanstack/react-query";
import { api, API_ENDPOINTS } from "@/lib/api";
import { QUERY_KEYS } from "./query-keys";

// ============================================================================
// Types
// ============================================================================

export interface Category {
  id: number;
  name: string;
  description?: string;
  image?: string;
}

export interface CustomerService {
  id: number;
  name: string;
  description: string;
  price: number;
  rating?: number;
  totalReviews?: number;
  estimateDuration?: number;
  image?: string;
  imageUrl?: string;
  provider?: {
    id?: number;
    businessName?: string;
    isVerified?: boolean;
    city?: string;
    state?: string;
  };
}

export interface ServicesResponse {
  data: CustomerService[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ServiceFilters {
  state?: string;
  city?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

// ============================================================================
// Customer Categories Hook
// ============================================================================

/**
 * Hook to fetch all categories
 * Categories change rarely, so cache for 30 minutes
 */
export function useCategories() {
  return useQuery<{ categories: Category[] }>({
    queryKey: [QUERY_KEYS.CATEGORIES, "list"],
    queryFn: async () => {
      const response = await api.get<{ categories: Category[] }>(
        API_ENDPOINTS.CATEGORIES,
      );
      return response;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - categories rarely change
    gcTime: 60 * 60 * 1000, // 1 hour cache
  });
}

// ============================================================================
// Customer Services Hook
// ============================================================================

/**
 * Hook to fetch services with optional filters
 * Uses the getServices API function with proper caching
 */
export function useCustomerServices(
  filters?: ServiceFilters,
  page = 1,
  limit = 20,
) {
  // Build query params - use snake_case for backend compatibility
  const params = new URLSearchParams();
  if (filters?.state) params.append("state", filters.state);
  if (filters?.city) params.append("city", filters.city);
  if (filters?.categoryId)
    params.append("category_id", filters.categoryId.toString());
  if (filters?.minPrice)
    params.append("min_price", filters.minPrice.toString());
  if (filters?.maxPrice)
    params.append("max_price", filters.maxPrice.toString());
  if (filters?.search) params.append("search", filters.search);
  params.append("page", page.toString());
  params.append("limit", limit.toString());

  const queryString = params.toString();

  return useQuery<ServicesResponse>({
    queryKey: [QUERY_KEYS.SERVICES, "list", filters, page],
    queryFn: async () => {
      const url =
        API_ENDPOINTS.SERVICES + (queryString ? `?${queryString}` : "");
      // Backend returns { services: [...], pagination: { ... } }
      const response = await api.get<{
        services: CustomerService[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>(url);
      return {
        data: response.services || [],
        pagination: response.pagination || {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    },
    staleTime: 3 * 60 * 1000, // 3 minutes - services can be filtered/booked
    gcTime: 10 * 60 * 1000, // 10 minutes cache
  });
}

// ============================================================================
// Customer Service by ID Hook
// ============================================================================

/**
 * Hook to fetch a single service by ID
 * Service details change rarely, so cache for 15 minutes
 */
export function useCustomerService(serviceId: number) {
  return useQuery<CustomerService>({
    queryKey: [QUERY_KEYS.SERVICES, "detail", serviceId],
    queryFn: async () => {
      const response = await api.get<CustomerService>(
        API_ENDPOINTS.SERVICE_BY_ID(serviceId),
      );
      return response;
    },
    enabled: !!serviceId,
    staleTime: 15 * 60 * 1000, // 15 minutes - service details change rarely
    gcTime: 30 * 60 * 1000,
  });
}
