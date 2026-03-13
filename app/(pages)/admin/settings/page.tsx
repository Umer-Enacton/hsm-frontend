"use client";

import { useState, useEffect } from "react";
import {
  IndianRupee,
  Percent,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { api, API_ENDPOINTS } from "@/lib/api";

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
          Platform Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure platform fees and payment settings
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <Card className="shadow-lg max-w-2xl mx-auto">
          <CardContent className="p-6 space-y-8">
            {/* Platform Fee Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Percent className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Platform Fee</h3>
                  <p className="text-sm text-muted-foreground">Your commission from each booking</p>
                </div>
                <div className="ml-auto text-2xl font-bold text-purple-600">{platformFee}%</div>
              </div>

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
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                <p className="text-sm font-medium text-muted-foreground mb-2">Example (₹500 booking):</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm">You receive:</span>
                  <span className="font-bold text-purple-600">₹{example.platformFee}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Provider receives:</span>
                  <span className="font-bold text-green-600">₹{example.providerShare}</span>
                </div>
              </div>
            </div>

            {/* Minimum Payout Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Wallet className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Minimum Payout</h3>
                  <p className="text-sm text-muted-foreground">Minimum amount before processing payouts</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <IndianRupee className="h-5 w-5 text-muted-foreground" />
                <Input
                  type="number"
                  min={300}
                  max={1000}
                  step={50}
                  value={minimumPayout}
                  onChange={(e) => setMinimumPayout(Number(e.target.value))}
                  className="text-lg max-w-[200px]"
                />
                <div className="text-sm text-muted-foreground">
                  Range: ₹300 - ₹1,000
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">
                  <TrendingUp className="h-4 w-4 inline mr-2" />
                  How payouts work:
                </p>
                <ul className="text-xs text-green-700 dark:text-green-400 space-y-1 list-disc list-inside">
                  <li>When booking is completed, provider earnings are marked as "pending"</li>
                  <li>Once provider reaches minimum payout (₹{minimumPayout}), you can process their payout</li>
                  <li>Payouts are grouped by provider - you can process individual or bulk payouts</li>
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={fetchSettings}
                disabled={loading || saving}
              >
                Reset
              </Button>
              <Button
                onClick={handleSaveSettings}
                disabled={saving}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 px-8"
              >
                {saving ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
