import { useQuery } from "@tanstack/react-query";
import { getServices, getServiceById, getAvailableSlots } from "@/lib/customer/api";
import { queryKeys } from "./query-keys";
import type { ServiceFilters, ServiceDetails, Slot } from "@/types/customer";

export function useServices(filters?: ServiceFilters) {
  return useQuery({
    queryKey: queryKeys.services.list(filters || {}),
    queryFn: async () => {
      const result = await getServices(filters);
      return {
        services: result.data || [],
        total: result.total || 0,
      };
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}

export function useService(serviceId: number) {
  return useQuery({
    queryKey: queryKeys.services.detail(serviceId),
    queryFn: () => getServiceById(serviceId),
    enabled: !!serviceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useServiceSlots(
  businessId: number,
  date?: string,
  serviceId?: number
) {
  return useQuery({
    queryKey: queryKeys.slots.forBusiness(businessId, date, serviceId),
    queryFn: () => getAvailableSlots(businessId, date, serviceId),
    enabled: !!businessId,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000, // Auto-refetch every minute
  });
}
