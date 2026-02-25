"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, Building2, Badge, User, Trash2 } from "lucide-react";
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
  AdminPageHeader,
  StatCard,
  LoadingState,
  ErrorState,
  EmptyState,
} from "@/components/admin/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/admin/shared";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MapPin,
  Star,
  Eye,
  CheckCircle,
  X,
  MoreHorizontal,
  Clock,
  Phone,
  Mail,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "list";

export default function AdminBusinessPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [stats, setStats] = useState<BusinessStats | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Load businesses and stats on mount
  useEffect(() => {
    loadData();
  }, []);

  // Filter businesses when filters change
  useEffect(() => {
    filterBusinesses();
  }, [businesses, statusFilter, searchQuery]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [businessResult, businessStats] = await Promise.all([
        getAllBusinesses({
          page: 1,
          limit: 100,
          status: "all",
          sortBy: "createdAt",
          sortOrder: "desc",
        }),
        getBusinessStats(),
      ]);
      setBusinesses(businessResult.businesses);
      setStats(businessStats);
    } catch (error: any) {
      console.error("Error loading businesses:", error);
      toast.error("Failed to load businesses");
    } finally {
      setIsLoading(false);
    }
  };

  const filterBusinesses = () => {
    let filtered = [...businesses];

    // Status filter
    if (statusFilter === "verified") {
      filtered = filtered.filter((b) => b.isVerified);
    } else if (statusFilter === "pending") {
      filtered = filtered.filter((b) => !b.isVerified);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.name?.toLowerCase().includes(query) ||
          b.category?.toLowerCase().includes(query) ||
          b.city?.toLowerCase().includes(query) ||
          b.providerName?.toLowerCase().includes(query),
      );
    }

    setFilteredBusinesses(filtered);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
    toast.success("Businesses refreshed");
  };

  const handleViewDetails = (businessId: number) => {
    router.push(`/admin/business/${businessId}`);
  };

  const handleVerify = async (businessId: number) => {
    try {
      const result = await verifyBusiness(businessId);
      toast.success("Business verified successfully", {
        description: `${result.business.name} is now verified`,
      });
      await loadData();
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
      await loadData();
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
      await loadData();
    } catch (error: any) {
      toast.error("Failed to delete business", {
        description: error.message || "Please try again",
      });
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading businesses..." />;
  }

  if (!businesses.length) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Businesses"
          description="Manage and verify provider businesses"
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />
        <EmptyState
          icon={Briefcase}
          title="No businesses found"
          description="No businesses have been registered yet"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Businesses"
        description="Manage and verify provider businesses"
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Total Businesses"
            value={stats.total}
            icon={Building2}
          />
          <StatCard
            title="Verified"
            value={stats.verified}
            change={`${Math.round((stats.verified / stats.total) * 100) || 0}% verified`}
            icon={CheckCircle}
            trend="up"
          />
          <StatCard
            title="Pending Verification"
            value={stats.pending}
            icon={Clock}
            trend="neutral"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by name, category, location, or provider..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Businesses</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="pending">Pending Verification</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing <span className="font-medium">{filteredBusinesses.length}</span>{" "}
        of <span className="font-medium">{businesses.length}</span> businesses
      </div>

      {/* Business Grid */}
      {filteredBusinesses.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No businesses found"
          description="Try adjusting your filters or search query"
        />
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBusinesses.map((business) => (
            <BusinessGridCard
              key={business.id}
              business={business}
              onViewDetails={() => handleViewDetails(business.id)}
              onVerify={() => handleVerify(business.id)}
              onUnverify={() => handleUnverify(business.id)}
              onDelete={() => handleDelete(business.id)}
            />
          ))}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <BusinessListView
            businesses={filteredBusinesses}
            onViewDetails={handleViewDetails}
            onVerify={handleVerify}
            onUnverify={handleUnverify}
            onDelete={handleDelete}
          />
        </div>
      )}
    </div>
  );
}

