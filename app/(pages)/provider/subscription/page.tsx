"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Info,
  Loader2,
  XCircle,
  ChevronRight,
  Star,
  Zap,
  Shield,
  BarChart3,
  Sparkles,
  CheckCircle2,
  Clock,
  Ban,
} from "lucide-react";
import { toast } from "sonner";
import { api, API_ENDPOINTS, API_BASE_URL } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SubscriptionCheckoutModal } from "@/components/provider/subscription/SubscriptionCheckoutModal";
import { StatusBadge } from "@/components/admin/shared";

interface Plan {
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

interface Subscription {
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
  usage?: {
    currentMonthBookings: number;
    maxBookings: number | null;
    remainingBookings: number | null;
    limitReached: boolean;
  };
}

interface PricingCardProps {
  plan: Plan;
  isActive: boolean;
  isTrialEligible: boolean;
  subscription: Subscription | null;
  billingCycle: "monthly" | "yearly"; // New prop for billing cycle
  onPurchase: (
    planId: number,
    billingCycle: "monthly" | "yearly",
    startTrial?: boolean,
  ) => void;
  onCancel: () => void;
  onToggleAutoRenew: () => void;
  onBuyNow?: (plan: Plan, billingCycle: "monthly" | "yearly") => void; // Updated signature
}

function PricingCard({
  plan,
  isActive,
  isTrialEligible,
  subscription,
  billingCycle,
  onPurchase,
  onCancel,
  onToggleAutoRenew,
  onBuyNow,
}: PricingCardProps) {
  const isInTrial =
    subscription?.status === "trial" && subscription?.trialEndDate;
  const isCancelAtEnd = subscription?.cancelAtPeriodEnd;

  // Calculate remaining days - for trial or when auto-renew is disabled
  const daysRemaining = useMemo(() => {
    // For trial subscriptions
    if (subscription?.status === "trial" && subscription?.trialEndDate) {
      const trialEnd = new Date(subscription.trialEndDate);
      const now = new Date();
      const diff = trialEnd.getTime() - now.getTime();
      return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }
    // For active subscriptions with an end date
    if ((subscription?.status === "active" || subscription?.status === "trial") &&
        subscription?.endDate) {
      const endDate = new Date(subscription.endDate);
      const now = new Date();
      const diff = endDate.getTime() - now.getTime();
      return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }
    return 0;
  }, [subscription?.status, subscription?.trialEndDate, subscription?.endDate]);

  const hasTrial = plan.trialDays > 0;
  const planNameUpper = plan.name.toUpperCase();

  const planLevel =
    planNameUpper === "FREE"
      ? "STARTER"
      : planNameUpper === "PRO"
        ? "GROWTH"
        : "SCALE";

  // Badge logic
  let topBadge = null;
  if (planNameUpper === "PRO") {
    topBadge = (
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
        <span className="bg-[#E6E6FA] text-[#483D8B] px-3 py-1 rounded-full text-xs font-medium border border-[#D8BFD8]/50 shadow-sm">
          Most popular
        </span>
      </div>
    );
  } else if (planNameUpper === "PREMIUM") {
    topBadge = (
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
        <span className="bg-[#FDF5E6] text-[#8B4513] px-3 py-1 rounded-full text-xs font-medium border border-[#FFE4B5]/50 shadow-sm">
          Best value
        </span>
      </div>
    );
  }

  // Border style
  const cardBorder =
    planNameUpper === "PRO"
      ? "border-indigo-500 shadow-lg dark:shadow-none"
      : "border-zinc-200 dark:border-zinc-800";

  // Fee color
  const feeColor =
    plan.platformFeePercentage <= 5
      ? "text-green-600 dark:text-green-500"
      : plan.platformFeePercentage <= 10
        ? "text-amber-600 dark:text-amber-500"
        : "text-red-600 dark:text-red-500";

  return (
    <Card
      className={`relative p-0 gap-0 flex flex-col rounded-xl border ${cardBorder} bg-white dark:bg-[#2D2D2D] transition-all duration-300 h-full text-zinc-900 dark:text-white/90 shadow-none`}
    >
      {topBadge}

      {/* Trial notification for active plan */}
      {isInTrial && isActive && (
        <div className="absolute -top-3 right-4 z-10">
          <span className="bg-purple-600 text-white px-2 py-0.5 rounded text-[10px] font-bold shadow-sm">
            {daysRemaining} Days Left
          </span>
        </div>
      )}

      {/* For active subscriptions with remaining days (show in right corner) */}
      {isActive && !isInTrial && daysRemaining > 0 && (
        <div className="absolute -top-3 right-4 z-10">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold shadow-sm flex items-center gap-1 ${
            isCancelAtEnd || !subscription?.autoRenew
              ? "bg-orange-600 text-white"
              : "bg-blue-600 text-white"
          }`}>
            <Clock className="h-2.5 w-2.5" />
            {daysRemaining} Days Left
          </span>
        </div>
      )}

      {/* Active badge for current plan */}
      {isActive && (
        <div className="absolute -top-3 left-4 z-10">
          <span className="bg-green-600 text-white px-2 py-0.5 rounded text-[10px] font-bold shadow-sm flex items-center gap-1">
            <Check className="h-2.5 w-2.5" />
            Active
          </span>
        </div>
      )}

      <CardHeader className="pb-2 pt-5">
        <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 tracking-wider">
          {planLevel}
        </p>
        <CardTitle className="text-2xl font-medium text-zinc-900 dark:text-white">
          {plan.name}
        </CardTitle>

        {/* Price display based on billingCycle (Free plan always shows ₹0) */}
        {plan.monthlyPrice === 0 ? (
          <div className="flex items-end gap-1 mb-3">
            <span className="text-4xl font-bold text-zinc-900 dark:text-white leading-none">
              ₹0
            </span>
            <span className="text-zinc-500 dark:text-zinc-400 text-sm mb-1">
              /month
            </span>
          </div>
        ) : billingCycle === "monthly" ? (
          <>
            <div className="flex items-end gap-1 mb-3">
              <span className="text-4xl font-bold text-zinc-900 dark:text-white leading-none">
                ₹{plan.monthlyPrice / 100}
              </span>
              <span className="text-zinc-500 dark:text-zinc-400 text-sm mb-1">
                /month
              </span>
            </div>
            <div className="h-4">
              {plan.yearlyPrice > plan.monthlyPrice && (
                <p className="text-[13px] text-zinc-500 dark:text-zinc-400">
                  Yearly ₹{plan.yearlyPrice / 100}{" "}
                  <span className="text-green-600 dark:text-green-500 ml-1">
                    Save ₹{(plan.yearlyPrice - plan.monthlyPrice * 12) / 100}
                  </span>
                </p>
              )}
            </div>
          </>
        ) : (
          // Yearly billing
          <div className="flex items-end gap-1 mb-3">
            <span className="text-4xl font-bold text-zinc-900 dark:text-white leading-none">
              ₹{plan.yearlyPrice / 100}
            </span>
            <span className="text-zinc-500 dark:text-zinc-400 text-sm mb-1">
              /year
            </span>
          </div>
        )}
      </CardHeader>

      <div className="w-full h-px bg-zinc-200 dark:bg-zinc-800 mb-6"></div>

      <CardContent className="flex flex-col flex-1 pb-5 pt-0 space-y-0">
        {/* Platform Fee Box */}
        <div className="flex items-center justify-between rounded-md bg-zinc-50 dark:bg-[#252525] border border-zinc-200 dark:border-zinc-800 p-3 mb-6">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Platform fee
          </span>
          <span className={`text-sm font-medium ${feeColor}`}>
            {plan.platformFeePercentage}%
          </span>
        </div>

        {/* Benefits list */}
        <div className="flex-1 space-y-2 mb-4">
          {plan.benefits &&
            plan.benefits.map((benefit, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300"
              >
                <CheckCircle2 className="h-5 w-5 text-[#E6FEED] fill-green-500 -mt-px flex-shrink-0" />
                <span>{benefit}</span>
              </div>
            ))}
        </div>

        {/* Limits Table */}
        <div className="rounded-lg bg-zinc-50 dark:bg-[#252525] border border-zinc-200 dark:border-zinc-800 p-4 space-y-2 text-sm mt-auto">
          <div className="flex justify-between items-center text-zinc-600 dark:text-zinc-300">
            <span>Services</span>
            <span className="font-semibold text-zinc-900 dark:text-white">
              {plan.maxServices === -1 ? "Unlimited" : plan.maxServices}
            </span>
          </div>
          <div className="flex justify-between items-center text-zinc-600 dark:text-zinc-300">
            <span>Bookings / mo</span>
            <span className="font-semibold text-zinc-900 dark:text-white">
              {plan.maxBookingsPerMonth === -1
                ? "Unlimited"
                : plan.maxBookingsPerMonth || "100"}
            </span>
          </div>
          <div className="flex justify-between items-center text-zinc-600 dark:text-zinc-300">
            <span>Priority support</span>
            <span className="font-semibold text-zinc-900 dark:text-white">
              {plan.prioritySupport ? (
                <Check className="h-4 w-4" />
              ) : (
                <span className="text-zinc-400 dark:text-zinc-500">—</span>
              )}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col space-y-3 pb-6 pt-0 mt-auto items-stretch">
        {isActive ? (
          <div className="space-y-2 w-full">
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={onCancel}
                variant="outline"
                className="w-full border-zinc-200 dark:border-zinc-700 bg-transparent text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-zinc-800 hover:text-red-700 dark:hover:text-red-300"
              >
                {isInTrial || isCancelAtEnd ? "Cancel" : "Cancel Plan"}
              </Button>
              <Button
                onClick={onToggleAutoRenew}
                variant="outline"
                className="w-full border-zinc-200 dark:border-zinc-700 bg-transparent text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white"
              >
                {subscription?.autoRenew ? "Disable Auto" : "Auto Renew"}
              </Button>
            </div>
            {daysRemaining > 0 && (
              <p className="text-xs text-center text-zinc-500 dark:text-zinc-500">
                {subscription?.autoRenew && !isCancelAtEnd
                  ? `Renews in ${daysRemaining} days`
                  : `Expires in ${daysRemaining} days`
                }
              </p>
            )}
          </div>
        ) : plan.monthlyPrice === 0 ? (
          <div className="text-center text-sm text-zinc-500 dark:text-zinc-500 italic py-2 w-full">
            Included by default
          </div>
        ) : (
          <div className="flex flex-col gap-3 w-full">
            {hasTrial && isTrialEligible && (
              <Button
                onClick={() => onPurchase(plan.id, "monthly", true)}
                className="w-full bg-zinc-900 dark:bg-[#353535] text-white hover:bg-zinc-800 dark:hover:bg-[#404040] border border-transparent dark:border-zinc-700 shadow-md dark:shadow-none"
              >
                Start free trial
              </Button>
            )}
            <Button
              onClick={() => onBuyNow?.(plan, billingCycle)}
              className="w-full bg-zinc-900 dark:bg-[#353535] text-white hover:bg-zinc-800 dark:hover:bg-[#404040] border border-transparent dark:border-zinc-700 shadow-md dark:shadow-none"
            >
              Buy now
            </Button>
          </div>
        )}

        {plan.monthlyPrice > 0 && hasTrial && (
          <p className="text-xs text-center text-zinc-500 mt-2">
            7 days free · no card required
          </p>
        )}
      </CardFooter>
    </Card>
  );
}

export default function ProviderSubscriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Billing cycle state for pricing tabs
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  // State for Razorpay checkout modal
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [subscriptionToAuthorize, setSubscriptionToAuthorize] = useState<
    string | null
  >(null);

  // Fetch plans and subscription
  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch plans
      const plansResponse = await api.get<{ message: string; data: Plan[] }>(
        API_ENDPOINTS.SUBSCRIPTION_PLANS,
      );
      if (plansResponse && plansResponse.data) {
        // Backend already parses features JSON, no need to parse again
        const parsedPlans = plansResponse.data.map((plan) => ({
          ...plan,
          features: plan.features || null, // Already an object from backend
        }));
        // Sort by price
        parsedPlans.sort((a, b) => a.monthlyPrice - b.monthlyPrice);
        setPlans(parsedPlans);
      }

      // Fetch current subscription
      const subResponse = await api.get<{
        message: string;
        data: Subscription | null;
      }>(API_ENDPOINTS.PROVIDER_SUBSCRIPTION_CURRENT);
      if (subResponse && subResponse.data) {
        // Backend already parses features JSON, no need to parse again
        setSubscription({
          ...subResponse.data,
          planFeatures: subResponse.data.planFeatures || null, // Already an object from backend
        });
      }
    } catch (error: any) {
      console.error("Error fetching subscription data:", error);
      toast.error(error?.message || "Failed to load subscription data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Cleanup abandoned pending subscriptions on page load
    const cleanupSubscriptions = async () => {
      try {
        await api.get(API_ENDPOINTS.PROVIDER_SUBSCRIPTION_CLEANUP);
      } catch (err) {
        console.error("Error cleaning up subscriptions:", err);
      }
    };

    cleanupSubscriptions();
  }, []);

  // Check for success params - refetch data and show success message
  useEffect(() => {
    const success = searchParams.get("success");
    if (success) {
      // Refetch subscription data to get latest info
      fetchData();

      // Show appropriate success message
      if (success === "free") {
        toast.success("Free plan activated successfully!");
      } else if (success === "trial") {
        toast.success("Trial started successfully! Enjoy premium features.");
      } else if (success === "payment" || success === "upgrade") {
        toast.success("Subscription updated successfully!");
      }
    }
  }, [searchParams]);

  // Handle ?authorize= URL parameter - opens checkout modal
  useEffect(() => {
    const authorizeParam = searchParams.get("authorize");
    if (authorizeParam) {
      console.log("🔐 Authorize parameter found:", authorizeParam);
      setSubscriptionToAuthorize(authorizeParam);
      setShowCheckoutModal(true);

      // Clear the URL parameter without navigating
      const url = new URL(window.location.href);
      url.searchParams.delete("authorize");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  // Determine if eligible for trial (Free plan users or no subscription yet)
  const isTrialEligible = useMemo(() => {
    if (!subscription) return true; // No subscription yet - will have Free plan auto-assigned
    const planName = subscription.planName?.toUpperCase() || "";
    return planName === "FREE"; // Only Free plan users can start trial
  }, [subscription]);

  // Get Pro and Premium plans for first-time users
  const proPlan = useMemo(
    () => plans.find((p) => p.name.toUpperCase() === "PRO"),
    [plans],
  );
  const premiumPlan = useMemo(
    () => plans.find((p) => p.name.toUpperCase() === "PREMIUM"),
    [plans],
  );

  // Check if user is first-time (no subscription or on Free plan)
  const isFirstTimeUser = useMemo(() => {
    if (!subscription) return true; // No subscription yet
    return subscription.planName.toUpperCase() === "FREE";
  }, [subscription]);

  // Handle start trial
  const handleStartTrial = async (planId: number) => {
    await handlePurchase(planId, "monthly", true); // Explicitly pass true for trial
  };

  // Handle buy now click - directly purchase with selected billing cycle from tabs
  const handleBuyNowClick = async (plan: Plan, cycle: "monthly" | "yearly") => {
    await handlePurchaseWithRazorpay(plan.id, cycle);
  };

  // Handle purchase with Razorpay Subscription Links API (hosted page)
  const handlePurchaseWithRazorpay = async (
    planId: number,
    billingCycle: "monthly" | "yearly",
  ) => {
    setPurchasing(true);

    try {
      console.log(
        "🛒 Purchasing subscription via Subscription Link - plan:",
        planId,
        "cycle:",
        billingCycle,
      );

      // Use the new Subscription Link endpoint (creates Razorpay subscription with hosted page)
      const endpoint = API_ENDPOINTS.PROVIDER_SUBSCRIPTION_PURCHASE_LINK;

      const response = await api.post<any>(endpoint, { planId, billingCycle });

      console.log("🛒 Full response:", JSON.stringify(response, null, 2));

      // Handle redirect to Razorpay subscription link (hosted page)
      // Backend returns: { message, data: { redirectUrl, ... } }
      // api.post returns this directly (no extra wrapping)
      const redirectUrl = response.data?.redirectUrl;

      console.log("🛒 Extracted redirectUrl:", redirectUrl);

      if (redirectUrl) {
        console.log("✅ Redirecting to Razorpay hosted page:", redirectUrl);
        // Redirect to Razorpay subscription link (hosted checkout page)
        window.location.href = redirectUrl;
      } else {
        console.error("❌ No redirectUrl in response!");
        toast.error("Invalid response from server - no redirect URL found");
      }
    } catch (error: any) {
      console.error("Error purchasing subscription:", error);
      toast.error(error?.message || "Failed to purchase subscription");
    } finally {
      setPurchasing(false);
    }
  };

  // Handle payment success from checkout modal
  const handlePaymentSuccess = () => {
    console.log("✅ Payment successful, refreshing data...");
    setShowCheckoutModal(false);
    setSubscriptionToAuthorize(null);
    fetchData();
  };

  // Handle modal close (cleanup)
  const handleModalClose = () => {
    console.log("❌ Checkout modal closed");
    setShowCheckoutModal(false);
    setSubscriptionToAuthorize(null);
  };

  // Handle purchase
  const handlePurchase = async (
    planId: number,
    billingCycle: "monthly" | "yearly",
    startTrial?: boolean,
  ) => {
    setPurchasing(true);

    try {
      // Use payment link flow (creates subscription only after payment)
      const endpoint = API_ENDPOINTS.PROVIDER_SUBSCRIPTION_PURCHASE;

      const response = await api.post<any>(endpoint, {
        planId,
        billingCycle,
        startTrial,
      });

      console.log("🛒 Purchase response:", response);

      // Handle redirect URL (payment link checkout)
      // Backend returns: { message, data: { redirectUrl, ... } }
      if (response.data?.redirectUrl) {
        if (response.data.redirectUrl.startsWith("http")) {
          // Razorpay payment link - redirect to payment page
          window.location.href = response.data.redirectUrl;
          return;
        } else {
          // Internal redirect
          router.push(response.data.redirectUrl);
        }
      } else {
        toast.success("Subscription updated successfully");
        fetchData();
      }
    } catch (error: any) {
      console.error("Error purchasing subscription:", error);
      toast.error(error?.message || "Failed to purchase subscription");
    } finally {
      setPurchasing(false);
    }
  };

  // Handle cancel
  const handleCancel = async () => {
    setActionLoading("cancel");

    try {
      const data = await api.post<{ message: string }>(
        API_ENDPOINTS.PROVIDER_SUBSCRIPTION_CANCEL,
        {},
      );

      toast.success(
        data.message || "Subscription will be cancelled at period end",
      );
      fetchData();
    } catch (error: any) {
      console.error("Error cancelling subscription:", error);
      toast.error(error?.message || "Failed to cancel subscription");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle toggle auto-renew
  const handleToggleAutoRenew = async () => {
    setActionLoading("autoRenew");

    try {
      const data = await api.post<{ message: string }>(
        API_ENDPOINTS.PROVIDER_SUBSCRIPTION_TOGGLE_AUTO_RENEW,
        { enable: !subscription?.autoRenew },
      );

      toast.success(data.message || "Auto-renewal updated successfully");
      fetchData();
    } catch (error: any) {
      console.error("Error toggling auto-renewal:", error);
      toast.error(error?.message || "Failed to update auto-renewal");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Subscription Plans
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[500px] w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Find which plan is currently active
  const activePlanId = subscription?.planId;

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black tracking-tight">Choose Your Plan</h1>
        <p className="text-muted-foreground">
          Upgrade your business with powerful features and lower platform fees
        </p>
      </div>

      {/* Current Subscription Banner */}
      {subscription && (
        <Alert className="border-purple-200 bg-purple-50">
          <AlertDescription className="flex items-center justify-between">
            <div>
              <strong>Current Plan: {subscription.planName}</strong>
              {subscription.usage && subscription.usage.limitReached && (
                <>
                  {" "}
                  <span className="text-amber-600">
                    • Monthly booking limit reached!
                  </span>
                </>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/provider/dashboard")}
            >
              Go to Dashboard
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Pricing Cards */}
      {/* Billing Cycle Tabs */}
      <div className="flex justify-center">
        <Tabs
          value={billingCycle}
          onValueChange={(v) => setBillingCycle(v as "monthly" | "yearly")}
          className="w-fit"
        >
          <TabsList className="bg-muted/50 p-1 rounded-lg">
            <TabsTrigger
              value="monthly"
              className="px-6 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Monthly
            </TabsTrigger>
            <TabsTrigger
              value="yearly"
              className="px-6 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Yearly
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          // isActive = true only if subscription exists AND status is active/trial
          const isActive = !!(
            subscription &&
            (subscription.status === "active" || subscription.status === "trial") &&
            subscription.planId === plan.id
          );

          // Trial eligible if user is eligible AND plan has trial days AND not already active
          const planHasTrial = plan.trialDays > 0;
          const planTrialEligible =
            isTrialEligible && planHasTrial && !isActive;

          return (
            <PricingCard
              key={plan.id}
              plan={plan}
              isActive={isActive}
              isTrialEligible={planTrialEligible}
              subscription={subscription}
              billingCycle={billingCycle}
              onPurchase={handlePurchase}
              onCancel={handleCancel}
              onToggleAutoRenew={handleToggleAutoRenew}
              onBuyNow={handleBuyNowClick}
            />
          );
        })}
      </div>

      {/* Loading Overlay */}
      {(purchasing || actionLoading) && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#252525] rounded-xl p-6 flex items-center gap-4 shadow-xl border border-zinc-200 dark:border-zinc-800">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-900 dark:text-white" />
            <span className="font-medium text-zinc-900 dark:text-white">
              {purchasing
                ? "Processing..."
                : actionLoading === "cancel"
                  ? "Cancelling..."
                  : "Updating..."}
            </span>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* RAZORPAY CHECKOUT MODAL */}
      {/* Opens for subscription authorization */}
      {/* ============================================ */}
      <SubscriptionCheckoutModal
        isOpen={showCheckoutModal}
        subscriptionId={subscriptionToAuthorize}
        onSuccess={handlePaymentSuccess}
        onClose={handleModalClose}
      />
    </div>
  );
}
