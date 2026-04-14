import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, API_ENDPOINTS } from "@/lib/api";
import { QUERY_KEYS } from "./query-keys";

export interface StaffPayoutSummary {
  staffId: number;
  staffName: string;
  staffEmail: string;
  staffAvatar?: string | null;
  employeeId?: string;
  upiId?: string;
  bankAccount?: string;
  totalPending: number;
  payoutCount: number;
}

export interface PayoutTotals {
  totalPendingAmount: number;
  totalPaidAmount: number;
  pendingCount: number;
}

export interface StaffPayoutSummaryResponse {
  pendingPayouts: StaffPayoutSummary[];
  totals: PayoutTotals;
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get provider staff payout summary
 */
export function useProviderStaffPayoutSummary() {
  return useQuery({
    queryKey: [QUERY_KEYS.STAFF_PAYOUTS, "provider-summary"],
    queryFn: async (): Promise<StaffPayoutSummaryResponse> => {
      const response = await api.get<{ message: string; data: StaffPayoutSummaryResponse }>(
        API_ENDPOINTS.STAFF_PAYOUTS_PROVIDER_SUMMARY,
      );
      return response?.data || { pendingPayouts: [], totals: { totalPendingAmount: 0, totalPaidAmount: 0, pendingCount: 0 } };
    },
    refetchOnWindowFocus: true,
    staleTime: 1 * 60 * 1000, // 1 minute - payout status changes frequently
    gcTime: 5 * 60 * 1000, // 5 minutes cache
    retry: false,
  });
}

/**
 * Get staff earnings (for staff view)
 */
export function useStaffEarnings() {
  return useQuery({
    queryKey: [QUERY_KEYS.STAFF_PAYOUTS, "my-earnings"],
    queryFn: async () => {
      const response = await api.get<{ message: string; data: any }>(
        API_ENDPOINTS.STAFF_PAYOUTS_MY_EARNINGS,
      );
      return response?.data || null;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: false,
  });
}

/**
 * Get staff payout history (for staff view)
 */
export function useStaffPayouts() {
  return useQuery({
    queryKey: [QUERY_KEYS.STAFF_PAYOUTS, "my-payouts"],
    queryFn: async () => {
      const response = await api.get<{ message: string; data: any }>(
        API_ENDPOINTS.STAFF_PAYOUTS_MY_PAYOUTS,
      );
      return response?.data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: false,
  });
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Process provider staff payout (mark as paid)
 */
export function useProcessProviderStaffPayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (staffId: number) =>
      api.post(API_ENDPOINTS.STAFF_PAYOUTS_PROVIDER_PROCESS, { staffId }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.STAFF_PAYOUTS, "provider-summary"],
      });
      toast.success("Payout marked as paid successfully");
    },
    onError: (error: any) => {
      console.error("Error processing payout:", error);
      toast.error(error.message || "Failed to process payout");
    },
  });
}

/**
 * Process staff payout (admin/provider action)
 */
export function useProcessStaffPayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (staffIds: number[]) =>
      api.post(API_ENDPOINTS.STAFF_PAYOUTS_PROCESS, { staffIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.STAFF_PAYOUTS],
      });
      toast.success("Payouts processed successfully");
    },
    onError: (error: any) => {
      console.error("Error processing payouts:", error);
      toast.error(error.message || "Failed to process payouts");
    },
  });
}
