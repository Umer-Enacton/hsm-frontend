"use client";

import { useState } from "react";
import { IndianRupee, Wallet, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { AdminSettingsSkeleton } from "@/components/admin/skeletons";
import { useAdminSettings, useUpdateAdminSettings } from "@/lib/queries";

export default function AdminSettingsPage() {
  // Fetch settings using cached hook
  const {
    data: settings = {},
    isLoading,
    error,
  } = useAdminSettings();

  // Mutation for updating settings
  const updateMutation = useUpdateAdminSettings();

  // Local state - only minimum payout (platform fee is hardcoded at 5%)
  const minimumPayout = (settings.minBookingAmount ?? 30000) / 100; // Convert to rupees

  const [localMinPayout, setLocalMinPayout] = useState(minimumPayout);

  // Update local state when settings change
  if (settings.minBookingAmount !== undefined && settings.minBookingAmount / 100 !== localMinPayout) {
    setLocalMinPayout(settings.minBookingAmount / 100);
  }

  const handleSaveSettings = async () => {
    // Validate minimum payout
    if (localMinPayout < 300 || localMinPayout > 1000) {
      toast.error("Minimum payout must be between ₹300 and ₹1,000");
      return;
    }

    updateMutation.mutate({
      minBookingAmount: localMinPayout * 100, // Convert to paise
    });
  };

  const handleReset = () => {
    setLocalMinPayout((settings.minBookingAmount ?? 30000) / 100);
  };

  if (isLoading) {
    return <AdminSettingsSkeleton />;
  }

  // Platform fee is hardcoded at 5%
  const PLATFORM_FEE = 5;
  const exampleAmount = 500;
  const platformFeeAmount = Math.round(exampleAmount * (PLATFORM_FEE / 100));
  const providerShare = exampleAmount - platformFeeAmount;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Platform Settings
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Configure payment settings
          </p>
        </div>
      </div>

      {/* Platform Fee - Read Only */}
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="p-2 bg-purple-50 dark:bg-purple-950/30 rounded-md w-fit">
              <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <div>Platform Fee</div>
              <div className="text-sm font-normal text-muted-foreground">
                Your commission from each booking (fixed at 5%)
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-purple-600 self-start sm:self-auto">
              {PLATFORM_FEE}%
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Example */}
          <div className="bg-muted/50 rounded-md p-4 space-y-2">
            <p className="text-sm font-medium">Example (₹{exampleAmount} booking):</p>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Platform receives:</span>
              <span className="font-semibold text-purple-600">
                ₹{platformFeeAmount}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Provider receives:</span>
              <span className="font-semibold text-green-600">
                ₹{providerShare}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Minimum Payout Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded-md w-fit">
              <Wallet className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <div>Minimum Payout</div>
              <div className="text-sm font-normal text-muted-foreground">
                Minimum amount before processing payouts
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
              value={localMinPayout}
              onChange={(e) => setLocalMinPayout(Number(e.target.value))}
              className="w-full sm:max-w-[200px]"
            />
            <div className="text-sm text-muted-foreground">
              Range: ₹300 - ₹1,000
            </div>
          </div>

          <div className="bg-green-50/50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md p-4">
            <div className="flex gap-3">
              <svg className="h-5 w-5 text-green-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <div className="text-sm text-green-800 dark:text-green-300">
                <p className="font-semibold mb-2">How payouts work:</p>
                <ul className="text-green-700 dark:text-green-400 space-y-1 list-disc list-inside">
                  <li>
                    When booking is completed, provider earnings are marked as
                    "pending"
                  </li>
                  <li>
                    Once provider reaches minimum payout (₹{localMinPayout}), you
                    can process their payout
                  </li>
                  <li>
                    Payouts are grouped by provider - you can process individual
                    or bulk payouts
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-4 border-t">
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={updateMutation.isPending}
          className="w-full sm:w-auto"
        >
          Reset
        </Button>
        <Button
          onClick={handleSaveSettings}
          disabled={updateMutation.isPending}
          className="w-full sm:w-auto"
        >
          {updateMutation.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
