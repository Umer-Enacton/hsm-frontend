"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

interface AnalyticsUpgradeCardsProps {
  router: ReturnType<typeof useRouter>;
}

// Free plan upgrade card - shows all 4 analytics features
export function FreePlanAnalyticsCard({ router }: AnalyticsUpgradeCardsProps) {
  const features = [
    { name: "Revenue Trends", tier: "Pro" },
    { name: "Booking Status", tier: "Pro" },
    { name: "Service Performance", tier: "Premium" },
    { name: "Time Patterns", tier: "Premium" },
  ];

  return (
    <Card className="border-2 border-dashed">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl">Unlock Analytics</CardTitle>
        <CardDescription>
          Upgrade your plan to access powerful analytics and grow your business
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {features.map((feature) => (
            <div key={feature.name} className="flex items-center justify-between py-2 border-b last:border-0">
              <span className="text-sm font-medium">{feature.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                feature.tier === "Pro"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-purple-100 text-purple-700"
              }`}>
                {feature.tier}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="justify-center pt-2">
        <Button
          onClick={() => router.push("/provider/subscription")}
          className="w-full sm:w-auto"
        >
          Upgrade Your Plan
        </Button>
      </CardFooter>
    </Card>
  );
}

// Pro plan upgrade card - shows Premium features
export function ProPlanAnalyticsCard({ router }: AnalyticsUpgradeCardsProps) {
  const premiumFeatures = [
    "Service Performance - See which services get the most bookings",
    "Time Patterns - Busiest hours and seasonal trends",
  ];

  return (
    <Card className="border-2 border-dashed bg-gradient-to-br from-purple-50/50 to-indigo-50/50">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl">Unlock Premium Analytics</CardTitle>
        <CardDescription>
          Upgrade to Premium to unlock advanced analytics and grow your business faster
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {premiumFeatures.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="justify-center pt-2">
        <Button
          onClick={() => router.push("/provider/subscription")}
          className="w-full sm:w-auto"
          variant="default"
        >
          Upgrade to Premium
        </Button>
      </CardFooter>
    </Card>
  );
}
