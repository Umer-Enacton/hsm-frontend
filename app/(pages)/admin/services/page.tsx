"use client";

import { useState, useEffect } from "react";
import { Wrench, Filter } from "lucide-react";
import { api, API_ENDPOINTS } from "@/lib/api";
import { toast } from "sonner";
import {
  AdminPageHeader,
  StatCard,
  LoadingState,
  ErrorState,
  ViewToggleButtons,
  EmptyState,
  StatusBadge,
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Ban, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  duration: number;
  business_id: number;
  business_name?: string;
  category_name?: string;
  is_active: boolean;
  created_at: string;
}

interface ServiceStats {
  total: number;
  active: number;
  inactive: number;
}

type ViewMode = "grid" | "list";

export default function AdminServicesPage() {
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
  const [viewMode, setViewMode] = useState<ViewMode>("list");
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

      const servicesResponse: any = await api.get(API_ENDPOINTS.SERVICES);
      const data = Array.isArray(servicesResponse) ? servicesResponse : (servicesResponse?.services || servicesResponse?.data || []);

      // Fetch businesses to get names
      const businessesResponse: any = await api.get(API_ENDPOINTS.BUSINESSES);
      const businesses = Array.isArray(businessesResponse) ? businessesResponse : (businessesResponse?.businesses || businessesResponse?.data || []);
      const businessMap = new Map(businesses.map((b: any) => [b.id, b.name]));

      const servicesWithBusinessNames = data.map((service) => ({
        ...service,
        business_name: businessMap.get(service.business_id) || "Unknown",
      }));

      setServices(servicesWithBusinessNames);

      // Calculate stats
      const activeCount = servicesWithBusinessNames.filter((s) => s.is_active).length;
      setStats({
        total: servicesWithBusinessNames.length,
        active: activeCount,
        inactive: servicesWithBusinessNames.length - activeCount,
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
    if (statusFilter !== "all") {
      if (statusFilter === "active") {
        filtered = filtered.filter((s) => s.is_active);
      } else if (statusFilter === "inactive") {
        filtered = filtered.filter((s) => !s.is_active);
      }
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.business_name?.toLowerCase().includes(query) ||
          s.description?.toLowerCase().includes(query)
      );
    }

    setFilteredServices(filtered);
  };

  const handleToggleStatus = async (service: Service) => {
    try {
      const newStatus = !service.is_active;
      await api.patch(`${API_ENDPOINTS.SERVICE_BY_ID(service.id)}`, {
        is_active: newStatus,
      });
      toast.success(
        `Service ${newStatus ? "activated" : "deactivated"} successfully`
      );
      fetchServices();
    } catch (err: any) {
      toast.error("Failed to update service status");
    }
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

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Services"
          value={stats.total}
          icon={Wrench}
        />
        <StatCard
          title="Active Services"
          value={stats.active}
          change={`${Math.round((stats.active / stats.total) * 100) || 0}% of total`}
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
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <ViewToggleButtons viewMode={viewMode} onViewModeChange={setViewMode} />
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing <span className="font-medium">{filteredServices.length}</span>{" "}
        services
      </div>

      {/* Content */}
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
      ) : viewMode === "list" ? (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[25%]">Service Name</TableHead>
                <TableHead className="w-[20%]">Business</TableHead>
                <TableHead className="w-[15%]">Price</TableHead>
                <TableHead className="w-[15%]">Duration</TableHead>
                <TableHead className="w-[15%]">Status</TableHead>
                <TableHead className="w-[10%]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServices.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{service.name}</div>
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {service.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{service.business_name}</TableCell>
                  <TableCell>${service.price}</TableCell>
                  <TableCell>{service.duration} mins</TableCell>
                  <TableCell>
                    {service.is_active ? (
                      <StatusBadge status="active" />
                    ) : (
                      <StatusBadge status="inactive" />
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(service)}
                        >
                          {service.is_active ? (
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
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredServices.map((service) => (
            <Card
              key={service.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold line-clamp-1">{service.name}</h3>
                  {service.is_active ? (
                    <StatusBadge status="active" />
                  ) : (
                    <StatusBadge status="inactive" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {service.description}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {service.business_name}
                  </span>
                  <span className="font-medium">${service.price}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {service.duration} mins
                  </span>
                </div>
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleToggleStatus(service)}
                  >
                    {service.is_active ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
