"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, Building2, Badge, Ban } from "lucide-react";
import {
  useAdminBusinessList,
  useBusinessStats,
  useVerifyBusiness,
  useUnverifyBusiness,
  useBlockBusiness,
  useUnblockBusiness,
} from "@/lib/queries/use-admin-business";
import { useDebounce } from "@/hooks/use-debounce";
import type { Business } from "@/types/provider";
import {
  AdminPageHeader,
  StatCard,
  LoadingState,
  ErrorState,
  EmptyState,
  ViewToggleButtons,
} from "@/components/admin/shared";
import { DataTablePagination } from "@/components/common";
import {
  AdminBusinessSkeleton,
  AdminBusinessTableSkeleton,
  AdminBusinessGridSkeleton,
} from "@/components/admin/skeletons";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { BlockBusinessDialog } from "@/components/admin/BlockBusinessDialog";

type ViewMode = "grid" | "list";

export default function AdminBusinessPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [blockDialogBusiness, setBlockDialogBusiness] =
    useState<Business | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Debounce search to avoid excessive API calls
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Fetch data using TanStack Query hooks with server-side filtering
  const {
    data: businessesData,
    isLoading: businessesLoading,
    error: businessesError,
    refetch: refetchBusinesses,
  } = useAdminBusinessList({
    page: currentPage,
    limit: pageSize,
    search: debouncedSearch.trim() || undefined,
    status:
      statusFilter === "all"
        ? undefined
        : (statusFilter as "verified" | "pending" | "blocked"),
  });

  const { data: stats } = useBusinessStats();

  // Mutations
  const verifyMutation = useVerifyBusiness();
  const unverifyMutation = useUnverifyBusiness();
  const blockMutation = useBlockBusiness();
  const unblockMutation = useUnblockBusiness();

  const businesses = businessesData?.businesses || [];
  const pagination = businessesData?.pagination;

  // Show full skeleton only on first render before any data (cached or fresh)
  // Using state instead of ref to ensure it's checked synchronously
  const [showFullSkeleton, setShowFullSkeleton] = useState(true);

  useEffect(() => {
    // Hide full skeleton once we have data (cached or fresh)
    if (businessesData) {
      setShowFullSkeleton(false);
    }
  }, [businessesData]);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery]);

  const handleRefresh = async () => {
    await refetchBusinesses();
  };

  const handleViewDetails = (businessId: number) => {
    router.push(`/admin/business/${businessId}`);
  };

  const handleVerify = async (businessId: number) => {
    await verifyMutation.mutateAsync(businessId);
    window.dispatchEvent(new CustomEvent("business-updated"));
  };

  const handleUnverify = async (businessId: number) => {
    await unverifyMutation.mutateAsync(businessId);
    window.dispatchEvent(new CustomEvent("business-updated"));
  };

  const handleBlock = (business: Business) => {
    setBlockDialogBusiness(business);
  };

  const handleUnblock = async (businessId: number) => {
    await unblockMutation.mutateAsync(businessId);
    window.dispatchEvent(new CustomEvent("business-updated"));
  };

  const handleBlocked = () => {
    setBlockDialogBusiness(null);
    window.dispatchEvent(new CustomEvent("business-updated"));
  };

  // Show full skeleton only on initial page load (before any data received)
  if (showFullSkeleton) {
    return <AdminBusinessSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Businesses"
        description="Manage and verify provider businesses"
        onRefresh={handleRefresh}
      />

      {/* Statistics Cards - Always show after initial load */}
      {stats && (
        <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4">
          <StatCard
            title="Total Businesses"
            value={stats?.total ?? 0}
            icon={Building2}
            variant="blue"
          />
          <StatCard
            title="Verified"
            value={stats?.verified ?? 0}
            change={`${stats && stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0}% verified`}
            icon={CheckCircle}
            trend="up"
            variant="emerald"
          />
          <StatCard
            title="Pending Verification"
            value={stats?.pending ?? 0}
            icon={Clock}
            trend="neutral"
            variant="orange"
          />
          <StatCard
            title="Blocked"
            value={stats?.blocked ?? 0}
            change={
              stats && stats.blocked > 0
                ? `${Math.round((stats.blocked / stats.total) * 100)}% of total`
                : "No blocked"
            }
            icon={Ban}
            trend="neutral"
            variant="red"
          />
        </div>
      )}

      {/* Filters - Always show */}
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
            <SelectItem value="blocked">Blocked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count & View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          Showing <span className="font-medium">{businesses.length}</span> of{" "}
          <span className="font-medium">{pagination?.total || 0}</span>{" "}
          businesses
        </div>
        <ViewToggleButtons viewMode={viewMode} onViewModeChange={setViewMode} />
      </div>

      {/* Business Grid/List */}
      {businessesLoading ? (
        viewMode === "grid" ? (
          <AdminBusinessGridSkeleton />
        ) : (
          <AdminBusinessTableSkeleton />
        )
      ) : businessesError ? (
        <ErrorState
          message={
            businessesError instanceof Error
              ? businessesError.message
              : "Failed to load businesses"
          }
          onRetry={handleRefresh}
        />
      ) : businesses.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No businesses found"
          description="Try adjusting your filters or search query"
        />
      ) : (
        <>
          {viewMode === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {businesses.map((business) => (
                <BusinessGridCard
                  key={business.id}
                  business={business}
                  onViewDetails={() => handleViewDetails(business.id)}
                  onVerify={() => handleVerify(business.id)}
                  onBlock={() => handleBlock(business)}
                  onUnblock={() => handleUnblock(business.id)}
                />
              ))}
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden bg-card shadow-sm">
              <BusinessListView
                businesses={businesses}
                onViewDetails={handleViewDetails}
                onVerify={handleVerify}
                onBlock={handleBlock}
                onUnblock={handleUnblock}
              />
            </div>
          )}

          {/* Pagination */}
          {pagination && (
            <DataTablePagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              pageSize={pagination.limit}
              onPageChange={(page) => {
                setCurrentPage(page);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          )}
        </>
      )}

      {/* Block Business Dialog */}
      {blockDialogBusiness && (
        <BlockBusinessDialog
          open={!!blockDialogBusiness}
          onOpenChange={(open) => !open && setBlockDialogBusiness(null)}
          businessId={blockDialogBusiness.id}
          businessName={blockDialogBusiness.name}
          onBlocked={handleBlocked}
        />
      )}
    </div>
  );
}

