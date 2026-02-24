"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  getAllBusinesses,
  getBusinessStats,
  verifyBusiness,
  unverifyBusiness,
  deleteBusiness,
  type AdminBusinessListParams,
  type BusinessStats,
} from "@/lib/admin/business";
import type { Business } from "@/types/provider";
import {
  BusinessFilters,
  BusinessList,
  BusinessDetailModal,
  BusinessStats as BusinessStatsComponent,
} from "@/components/admin/business";

export default function AdminBusinessPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [stats, setStats] = useState<BusinessStats | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(
    null,
  );
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Filter states
  const [filters, setFilters] = useState<AdminBusinessListParams>({
    page: 1,
    limit: 20,
    status: "all",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // Load businesses and stats on mount
  useEffect(() => {
    loadBusinesses();
    loadStats();
  }, []);

  // Reload when filters change
  useEffect(() => {
    loadBusinesses();
  }, [filters]);

  const loadBusinesses = async () => {
    setIsLoading(true);
    try {
      const result = await getAllBusinesses(filters);
      setBusinesses(result.businesses);
    } catch (error: any) {
      console.error("Error loading businesses:", error);
      toast.error("Failed to load businesses");
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const businessStats = await getBusinessStats();
      setStats(businessStats);
    } catch (error: any) {
      console.error("Error loading stats:", error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadBusinesses();
    await loadStats();
    setIsRefreshing(false);
    toast.success("Businesses refreshed");
  };

  const handleFilterChange = (newFilters: Partial<AdminBusinessListParams>) => {
    setFilters({ ...filters, ...newFilters, page: 1 }); // Reset to page 1 on filter change
  };

  const handleSearch = (search: string) => {
    setFilters({ ...filters, search, page: 1 });
  };

  const handleViewDetails = (business: Business) => {
    setSelectedBusiness(business);
    setIsDetailModalOpen(true);
  };

  const handleVerify = async (businessId: number) => {
    try {
      const result = await verifyBusiness(businessId);
      toast.success("Business verified successfully", {
        description: `${result.business.name} is now verified`,
      });

      // Refresh list and stats
      await loadBusinesses();
      await loadStats();

      // Emit event to update other components
      window.dispatchEvent(new CustomEvent("business-updated"));
    } catch (error: any) {
      toast.error("Failed to verify business", {
        description: error.message || "Please try again",
      });
    }
  };

  const handleUnverify = async (businessId: number) => {
    try {
      const result = await unverifyBusiness(businessId);
      toast.success("Business unverified", {
        description: `${result.business.name} is now pending verification`,
      });

      // Refresh list and stats
      await loadBusinesses();
      await loadStats();

      // Emit event to update other components
      window.dispatchEvent(new CustomEvent("business-updated"));
    } catch (error: any) {
      toast.error("Failed to unverify business", {
        description: error.message || "Please try again",
      });
    }
  };

  const handleDelete = async (businessId: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this business? This will delete all services, bookings, and data associated with this business. This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      await deleteBusiness(businessId);
      toast.success("Business deleted successfully");

      // Refresh list and stats
      await loadBusinesses();
      await loadStats();

      // Close modal if open
      if (selectedBusiness?.id === businessId) {
        setIsDetailModalOpen(false);
        setSelectedBusiness(null);
      }
    } catch (error: any) {
      toast.error("Failed to delete business", {
        description: error.message || "Please try again",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Businesses</h1>
          <p className="text-muted-foreground">
            Manage and verify provider businesses
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="icon"
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
        </Button>
      </div>

      {/* Statistics Cards */}
      <BusinessStatsComponent stats={stats} />

      {/* Filters */}
      <BusinessFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
      />

      {/* Business List */}
      <BusinessList
        businesses={businesses}
        isLoading={isLoading}
        onViewDetails={handleViewDetails}
        onVerify={handleVerify}
        onUnverify={handleUnverify}
        onDelete={handleDelete}
      />

      {/* Business Detail Modal */}
      {selectedBusiness && (
        <BusinessDetailModal
          business={selectedBusiness}
          open={isDetailModalOpen}
          onOpenChange={setIsDetailModalOpen}
          onVerify={handleVerify}
          onUnverify={handleUnverify}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
