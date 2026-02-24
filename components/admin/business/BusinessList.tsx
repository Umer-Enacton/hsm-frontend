/**
 * Business List Component
 * Displays a list/grid of business cards
 */

import { Loader2 } from "lucide-react";
import { BusinessCard } from "./BusinessCard";
import type { Business } from "@/types/provider";

interface BusinessListProps {
  businesses: Business[];
  isLoading: boolean;
  onViewDetails: (business: Business) => void;
  onVerify: (businessId: number) => void;
  onUnverify: (businessId: number) => void;
  onDelete: (businessId: number) => void;
}

export function BusinessList({
  businesses,
  isLoading,
  onViewDetails,
  onVerify,
  onUnverify,
  onDelete,
}: BusinessListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">Loading businesses...</p>
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="max-w-md">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-lg font-semibold mb-2">No businesses found</h3>
          <p className="text-muted-foreground mb-4">
            There are no businesses matching your current filters.
          </p>
          <p className="text-sm text-muted-foreground">
            Try adjusting your filters or search terms.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {businesses.map((business) => (
        <BusinessCard
          key={business.id}
          business={business}
          onViewDetails={onViewDetails}
          onVerify={onVerify}
          onUnverify={onUnverify}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
