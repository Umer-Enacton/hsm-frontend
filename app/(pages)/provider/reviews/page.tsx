"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, MessageSquare, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ProviderReviewsSkeleton } from "@/components/provider/skeletons";
import { ProviderReviewsManager } from "@/components/provider/reviews";
import { getProviderBusiness } from "@/lib/provider/api";

export default function ProviderReviewsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [businessId, setBusinessId] = useState<number | null>(null);

  useEffect(() => {
    loadBusiness();
  }, []);

  const loadBusiness = async () => {
    setIsLoading(true);
    try {
      const { getUserData } = await import("@/lib/auth-utils");
      const userData = getUserData();

      if (!userData || !userData.id) {
        toast.error("Please login to continue");
        router.push("/login");
        return;
      }

      const business = await getProviderBusiness(userData.id);
      if (!business) {
        toast.error("Business profile not found");
        router.push("/onboarding");
        return;
      }

      setBusinessId(business.id);
    } catch (error: any) {
      console.error("Error loading business:", error);
      toast.error("Failed to load business information");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Force re-render by toggling a state
    setBusinessId((prev) => {
      setTimeout(() => setBusinessId(prev), 100);
      return prev;
    });
    setTimeout(() => setIsRefreshing(false), 500);
    toast.success("Reviews refreshed");
  };

  if (isLoading) {
    return <ProviderReviewsSkeleton />;
  }

  if (!businessId) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground">Unable to load business information</p>
        <Button variant="outline" className="mt-4" onClick={loadBusiness}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Star className="h-8 w-8 text-yellow-500 fill-yellow-400" />
            Customer Reviews
          </h1>
          <p className="text-muted-foreground">Manage and respond to customer feedback</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="icon"
            disabled={isRefreshing}
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Reviews Manager */}
      <ProviderReviewsManager key={businessId} businessId={businessId} />
    </div>
  );
}
