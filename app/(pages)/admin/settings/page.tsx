"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IndianRupee, Wallet, Shield, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AdminSettingsSkeleton } from "@/components/admin/skeletons";
import { api, API_ENDPOINTS } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/queries/query-keys";

interface CancellationPolicySettings {
  refundPolicy: {
    above24h: number;
    above12h: number;
    above4h: number;
    above30min: number;
  };
}

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();

  // Queries
  const { data: platformSettings, isLoading: loadingPlatform } = useQuery({
    queryKey: [QUERY_KEYS.ADMIN_SETTINGS, "platform"],
    queryFn: async () => {
      const res = await api.get<{
        platformFeePercentage: number;
        minimumPayoutAmount: number;
      }>(API_ENDPOINTS.ADMIN_SETTINGS);
      // Map to rupees for UI state
      return { ...res, minBookingAmountUI: res.minimumPayoutAmount / 100 };
    },
  });

  const { data: policySettings, isLoading: loadingPolicy } = useQuery({
    queryKey: [QUERY_KEYS.ADMIN_SETTINGS, "cancellation_policy"],
    queryFn: async () => {
      return await api.get<CancellationPolicySettings>(
        API_ENDPOINTS.ADMIN_CANCELLATION_POLICY
      );
    },
  });

  // Local state for UI changes
  const [minBookingAmount, setMinBookingAmount] = useState(300);
  const [cancellationPolicy, setCancellationPolicy] = useState<CancellationPolicySettings>({
    refundPolicy: {
      above24h: 100,
      above12h: 75,
      above4h: 50,
      above30min: 25,
    },
  });

  // Sync original fetch with local state
  useEffect(() => {
    if (platformSettings) {
      setMinBookingAmount(platformSettings.minBookingAmountUI);
    }
  }, [platformSettings]);

  useEffect(() => {
    if (policySettings) {
      setCancellationPolicy(policySettings);
    }
  }, [policySettings]);

  // Mutations
  const updateSettingsMutation = useMutation({
    mutationFn: async (payload: { minBookingAmount: number }) => {
      await api.put(API_ENDPOINTS.ADMIN_SETTINGS, payload);
    },
    onSuccess: () => {
      toast.success("Platform settings updated successfully");
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_SETTINGS, "platform"] });
    },
    onError: (error: any) => {
      console.error("Error updating settings:", error);
      toast.error(error.response?.data?.message || "Failed to update settings");
    },
  });

  const updatePolicyMutation = useMutation({
    mutationFn: async (payload: { refundPolicy: CancellationPolicySettings["refundPolicy"] }) => {
      await api.put(API_ENDPOINTS.ADMIN_CANCELLATION_POLICY, payload);
    },
    onSuccess: () => {
      toast.success("Cancellation policy updated! All customers and providers have been notified.");
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN_SETTINGS, "cancellation_policy"] });
    },
    onError: (error: any) => {
      console.error("Error updating cancellation policy:", error);
      toast.error(error.response?.data?.message || "Failed to update cancellation policy");
    },
  });

  const handleSaveSettings = () => {
    if (minBookingAmount < 300 || minBookingAmount > 1000) {
      toast.error("Minimum payout must be between ₹300 and ₹1,000");
      return;
    }

    updateSettingsMutation.mutate({
      minBookingAmount: minBookingAmount * 100,
    });
  };

  const handleSaveCancellationPolicy = () => {
    updatePolicyMutation.mutate({
      refundPolicy: cancellationPolicy.refundPolicy,
    });
  };

  const handleReset = () => {
    setCancellationPolicy({
      refundPolicy: {
        above24h: 100,
        above12h: 75,
        above4h: 50,
        above30min: 25,
      },
    });
  };

  if (loadingPlatform || loadingPolicy) {
    return <AdminSettingsSkeleton />;
  }

  const exampleAmount = 500;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Platform Settings
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Configure payment and cancellation policies
          </p>
        </div>
      </div>

      {/* Minimum Payout Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-md w-fit">
              <Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1">
              <div>Minimum Payout Amount</div>
              <div className="text-sm font-normal text-muted-foreground">
                Minimum amount before processing provider payouts
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="p-2 bg-muted rounded-md w-fit">
              <IndianRupee className="h-5 w-5 text-muted-foreground" />
            </div>
            <Input
              type="number"
              min={300}
              max={1000}
              step={50}
              value={minBookingAmount}
              onChange={(e) => setMinBookingAmount(Number(e.target.value))}
              className="w-full sm:max-w-[200px]"
            />
            <div className="text-sm text-muted-foreground">
              Range: ₹300 - ₹1,000
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cancellation Policy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="p-2 bg-purple-50 dark:bg-purple-950/30 rounded-md w-fit">
              <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <div>Cancellation Policy</div>
              <div className="text-sm font-normal text-muted-foreground">
                Configure customer refund percentages based on cancellation timing
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Platform Fee Info - Read Only */}
          <div className="bg-muted/50 rounded-md p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Platform Fee</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Platform fee is based on the provider&apos;s subscription plan and cannot be changed here.
                  Different subscription tiers have different platform fee rates.
                </p>
              </div>
            </div>
          </div>

          {/* Refund Percentages */}
          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium">Customer Refund Percentages</Label>
              <p className="text-sm text-muted-foreground">
                Percentage of booking amount refunded to customer based on when they cancel
              </p>
            </div>

            {/* > 24 hours */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">More than 24 hours before</span>
                  <p className="text-xs text-muted-foreground">
                    Customer cancels more than 24 hours before the booking
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                    Full Refund
                  </Badge>
                  <span className="text-2xl font-bold text-emerald-600">
                    {cancellationPolicy.refundPolicy.above24h}%
                  </span>
                </div>
              </div>
              <Slider
                value={[cancellationPolicy.refundPolicy.above24h]}
                onValueChange={([value]) =>
                  setCancellationPolicy({
                    ...cancellationPolicy,
                    refundPolicy: { ...cancellationPolicy.refundPolicy, above24h: value },
                  })
                }
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
            </div>

            {/* > 12 hours */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">12-24 hours before</span>
                  <p className="text-xs text-muted-foreground">
                    Customer cancels between 12-24 hours before the booking
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-blue-600">
                    {cancellationPolicy.refundPolicy.above12h}%
                  </span>
                </div>
              </div>
              <Slider
                value={[cancellationPolicy.refundPolicy.above12h]}
                onValueChange={([value]) =>
                  setCancellationPolicy({
                    ...cancellationPolicy,
                    refundPolicy: { ...cancellationPolicy.refundPolicy, above12h: value },
                  })
                }
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
            </div>

            {/* > 4 hours */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">4-12 hours before</span>
                  <p className="text-xs text-muted-foreground">
                    Customer cancels between 4-12 hours before the booking
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-amber-600">
                    {cancellationPolicy.refundPolicy.above4h}%
                  </span>
                </div>
              </div>
              <Slider
                value={[cancellationPolicy.refundPolicy.above4h]}
                onValueChange={([value]) =>
                  setCancellationPolicy({
                    ...cancellationPolicy,
                    refundPolicy: { ...cancellationPolicy.refundPolicy, above4h: value },
                  })
                }
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
            </div>

            {/* 30 min - 4 hours */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">30 mins - 4 hours before</span>
                  <p className="text-xs text-muted-foreground">
                    Customer cancels between 30 mins and 4 hours before
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-rose-600">
                    {cancellationPolicy.refundPolicy.above30min}%
                  </span>
                </div>
              </div>
              <Slider
                value={[cancellationPolicy.refundPolicy.above30min]}
                onValueChange={([value]) =>
                  setCancellationPolicy({
                    ...cancellationPolicy,
                    refundPolicy: { ...cancellationPolicy.refundPolicy, above30min: value },
                  })
                }
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
            </div>

            {/* Example Calculation */}
            <div className="bg-muted/50 rounded-md p-4">
              <p className="text-sm font-medium mb-3">Example Calculation (₹{exampleAmount} booking):</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">If cancelled &gt; 24h before:</span>
                  <span className="font-semibold text-emerald-600">
                    Customer gets ₹{Math.round(exampleAmount * (cancellationPolicy.refundPolicy.above24h / 100))}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">If cancelled 12-24h before:</span>
                  <span className="font-semibold text-blue-600">
                    Customer gets ₹{Math.round(exampleAmount * (cancellationPolicy.refundPolicy.above12h / 100))}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">If cancelled 4-12h before:</span>
                  <span className="font-semibold text-amber-600">
                    Customer gets ₹{Math.round(exampleAmount * (cancellationPolicy.refundPolicy.above4h / 100))}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">If cancelled 30min-4h before:</span>
                  <span className="font-semibold text-rose-600">
                    Customer gets ₹{Math.round(exampleAmount * (cancellationPolicy.refundPolicy.above30min / 100))}
                  </span>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800 dark:text-amber-300">
                  <p className="font-semibold mb-1">Important Note:</p>
                  <p className="text-amber-700 dark:text-amber-400">
                    When you update the cancellation policy, all customers and providers will
                    be notified automatically. The new policy will apply to all future cancellations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:justify-between gap-3 pt-4 border-t">
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={updateSettingsMutation.isPending || updatePolicyMutation.isPending}
          className="w-full sm:w-auto"
        >
          Reset to Defaults
        </Button>
        <div className="flex gap-3">
          <Button
            variant="default"
            onClick={handleSaveSettings}
            disabled={updateSettingsMutation.isPending || updatePolicyMutation.isPending}
            className="w-full sm:w-auto"
          >
            {updateSettingsMutation.isPending ? "Saving..." : "Save Payout Settings"}
          </Button>
          <Button
            variant="default"
            onClick={handleSaveCancellationPolicy}
            disabled={updateSettingsMutation.isPending || updatePolicyMutation.isPending}
            className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700"
          >
            {updatePolicyMutation.isPending ? "Saving..." : "Save Cancellation Policy"}
          </Button>
        </div>
      </div>
    </div>
  );
}
