"use client";

import { useState, useEffect } from "react";
import { IndianRupee, Percent, TrendingUp, Wallet, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { api, API_ENDPOINTS } from "@/lib/api";
import { AdminSettingsSkeleton } from "@/components/admin/skeletons";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [platformFee, setPlatformFee] = useState(5);
  const [minimumPayout, setMinimumPayout] = useState(300);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response: any = await api.get(API_ENDPOINTS.ADMIN_SETTINGS);
      setPlatformFee(response.platformFeePercentage || 5);
      setMinimumPayout((response.minimumPayoutAmount || 30000) / 100); // Convert to rupees
    } catch (error: any) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    // Validate before sending
    if (platformFee < 1 || platformFee > 10) {
      toast.error("Platform fee must be between 1% and 10%");
      return;
    }
    if (minimumPayout < 300 || minimumPayout > 1000) {
      toast.error("Minimum payout must be between ₹300 and ₹1,000");
      return;
    }

    try {
      setSaving(true);
      await api.put(API_ENDPOINTS.ADMIN_SETTINGS, {
        platformFeePercentage: platformFee,
        minimumPayoutAmount: minimumPayout * 100, // Convert to paise
      });
      toast.success("Settings saved successfully");
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast.error(error.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  // Calculate example split
  const calculateExample = (amount: number) => {
    const platformFeeAmount = Math.round(amount * (platformFee / 100));
    const providerShare = amount - platformFeeAmount;
    return { providerShare, platformFee: platformFeeAmount };
  };

  const example = calculateExample(500);

  if (loading) {
    return <AdminSettingsSkeleton />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Platform Settings
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Configure platform fees and payment settings
          </p>
        </div>
      </div>

      {/* Platform Fee Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-3">
            <div className="p-2 bg-purple-50 dark:bg-purple-950/30 rounded-lg w-fit">
              <Percent className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <div>Platform Fee</div>
              <div className="text-sm font-normal text-muted-foreground">
                Your commission from each booking
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-purple-600 self-start sm:self-auto">
              {platformFee}%
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Slider
              value={[platformFee]}
              onValueChange={(value) => setPlatformFee(value[0])}
              min={1}
              max={10}
              step={0.5}
              className="my-4"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1%</span>
              <span>5%</span>
              <span>10%</span>
            </div>
          </div>

          {/* Example */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium">Example (₹500 booking):</p>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">You receive:</span>
              <span className="font-semibold text-purple-600">
                ₹{example.platformFee}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Provider receives:</span>
              <span className="font-semibold text-green-600">
                ₹{example.providerShare}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Minimum Payout Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded-lg w-fit">
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
            <div className="p-2 bg-muted rounded-lg w-fit">
              <IndianRupee className="h-5 w-5 text-muted-foreground" />
            </div>
            <Input
              type="number"
              min={300}
              max={1000}
              step={50}
              value={minimumPayout}
              onChange={(e) => setMinimumPayout(Number(e.target.value))}
              className="w-full sm:max-w-[200px]"
            />
            <div className="text-sm text-muted-foreground">
              Range: ₹300 - ₹1,000
            </div>
          </div>

          <div className="bg-green-50/50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex gap-3">
              <TrendingUp className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div className="text-sm text-green-800 dark:text-green-300">
                <p className="font-semibold mb-2">How payouts work:</p>
                <ul className="text-green-700 dark:text-green-400 space-y-1 list-disc list-inside">
                  <li>
                    When booking is completed, provider earnings are marked as
                    "pending"
                  </li>
                  <li>
                    Once provider reaches minimum payout (₹{minimumPayout}), you
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

      {/* Info Card */}
      <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="">
          <div className="flex gap-3 sm:gap-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg shrink-0">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <p className="font-semibold mb-2">
                Settings apply to new bookings
              </p>
              <p className="text-blue-700 dark:text-blue-400 leading-relaxed">
                Changes to platform fee percentage will only apply to new
                bookings. Existing bookings will continue to use the fee
                percentage that was set at the time of booking.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-4 border-t">
        <Button
          variant="outline"
          onClick={fetchSettings}
          disabled={loading || saving}
          className="w-full sm:w-auto"
        >
          Reset
        </Button>
        <Button
          onClick={handleSaveSettings}
          disabled={saving}
          className="w-full sm:w-auto"
        >
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
