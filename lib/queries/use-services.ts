import { useQuery } from "@tanstack/react-query";
import { getServices, getServiceById, getAvailableSlots } from "@/lib/customer/api";
import { QUERY_KEYS } from "./query-keys";
import type { ServiceFilters, ServiceDetails, Slot } from "@/types/customer";

/**
 * Services list with filters
 * Services list rarely changes, only when providers add/update services
 */
export function useServices(filters?: ServiceFilters) {
  return useQuery({
    queryKey: [QUERY_KEYS.SERVICES, "list", filters || {}],
    queryFn: async () => {
      const result = await getServices(filters);
      return {
        services: result.data || [],
        total: result.total || 0,
      };
    },
    staleTime: 15 * 60 * 1000, // 15 minutes - services list rarely changes
    gcTime: 60 * 60 * 1000, // 1 hour cache
  });
}

/**
 * Single service details
 * Service details change even less frequently
 */
export function useService(serviceId: number) {
  return useQuery({
    queryKey: [QUERY_KEYS.SERVICES, "detail", serviceId],
    queryFn: () => getServiceById(serviceId),
    enabled: !!serviceId,
    staleTime: 30 * 60 * 1000, // 30 minutes - service details rarely change
    gcTime: 60 * 60 * 1000, // 1 hour cache
  });
}

/**
 * Available slots for booking
 * Slots can get booked frequently, so shorter cache time
 * But we don't need to auto-refetch constantly
 */
export function useServiceSlots(
  businessId: number,
  date?: string,
  serviceId?: number
) {
  return useQuery({
    queryKey: [QUERY_KEYS.SLOTS, businessId, date || "all", serviceId || "all"],
    queryFn: () => getAvailableSlots(businessId, date, serviceId),
    enabled: !!businessId,
    staleTime: 2 * 60 * 1000, // 2 minutes - slots can get booked
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    // Removed refetchInterval - only refetch when user manually refreshes or revisits
  });
}
