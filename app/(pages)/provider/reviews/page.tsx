"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, MessageSquare, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ProviderReviewsSkeleton } from "@/components/provider/skeletons";
import { ProviderReviewsManager } from "@/components/provider/reviews";
import { useProviderBusiness } from "@/lib/queries/use-provider-dashboard";
import { getUserData } from "@/lib/auth-utils";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/queries/query-keys";

export default function ProviderReviewsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [userData] = useState(() => getUserData());

  const { data: business, isLoading: isLoadingBusiness } = useProviderBusiness(userData?.id);
  const businessId = business?.id;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROVIDER_BUSINESS] });
    queryClient.invalidateQueries({ queryKey: ['provider', 'reviews'] });
    queryClient.invalidateQueries({ queryKey: ['provider', 'services', 'business'] });
    toast.success("Reviews refreshed");
  };

  if (isLoadingBusiness || !businessId) {
    return <ProviderReviewsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Star className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500 fill-yellow-400" />
            Customer Reviews
          </h1>
          <p className="text-muted-foreground">Manage and respond to customer feedback</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="icon"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Reviews Manager */}
      <ProviderReviewsManager key={businessId} businessId={businessId} />
    </div>
  );
}
