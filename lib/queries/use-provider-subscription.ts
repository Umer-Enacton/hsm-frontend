import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, API_ENDPOINTS } from "@/lib/api";

// Query keys
export const SUBSCRIPTION_QUERY_KEYS = {
  all: ["provider-subscription"] as const,
  plans: ["subscription-plans"] as const,
  current: ["provider-subscription", "current"] as const,
};

// Types
export interface Plan {
  id: number;
  name: string;
  description: string | null;
  monthlyPrice: number;
  yearlyPrice: number;
  trialDays: number;
  platformFeePercentage: number;
  maxServices: number;
  maxBookingsPerMonth: number | null;
  prioritySupport: boolean;
  analyticsAccess: boolean;
  benefits: string[] | null;
  features: {
    allowedRoutes?: string[];
    allowedGraphs?: string[];
  } | null;
}

export interface Subscription {
  id: number;
  planId: number;
  planName: string;
  planDescription: string | null;
  planMonthlyPrice: number;
  planYearlyPrice: number;
  planTrialDays: number;
  planPlatformFeePercentage: number;
  planMaxServices: number;
  planMaxBookingsPerMonth: number | null;
  planPrioritySupport: boolean;
  planAnalyticsAccess: boolean;
  planBenefits: string[] | null;
  planFeatures: {
    allowedRoutes?: string[];
    allowedGraphs?: string[];
  } | null;
  status: string;
  startDate: string;
  endDate: string | null;
  trialEndDate: string | null;
  billingCycle: string;
  autoRenew: boolean;
  cancelAtPeriodEnd: boolean;
  razorpaySubscriptionId: string | null;
  isTrial: boolean;
  usage?: {
    currentMonthBookings: number;
    maxBookings: number | null;
    remainingBookings: number | null;
    limitReached: boolean;
  };
}

/**
 * Fetch all available subscription plans
 */
export function useSubscriptionPlans() {
  return useQuery<Plan[]>({
    queryKey: [SUBSCRIPTION_QUERY_KEYS.plans],
    queryFn: async () => {
      const plansResponse = await api.get<{ message: string; data: Plan[] }>(
        API_ENDPOINTS.SUBSCRIPTION_PLANS,
      );
      if (plansResponse && plansResponse.data) {
        const parsedPlans = plansResponse.data.map((plan) => ({
          ...plan,
          features: plan.features || null,
        }));
        parsedPlans.sort((a, b) => a.monthlyPrice - b.monthlyPrice);
        return parsedPlans;
      }
      return [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Fetch current provider subscription
 */
export function useCurrentSubscription() {
  return useQuery<Subscription | null>({
    queryKey: [SUBSCRIPTION_QUERY_KEYS.current],
    queryFn: async () => {
      const subResponse = await api.get<{
        message: string;
        data: Subscription | null;
      }>(API_ENDPOINTS.PROVIDER_SUBSCRIPTION_CURRENT);
      
      if (subResponse && subResponse.data) {
        return {
          ...subResponse.data,
          planFeatures: subResponse.data.planFeatures || null,
        };
      }
      return null;
    },
    staleTime: 1 * 60 * 1000, // subscriptions data shouldn't be too stale
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * Clear pending subscriptions on load
 */
export function useCleanupSubscriptions() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      return await api.get(API_ENDPOINTS.PROVIDER_SUBSCRIPTION_CLEANUP);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SUBSCRIPTION_QUERY_KEYS.current] });
    }
  });
}