// Business Grid Card Component
function BusinessGridCard({
  business,
  onViewDetails,
  onVerify,
  onBlock,
  onUnblock,
}: {
  business: Business;
  onViewDetails: () => void;
  onVerify: () => void;
  onBlock: () => void;
  onUnblock: () => void;
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
            src={business.logo || business.coverImage || undefined}
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
        {/* Verification/Blocking Badge - Top Right */}
        <div className="absolute top-3 right-3 z-10">
          <div
            className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg",
              business.isBlocked
                ? "bg-red-500 text-white"
                : business.isVerified
                  ? "bg-green-500 text-white"
                  : "bg-yellow-500 text-white",
            )}
          >
            {business.isBlocked ? (
              <>
                <Ban className="h-3 w-3" />
                Blocked
              </>
            ) : business.isVerified ? (
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
              <div className="h-14 w-14 rounded-md border-2 border-white/30 overflow-hidden bg-white/10 backdrop-blur-sm shadow-lg flex-shrink-0">
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
                  {business.isBlocked ? (
                    <DropdownMenuItem
                      onClick={onUnblock}
                      className="text-green-600"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Unblock Business
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onClick={onBlock}
                      className="text-destructive"
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      Block Business
                    </DropdownMenuItem>
                  )}
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
  onBlock,
  onUnblock,
}: {
  businesses: Business[];
  onViewDetails: (id: number) => void;
  onVerify: (id: number) => void;
  onBlock: (business: Business) => void;
  onUnblock: (id: number) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/50 hover:bg-muted/50">
          <TableHead className="w-[30%] py-4 px-4">Business</TableHead>
          <TableHead className="w-[15%] py-4 px-4">Category</TableHead>
          <TableHead className="w-[20%] py-4 px-4">Location</TableHead>
          <TableHead className="w-[15%] py-4 px-4">Provider</TableHead>
          <TableHead className="w-[10%] py-4 px-4">Rating</TableHead>
          <TableHead className="w-[10%] py-4 px-4">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {businesses.map((business) => (
          <TableRow
            key={business.id}
            className="hover:bg-muted/50 cursor-pointer transition-colors border-b last:border-b-0"
            onClick={() => onViewDetails(business.id)}
          >
            <TableCell className="py-4 px-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 rounded-sm">
                  {business.logo ? (
                    <AvatarImage src={business.logo} alt={business.name} />
                  ) : (
                    <AvatarFallback className="rounded-sm">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm line-clamp-1">
                    {business.name}
                  </h3>
                  {business.phone && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Phone className="h-3 w-3" />
                      {business.phone}
                    </p>
                  )}
                </div>
              </div>
            </TableCell>
            <TableCell className="py-4 px-4">
              <span className="text-sm">{business.category || "-"}</span>
            </TableCell>
            <TableCell className="py-4 px-4">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {business.city && business.state
                  ? `${business.city}, ${business.state}`
                  : "-"}
              </div>
            </TableCell>
            <TableCell className="py-4 px-4">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  {business.providerAvatar ? (
                    <AvatarImage
                      src={business.providerAvatar}
                      alt={business.providerName || "Provider"}
                    />
                  ) : (
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {business.providerName?.charAt(0)?.toUpperCase() || "P"}
                    </AvatarFallback>
                  )}
                </Avatar>
                <span className="text-sm">{business.providerName || "-"}</span>
              </div>
            </TableCell>
            <TableCell className="py-4 px-4">
              {business.rating ? (
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">
                    {business.rating.toFixed(1)}
                  </span>
                  {business.totalReviews && business.totalReviews > 0 && (
                    <span className="text-xs text-muted-foreground">
                      ({business.totalReviews})
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">
                  No ratings
                </span>
              )}
            </TableCell>
            <TableCell className="py-4 px-4">
              {business.isBlocked ? (
                <StatusBadge status="blocked" />
              ) : (
                <StatusBadge
                  status={business.isVerified ? "verified" : "pending"}
                />
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
