"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Wrench,
  Eye,
  Ban,
  CheckCircle,
  Building2,
  Clock,
  IndianRupee,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { ServiceActionDialog } from "@/components/admin/ServiceActionDialog";
import {
  AdminPageHeader,
  StatCard,
  LoadingState,
  ErrorState,
  EmptyState,
  StatusBadge,
} from "@/components/admin/shared";
import { DataTablePagination } from "@/components/common";
import { AdminServicesSkeleton, AdminServicesTableSkeleton } from "@/components/admin/skeletons";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAdminServices, useAdminBusinesses, useServiceStats } from "@/lib/queries";
import type { AdminService, AdminBusiness } from "@/lib/queries/use-admin-services-data";

interface BusinessMapInfo {
  name: string;
  category?: string;
  city?: string;
  state?: string;
  phone?: string;
  logo?: string | null;
  isVerified?: boolean;
}

interface EnrichedService extends AdminService {
  business_name: string;
  business_category?: string;
  business_city?: string;
  business_state?: string;
  business_phone?: string;
  business_logo?: string | null;
  business_isVerified: boolean;
}

export default function AdminServicesPage() {
  const router = useRouter();

  // Show full skeleton only on first render before any data
  const [showFullSkeleton, setShowFullSkeleton] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Debounce search to avoid excessive API calls
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Fetch data using server-side filtering
  const {
    data: servicesData,
    isLoading: servicesLoading,
    error: servicesError,
    refetch: refetchServices,
  } = useAdminServices({
    page: currentPage,
    limit: pageSize,
    status: statusFilter === "all" ? undefined : (statusFilter as "active" | "inactive"),
    search: debouncedSearch.trim() || undefined,
  });

  const {
    data: businessesData,
    isLoading: businessesLoading,
  } = useAdminBusinesses();

  // Hide full skeleton once we have data
  useEffect(() => {
    if (servicesData) {
      setShowFullSkeleton(false);
    }
  }, [servicesData]);

  // Handle different response structures - defensive coding
  const businesses = Array.isArray(businessesData)
    ? businessesData
    : (businessesData?.businesses || []);

  // Ensure businesses is always an array
  const safeBusinesses = Array.isArray(businesses) ? businesses : [];

  const error = servicesError;

  // Get services and pagination from response
  const services = servicesData?.services || [];
  const pagination = servicesData?.pagination;

  const [actionDialogService, setActionDialogService] = useState<EnrichedService | null>(null);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery]);

  // Create business map for lookup
  const businessMap = useMemo(() => {
    const map = new Map<number, BusinessMapInfo>();
    safeBusinesses.forEach((b: any) => {
      map.set(b.id, {
        name: b.businessName || b.name || "",
        category: b.category,
        city: b.city,
        state: b.state,
        phone: b.phone,
        logo: b.logo,
        isVerified: b.isVerified,
      });
    });
    return map;
  }, [businesses]);

  // Enrich services with business data
  const enrichedServices = useMemo(() => {
    return services.map((service: AdminService) => {
      const businessId = service.businessId || service.businessProfileId || 0;
      const business = businessMap.get(businessId);
      return {
        ...service,
        business_name: business?.name || "Unknown Business",
        business_category: business?.category,
        business_city: business?.city,
        business_state: business?.state,
        business_phone: business?.phone,
        business_logo: business?.logo,
        business_isVerified: business?.isVerified || false,
      } as EnrichedService;
    });
  }, [services, businessMap]);

  // Fetch overall stats (independent of filters)
  const { data: stats } = useServiceStats();

  const handleToggleStatus = (service: EnrichedService) => {
    setActionDialogService(service);
  };

  const handleActionCompleted = () => {
    setActionDialogService(null);
    refetchServices();
  };

  const handleViewDetails = (serviceId: number) => {
    router.push(`/admin/services/${serviceId}`);
  };

  const formatRating = (rating: string | number | undefined): number | null => {
    if (rating === undefined || rating === null || rating === "") return null;
    const num = typeof rating === "string" ? parseFloat(rating) : rating;
    return isNaN(num) ? null : num;
  };

  // Show full skeleton only on initial page load
  if (showFullSkeleton) {
    return <AdminServicesSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Services"
        description="Manage all services across the platform"
        onRefresh={() => refetchServices()}
      />

      {/* Statistics */}
      {stats && (
        <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3">
          <StatCard
            title="Total Services"
            value={stats.total}
            icon={Wrench}
            variant="blue"
          />
          <StatCard
            title="Active Services"
            value={stats.active}
            change={`${stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% of total`}
            icon={CheckCircle}
            trend="up"
            variant="emerald"
          />
          <StatCard
            title="Inactive Services"
            value={stats.inactive}
            icon={Ban}
            trend="neutral"
            variant="red"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by service name, business, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Services</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing <span className="font-medium">{enrichedServices.length}</span>{" "}
        of <span className="font-medium">{pagination?.total || 0}</span> services
      </div>

      {/* Services Table */}
      {servicesLoading ? (
        <AdminServicesTableSkeleton />
      ) : error && !services.length ? (
        <ErrorState message={error.message || "Failed to load services"} onRetry={() => refetchServices()} />
      ) : enrichedServices.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No services found"
          description={
            services.length === 0
              ? "No services have been added yet"
              : "Try adjusting your filters or search query"
          }
        />
      ) : (
        <div className="border rounded-md overflow-hidden bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-[28%] py-4 px-4">Service</TableHead>
                <TableHead className="w-[24%] py-4 px-4">Business</TableHead>
                <TableHead className="w-[10%] py-4 px-4">Price</TableHead>
                <TableHead className="w-[12%] py-4 px-4">Duration</TableHead>
                <TableHead className="w-[10%] py-4 px-4">Rating</TableHead>
                <TableHead className="w-[10%] py-4 px-4">Status</TableHead>
                <TableHead className="w-[6%] py-4 px-4 text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrichedServices.map((service) => (
                <TableRow
                  key={service.id}
                  className="hover:bg-muted/50 cursor-pointer transition-colors border-b last:border-b-0"
                  onClick={() => handleViewDetails(service.id)}
                >
                  {/* Service Column with Image */}
                  <TableCell className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      {/* Service Image */}
                      <div className="h-12 w-12 rounded-md overflow-hidden bg-muted flex-shrink-0 border flex items-center justify-center">
                        {service.image ? (
                          <img
                            src={service.image}
                            alt={service.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Wrench className="h-5 w-5 text-primary/40" />
                        )}
                      </div>

                      {/* Service Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm line-clamp-1">
                          {service.name}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {service.description || "No description"}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  {/* Business Column */}
                  <TableCell className="py-4 px-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium text-sm line-clamp-1">
                          {service.business_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {service.business_category && (
                          <Badge
                            variant="outline"
                            className="text-xs px-1.5 py-0 h-4"
                          >
                            {service.business_category}
                          </Badge>
                        )}
                        {service.business_isVerified && (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Price Column */}
                  <TableCell className="py-4 px-4">
                    <div className="flex items-center gap-0.5 font-semibold text-sm">
                      <IndianRupee className="h-3.5 w-3.5 text-foreground" />
                      <span>{service.price}</span>
                    </div>
                  </TableCell>

                  {/* Duration Column */}
                  <TableCell className="py-4 px-4">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        {service.duration || 0}m
                      </span>
                    </div>
                  </TableCell>

                  {/* Rating Column */}
                  <TableCell className="py-4 px-4">
                    {formatRating(service.rating) !== null &&
                    formatRating(service.rating)! > 0 ? (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">
                          {formatRating(service.rating)!.toFixed(1)}
                        </span>
                        {service.totalReviews && service.totalReviews > 0 && (
                          <span className="text-xs text-muted-foreground">
                            ({service.totalReviews})
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        No ratings
                      </span>
                    )}
                  </TableCell>

                  {/* Status Column */}
                  <TableCell className="py-4 px-4">
                    <StatusBadge
                      status={service.isActive ? "active" : "inactive"}
                    />
                  </TableCell>

                  {/* Actions Column */}
                  <TableCell
                    className="py-4 px-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem
                          onClick={() => handleViewDetails(service.id)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(service)}
                        >
                          {service.isActive ? (
                            <>
                              <Ban className="h-4 w-4 mr-2" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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

      {/* Service Action Dialog */}
      {actionDialogService && (
        <ServiceActionDialog
          open={!!actionDialogService}
          onOpenChange={(open) => !open && setActionDialogService(null)}
          serviceId={actionDialogService.id}
          serviceName={actionDialogService.name}
          isActive={actionDialogService.isActive ?? true}
          onActionCompleted={handleActionCompleted}
        />
      )}
    </div>
  );
}
