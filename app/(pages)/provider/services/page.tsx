"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, Plus, List, Grid3x3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  getBusinessServices,
  getServiceStats,
  createService,
  updateService,
  deleteService,
  toggleServiceStatus,
  uploadServiceImage,
  calculateServiceStats,
  type ServiceStats,
} from "@/lib/provider/services";
import { getProviderBusiness } from "@/lib/provider/api";
import type { Service } from "@/types/provider";
import {
  ServiceFilters,
  ServiceList,
  ServiceStats as ServiceStatsComponent,
  ServiceDialog,
} from "@/components/provider/services";

type ViewMode = "grid" | "list";

export default function ProviderServicesPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [stats, setStats] = useState<ServiceStats | null>(null);
  const [businessId, setBusinessId] = useState<number | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Filter states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortBy, setSortBy] = useState<"name" | "price" | "createdAt">("createdAt");

  // Load business and services on mount
  useEffect(() => {
    loadBusinessAndServices();
  }, []);

  const loadBusinessAndServices = async () => {
    setIsLoading(true);
    try {
      // Get business ID from user data (from localStorage or JWT)
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
      setIsVerified(business.isVerified || false);
      await loadServices(business.id);
      await loadStats(business.id);
    } catch (error: any) {
      console.error("Error loading business:", error);
      toast.error("Failed to load business information");
    } finally {
      setIsLoading(false);
    }
  };

  const loadServices = async (bizId: number) => {
    try {
      const servicesList = await getBusinessServices(bizId);
      setServices(servicesList);
    } catch (error: any) {
      console.error("Error loading services:", error);
      toast.error("Failed to load services");
    }
  };

  const loadStats = async (bizId: number) => {
    try {
      const serviceStats = await getServiceStats(bizId);
      setStats(serviceStats);
    } catch (error: any) {
      console.error("Error loading stats:", error);
      // Fallback to calculated stats
      const calculated = calculateServiceStats(services);
      setStats(calculated);
    }
  };

  const handleRefresh = async () => {
    if (!businessId) return;
    setIsRefreshing(true);
    await loadServices(businessId);
    await loadStats(businessId);
    setIsRefreshing(false);
    toast.success("Services refreshed");
  };

  const handleCreateService = async (serviceData: Partial<Service> & { imageFile?: File | null }) => {
    if (!businessId) return;

    try {
      let imageUrl: string | undefined;

      // Upload image if provided
      if (serviceData.imageFile) {
        try {
          const uploadResult = await uploadServiceImage(serviceData.imageFile);
          imageUrl = uploadResult.url;
        } catch (error) {
          console.error("Failed to upload image:", error);
          toast.error("Failed to upload image");
          return;
        }
      }

      // Create service
      const newService = await createService(businessId, {
        name: serviceData.name,
        description: serviceData.description,
        price: serviceData.price,
        duration: serviceData.duration,
        image: imageUrl,
        isActive: serviceData.isActive ?? true,
      });

      toast.success("Service created successfully", {
        description: `${newService.name} has been added`,
      });

      // Refresh list and stats
      await loadServices(businessId);
      await loadStats(businessId);
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error("Error creating service:", error);
      toast.error("Failed to create service", {
        description: error.message || "Please try again",
      });
    }
  };

  const handleEditService = async (serviceData: Partial<Service> & { imageFile?: File | null }) => {
    if (!editingService || !businessId) return;

    try {
      let imageUrl = editingService.image;

      // Upload new image if provided
      if (serviceData.imageFile) {
        try {
          const uploadResult = await uploadServiceImage(serviceData.imageFile);
          imageUrl = uploadResult.url;
        } catch (error) {
          console.error("Failed to upload image:", error);
          toast.error("Failed to upload image");
          return;
        }
      }

      // Update service
      const updatedService = await updateService(editingService.id, {
        name: serviceData.name,
        description: serviceData.description,
        price: serviceData.price,
        duration: serviceData.duration,
        image: imageUrl,
        isActive: serviceData.isActive,
      });

      toast.success("Service updated successfully");

      // Refresh list and stats
      await loadServices(businessId);
      await loadStats(businessId);
      setIsDialogOpen(false);
      setEditingService(null);
    } catch (error: any) {
      console.error("Error updating service:", error);
      toast.error("Failed to update service", {
        description: error.message || "Please try again",
      });
    }
  };

  const handleDeleteService = async (serviceId: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this service? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await deleteService(serviceId);
      toast.success("Service deleted successfully");

      // Refresh list and stats
      if (businessId) {
        await loadServices(businessId);
        await loadStats(businessId);
      }
    } catch (error: any) {
      console.error("Error deleting service:", error);
      toast.error("Failed to delete service", {
        description: error.message || "Please try again",
      });
    }
  };

  const handleToggleStatus = async (serviceId: number, isActive: boolean) => {
    try {
      await toggleServiceStatus(serviceId, isActive);
      toast.success(isActive ? "Service activated" : "Service deactivated");

      // Refresh list and stats
      if (businessId) {
        await loadServices(businessId);
        await loadStats(businessId);
      }
    } catch (error: any) {
      console.error("Error toggling status:", error);
      toast.error("Failed to update status", {
        description: error.message || "Please try again",
      });
    }
  };

  const handleOpenCreateDialog = () => {
    if (!isVerified) {
      toast.error("Your business must be verified before adding services", {
        description: "Please wait for admin verification. This usually takes 1-2 business days.",
      });
      return;
    }
    setEditingService(null);
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (service: Service) => {
    setEditingService(service);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingService(null);
  };

  // Filter and sort services
  const filteredServices = services
    .filter((service) => {
      // Status filter
      if (statusFilter === "active" && !service.isActive) return false;
      if (statusFilter === "inactive" && service.isActive) return false;

      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        return (
          service.name.toLowerCase().includes(searchLower) ||
          (service.description?.toLowerCase().includes(searchLower) ?? false)
        );
      }

      return true;
    })
    .sort((a, b) => {
      // Sort
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "price":
          return a.price - b.price;
        case "createdAt":
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        default:
          return 0;
      }
    });

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Services</h1>
          <p className="text-muted-foreground">Manage your service offerings</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="icon"
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
          <Button
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            variant="outline"
            size="icon"
            title={viewMode === "grid" ? "Switch to list view" : "Switch to grid view"}
          >
            {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid3x3 className="h-4 w-4" />}
          </Button>
          <Button onClick={handleOpenCreateDialog} disabled={!isVerified}>
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <ServiceStatsComponent stats={stats} />

      {/* Filters */}
      <ServiceFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {/* Services List */}
      <ServiceList
        services={filteredServices}
        isLoading={isLoading}
        viewMode={viewMode}
        onEdit={handleOpenEditDialog}
        onDelete={handleDeleteService}
        onToggleStatus={handleToggleStatus}
      />

      {/* Create/Edit Dialog */}
      <ServiceDialog
        open={isDialogOpen}
        onOpenChange={handleCloseDialog}
        service={editingService}
        onSubmit={editingService ? handleEditService : handleCreateService}
      />
    </div>
  );
}
