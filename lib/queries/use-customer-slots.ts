"use client";

import { useQuery } from "@tanstack/react-query";
import { api, API_ENDPOINTS } from "@/lib/api";
import { QUERY_KEYS } from "./query-keys";

// ============================================================================
// Types
// ============================================================================

export interface Slot {
  id: number;
  businessId: number;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface Feedback {
  id: number;
  rating: number;
  comments: string;
  createdAt: string;
  customer?: {
    name: string;
    avatar?: string;
  };
  userId?: number;
  user?: {
    name?: string;
    avatar?: string;
    profile_image?: string;
  };
}

// ============================================================================
// Service Slots Hook
// ============================================================================

/**
 * Hook to fetch available slots for a business
 * Slots change frequently, so cache for only 2 minutes
 */
export function useBusinessSlots(
  businessId?: number,
  date?: string,
  serviceId?: number,
) {
  return useQuery<Slot[]>({
    queryKey: [QUERY_KEYS.SLOTS, "business", businessId, date, serviceId],
    queryFn: async () => {
      if (!businessId) return [];

      const params = new URLSearchParams();
      if (date) params.append("date", date);
      if (serviceId) params.append("serviceId", serviceId.toString());

      const url =
        API_ENDPOINTS.SLOTS_PUBLIC(businessId) +
        (params.toString() ? `?${params.toString()}` : "");

      const response = await api.get<any>(url);

      // Handle both formats: { slots: [] } and direct array
      if (response && response.slots && Array.isArray(response.slots)) {
        return response.slots;
      }
      return Array.isArray(response) ? response : [];
    },
    enabled: !!businessId,
    staleTime: 60 * 1000, // 2 minutes - slot availability changes
    gcTime: 5 * 60 * 1000,
  });
}

// ============================================================================
// Service Feedback Hook
// ============================================================================

/**
 * Hook to fetch feedback for a service
 * Feedback changes moderately, so cache for 10 minutes
 */
export function useServiceFeedback(serviceId?: number, limit = 10) {
  return useQuery<Feedback[]>({
    queryKey: [QUERY_KEYS.FEEDBACK, "service", serviceId, limit],
    queryFn: async () => {
      if (!serviceId) return [];

      const response = await api.get<any>(
        API_ENDPOINTS.FEEDBACK_BY_SERVICE(serviceId),
      );

      const feedbackData = Array.isArray(response)
        ? response
        : response?.feedback || response?.data || [];

      return feedbackData.slice(0, limit);
    },
    enabled: !!serviceId,
    staleTime: 10 * 60 * 1000, // 10 minutes - feedback changes moderately
    gcTime: 30 * 60 * 1000,
  });
}
