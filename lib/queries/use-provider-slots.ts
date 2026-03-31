'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, API_ENDPOINTS } from '@/lib/api';
import { QUERY_KEYS } from './query-keys';

export interface Slot {
  id: number;
  businessId: number;
  startTime: string; // Format: "HH:mm:ss"
  createdAt: string;
}

// ============================================================================
// Provider Slots Hook
// ============================================================================

/**
 * Fetch slots for a business
 * Slots change rarely (only when provider adds/removes time slots)
 */
export function useProviderSlots(businessId?: number) {
  return useQuery<Slot[]>({
    queryKey: [QUERY_KEYS.SLOTS, 'business', businessId],
    queryFn: async () => {
      if (!businessId) return [];
      const response = await api.get<any>(API_ENDPOINTS.SLOTS_PUBLIC(businessId));
      
      // Extract slots array from response (matches getAvailableSlots pattern in customer/api.ts)
      if (response && response.slots && Array.isArray(response.slots)) {
        return response.slots;
      }
      
      // Fallback: if response is directly an array
      if (Array.isArray(response)) {
        return response;
      }
      
      console.warn("⚠️ Unexpected slots response format in ProviderAvailabilityPage:", response);
      return [];
    },
    enabled: !!businessId,
    staleTime: 15 * 60 * 1000, // 15 minutes - slots rarely change
    gcTime: 30 * 60 * 1000, // 30 minutes cache
    // Ensure the data returned to components is ALWAYS an array
    select: (data) => Array.isArray(data) ? data : [],
  });
}

/**
 * Create a new time slot
 */
export function useCreateSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ businessId, slotData }: { businessId: number; slotData: { startTime: string } }) => {
      const response = await api.post(`/businesses/${businessId}/slots`, slotData);
      return response;
    },
    onSuccess: () => {
      // Invalidate slots queries
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SLOTS] });
      toast.success('Time slot added successfully');
    },
    onError: (error: any) => {
      console.error('Error creating slot:', error);
      toast.error(error.message || 'Failed to add time slot');
    },
  });
}

/**
 * Delete a time slot
 */
export function useDeleteSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ businessId, slotId }: { businessId: number; slotId: number }) => {
      await api.delete(API_ENDPOINTS.DELETE_SLOT(businessId, slotId));
      return { businessId, slotId };
    },
    onSuccess: () => {
      // Invalidate slots queries
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SLOTS] });
      toast.success('Time slot deleted successfully');
    },
    onError: (error: any) => {
      console.error('Error deleting slot:', error);
      toast.error(error.message || 'Failed to delete time slot');
    },
  });
}