// Business Grid Card Component
function BusinessGridCard({
  business,
  onViewDetails,
  onVerify,
  onUnverify,
  onDelete,
}: {
  business: Business;
  onViewDetails: () => void;
  onVerify: () => void;
  onUnverify: () => void;
  onDelete: () => void;
}) {
  return (
    <Card
      className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden w-full p-0"
      onClick={onViewDetails}
    >
      {/* Cover Image as Background */}
      <div className="relative h-48 sm:h-56 bg-muted">
        {business.logo || business.coverImage ? (
          <img
            src={business.logo || business.coverImage}
            alt={business.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 via-primary/20 to-primary/10 flex items-center justify-center">
            <Building2 className="h-20 w-20 text-primary/40" />
          </div>
        )}

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Category Badge - Top Left */}
        {business.category && (
          <div className="absolute top-3 left-3 z-10 border border-white/30 bg-black/50 backdrop-blur-sm text-xs text-white px-2 py-1 rounded">
            {business.category}
          </div>
        )}
        {/* Verification Badge - Top Right */}
        <div className="absolute top-3 right-3 z-10">
          <div
            className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg",
              business.isVerified
                ? "bg-green-500 text-white"
                : "bg-yellow-500 text-white",
            )}
          >
            {business.isVerified ? (
              <>
                <CheckCircle className="h-3 w-3" />
                Verified
              </>
            ) : (
              <>
                <Clock className="h-3 w-3" />
                Pending
              </>
            )}
          </div>
        </div>

        {/* Business Info - Bottom Left Overlay */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-4">
          <div className="flex items-end justify-between gap-3">
            {/* Logo and Info */}
            <div className="flex items-center gap-3">
              {/* Logo */}
              <div className="h-14 w-14 rounded-xl border-2 border-white/30 overflow-hidden bg-white/10 backdrop-blur-sm shadow-lg flex-shrink-0">
                {business.coverImage ? (
                  <img
                    src={business.coverImage}
                    alt={business.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-primary/80 flex items-center justify-center">
                    <span className="text-lg font-bold text-white">
                      {business.name?.charAt(0)?.toUpperCase() || "B"}
                    </span>
                  </div>
                )}
              </div>

              {/* Business Name & Details */}
              <div className="text-white">
                <h3 className="font-bold text-lg line-clamp-1 drop-shadow-lg">
                  {business.name}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  {business.city && business.state && (
                    <div className="flex items-center gap-1 text-xs text-white/80">
                      <MapPin className="h-3 w-3" />
                      <span className="line-clamp-1">
                        {business.city}, {business.state}
                      </span>
                    </div>
                  )}
                  {business.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-semibold">
                        {business.rating.toFixed(1)}
                      </span>
                      {business.totalReviews && (
                        <span className="text-xs text-white/70">
                          ({business.totalReviews})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="icon"
                    className="h-9 w-9 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border-0 text-white"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={onViewDetails}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  {business.isVerified ? (
                    <DropdownMenuItem onClick={onUnverify}>
                      <X className="h-4 w-4 mr-2" />
                      Unverify Business
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={onVerify}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Verify Business
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Business
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Business List View Component
function BusinessListView({
  businesses,
  onViewDetails,
  onVerify,
  onUnverify,
  onDelete,
}: {
  businesses: Business[];
  onViewDetails: (id: number) => void;
  onVerify: (id: number) => void;
  onUnverify: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b bg-muted/50">
          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[30%]">
            Business
          </th>
          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[15%]">
            Category
          </th>
          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[20%]">
            Location
          </th>
          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[15%]">
            Provider
          </th>
          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[10%]">
            Status
          </th>
          <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground w-[10%]">
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        {businesses.map((business) => (
          <tr
            key={business.id}
            className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
            onClick={() => onViewDetails(business.id)}
          >
            <td className="p-4 align-middle">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  {business.logo ? (
                    <AvatarImage src={business.logo} alt={business.name} />
                  ) : (
                    <AvatarFallback>
                      {business.name?.charAt(0) || "B"}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <div className="font-medium line-clamp-1">
                    {business.name}
                  </div>
                  {business.rating && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {business.rating.toFixed(1)}
                    </div>
                  )}
                </div>
              </div>
            </td>
            <td className="p-4 align-middle text-sm text-muted-foreground">
              {business.category || "-"}
            </td>
            <td className="p-4 align-middle text-sm text-muted-foreground">
              {business.city && business.state
                ? `${business.city}, ${business.state}`
                : "-"}
            </td>
            <td className="p-4 align-middle text-sm text-muted-foreground">
              {business.providerName || "-"}
            </td>
            <td className="p-4 align-middle">
              <StatusBadge
                status={business.isVerified ? "verified" : "pending"}
              />
            </td>
            <td
              className="p-4 align-middle"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onViewDetails(business.id)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  {business.isVerified ? (
                    <DropdownMenuItem onClick={() => onUnverify(business.id)}>
                      <X className="h-4 w-4 mr-2" />
                      Unverify
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => onVerify(business.id)}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Verify
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => onDelete(business.id)}
                    className="text-destructive"
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
