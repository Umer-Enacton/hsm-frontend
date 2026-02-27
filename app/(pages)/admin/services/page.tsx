"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Wrench } from "lucide-react";
import { api, API_ENDPOINTS } from "@/lib/api";
import { toast } from "sonner";
import {
  AdminPageHeader,
  StatCard,
  LoadingState,
  ErrorState,
  EmptyState,
  StatusBadge,
} from "@/components/admin/shared";
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
import {
  MoreHorizontal,
  Eye,
  Ban,
  CheckCircle,
  Building2,
  MapPin,
  Clock,
  IndianRupee,
  Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  EstimateDuration?: number;
  duration?: number;
  business_id?: number;
  businessProfileId?: number;
  business_name?: string;
  business_category?: string;
  business_city?: string;
  business_state?: string;
  business_logo?: string | null;
  business_isVerified?: boolean;
  business_phone?: string;
  image?: string | null;
  rating?: string | number;
  totalReviews?: number;
  isActive?: boolean;
  is_active?: boolean;
  created_at?: string;
  createdAt?: string;
}

interface ServiceStats {
  total: number;
  active: number;
  inactive: number;
}

export default function AdminServicesPage() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [stats, setStats] = useState<ServiceStats>({
    total: 0,
    active: 0,
    inactive: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    filterServices();
  }, [services, statusFilter, searchQuery]);

  const fetchServices = async (showRefreshLoading = false) => {
    try {
      if (showRefreshLoading) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      // Fetch services
      const servicesResponse: any = await api.get(API_ENDPOINTS.SERVICES);
      const servicesData = Array.isArray(servicesResponse)
        ? servicesResponse
        : (servicesResponse?.services || servicesResponse?.data || []);

      // Fetch businesses to get detailed info
      const businessesResponse: any = await api.get(API_ENDPOINTS.BUSINESSES);
      const businesses = Array.isArray(businessesResponse)
        ? businessesResponse
        : (businessesResponse?.businesses || businessesResponse?.data || []);

      // Create a map of business details
      const businessMap = new Map(
        businesses.map((b: any) => [
          b.id,
          {
            name: b.businessName || b.name,
            category: b.category,
            city: b.city,
            state: b.state,
            phone: b.phone,
            logo: b.logo,
            isVerified: b.isVerified,
          },
        ])
      );

      // Enrich services with business data
      const enrichedServices = servicesData.map((service: any) => {
        const businessId = service.business_id || service.businessProfileId;
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
          // Normalize fields
          duration: service.EstimateDuration || service.duration,
          isActive: service.isActive ?? service.is_active ?? true,
        };
      });

      setServices(enrichedServices);

      // Calculate stats
      const activeCount = enrichedServices.filter((s: Service) => s.isActive).length;
      setStats({
        total: enrichedServices.length,
        active: activeCount,
        inactive: enrichedServices.length - activeCount,
      });
    } catch (err: any) {
      console.error("Failed to fetch services:", err);
      setError(err.message || "Failed to load services");
      toast.error("Failed to load services");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const filterServices = () => {
    let filtered = [...services];

    // Status filter
    if (statusFilter === "active") {
      filtered = filtered.filter((s) => s.isActive);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter((s) => !s.isActive);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name?.toLowerCase().includes(query) ||
          s.business_name?.toLowerCase().includes(query) ||
          s.description?.toLowerCase().includes(query) ||
          s.business_category?.toLowerCase().includes(query)
      );
    }

    setFilteredServices(filtered);
  };

  const handleToggleStatus = async (service: Service) => {
    try {
      const newStatus = !service.isActive;
      await api.patch(`${API_ENDPOINTS.SERVICE_BY_ID(service.id)}`, {
        isActive: newStatus,
      });
      toast.success(
        `Service ${newStatus ? "activated" : "deactivated"} successfully`
      );
      await fetchServices();
    } catch (err: any) {
      toast.error("Failed to update service status");
    }
  };

  const handleViewDetails = (serviceId: number) => {
    router.push(`/admin/services/${serviceId}`);
  };

  const formatRating = (rating: string | number | undefined): number | null => {
    if (rating === undefined || rating === null || rating === "") return null;
    const num = typeof rating === "string" ? parseFloat(rating) : rating;
    return isNaN(num) ? null : num;
  };

  if (isLoading) {
    return <LoadingState message="Loading services..." />;
  }

  if (error && !services.length) {
    return <ErrorState message={error} onRetry={() => fetchServices()} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Services"
        description="Manage all services across the platform"
        onRefresh={() => fetchServices(true)}
        isRefreshing={isRefreshing}
      />

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total Services" value={stats.total} icon={Wrench} />
        <StatCard
          title="Active Services"
          value={stats.active}
          change={`${stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% of total`}
          icon={CheckCircle}
          trend="up"
        />
        <StatCard
          title="Inactive Services"
          value={stats.inactive}
          icon={Ban}
          trend="neutral"
        />
      </div>

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
        Showing <span className="font-medium">{filteredServices.length}</span> of{" "}
        <span className="font-medium">{services.length}</span> services
      </div>

      {/* Services Table */}
      {filteredServices.length === 0 ? (
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
        <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-[28%] py-4 px-4">Service</TableHead>
                <TableHead className="w-[24%] py-4 px-4">Business</TableHead>
                <TableHead className="w-[10%] py-4 px-4">Price</TableHead>
                <TableHead className="w-[12%] py-4 px-4">Duration</TableHead>
                <TableHead className="w-[10%] py-4 px-4">Rating</TableHead>
                <TableHead className="w-[10%] py-4 px-4">Status</TableHead>
                <TableHead className="w-[6%] py-4 px-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServices.map((service, idx) => (
                <TableRow
                  key={service.id}
                  className="hover:bg-muted/50 cursor-pointer transition-colors border-b last:border-b-0"
                  onClick={() => handleViewDetails(service.id)}
                >
                  {/* Service Column with Image */}
                  <TableCell className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      {/* Service Image */}
                      <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted flex-shrink-0 border flex items-center justify-center">
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
                          <Badge variant="outline" className="text-xs px-1.5 py-0 h-4">
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
                      <span>{service.duration || service.EstimateDuration || 0}m</span>
                    </div>
                  </TableCell>

                  {/* Rating Column */}
                  <TableCell className="py-4 px-4">
                    {formatRating(service.rating) !== null && formatRating(service.rating)! > 0 ? (
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
                      <span className="text-xs text-muted-foreground">No ratings</span>
                    )}
                  </TableCell>

                  {/* Status Column */}
                  <TableCell className="py-4 px-4">
                    <StatusBadge status={service.isActive ? "active" : "inactive"} />
                  </TableCell>

                  {/* Actions Column */}
                  <TableCell className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => handleViewDetails(service.id)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleToggleStatus(service)}>
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
    </div>
  );
}
