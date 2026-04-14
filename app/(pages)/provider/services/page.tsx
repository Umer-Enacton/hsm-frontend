"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Plus, List, Grid3x3, AlertTriangle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ProviderServicesSkeleton } from "@/components/provider/skeletons";
import {
  useProviderServices,
  useCreateService,
  useUpdateService,
  useDeleteService,
  useToggleServiceStatus,
  useUploadServiceImage,
} from "@/lib/queries/use-provider-services";
import { useProviderBusinessProfile } from "@/lib/queries/use-provider-business-profile";
import { getUserData } from "@/lib/auth-utils";
import { api, API_ENDPOINTS } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import type { Service } from "@/types/provider";
import type { ServiceStats } from "@/lib/provider/services";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ServiceFilters,
  ServiceList,
  ServiceStats as ServiceStatsComponent,
  ServiceDialog,
  ServiceReviews,
} from "@/components/provider/services";

interface ProviderSubscription {
  planMaxServices: number;
  planName: string;
  status: string;
}

type ViewMode = "grid" | "list";

export default function ProviderServicesPage() {
  const router = useRouter();
  const userData = getUserData();

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Subscription state
  const [subscription, setSubscription] = useState<ProviderSubscription | null>(null);

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [reviewsService, setReviewsService] = useState<Service | null>(null);
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false);

  // Filter states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortBy, setSortBy] = useState<"name" | "price" | "createdAt">("createdAt");

  // Deletion state
  const [serviceToDelete, setServiceToDelete] = useState<number | null>(null);

  // Fetch business profile (includes business and isVerified status)
  const { business, isLoading: isLoadingBusiness } = useProviderBusinessProfile(userData?.id);

  // Fetch services using cached hook
  const {
    data: services = [],
    isLoading: isLoadingServices,
    refetch: refetchServices,
  } = useProviderServices(business?.id);

  // Mutations
  const createServiceMutation = useCreateService();
  const updateServiceMutation = useUpdateService();
  const deleteServiceMutation = useDeleteService();
  const toggleStatusMutation = useToggleServiceStatus();
  const uploadImageMutation = useUploadServiceImage();

  const isLoading = isLoadingBusiness || Boolean(business?.id && isLoadingServices);

  // Fetch provider subscription
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const response = await api.get<{ message: string; data: ProviderSubscription }>(
          API_ENDPOINTS.PROVIDER_SUBSCRIPTION_CURRENT
        );
        if (response?.data) {
          setSubscription(response.data);
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
      }
    };

    if (userData?.id) {
      fetchSubscription();
    }
  }, [userData?.id]);

  // Calculate service limit info
  const serviceLimitInfo = useMemo(() => {
    if (!subscription || subscription.planMaxServices < 0) {
      return { hasLimit: false, remaining: Infinity, percentage: 0, atLimit: false };
    }

    const current = services.length;
    const max = subscription.planMaxServices;
    const remaining = Math.max(0, max - current);
    const percentage = Math.min(100, (current / max) * 100);
    const atLimit = current >= max;

    return { hasLimit: true, remaining, percentage, atLimit, current, max };
  }, [subscription, services.length]);

  // Redirect if no business
  if (!isLoadingBusiness && !business) {
    router.push("/onboarding");
    return null;
  }

  const handleRefresh = async () => {
    await refetchServices();
    toast.success("Services refreshed");
  };

  const handleCreateService = async (serviceData: Partial<Service> & { imageFile?: File | null }) => {
    if (!business?.id) return;

    let imageUrl: string | undefined;

    // Upload image if provided
    if (serviceData.imageFile) {
      const uploadResult = await uploadImageMutation.mutateAsync(serviceData.imageFile);
      imageUrl = uploadResult.url;
    }

    createServiceMutation.mutate(
      {
        businessId: business.id,
        serviceData: {
          name: serviceData.name!,
          description: serviceData.description,
          price: serviceData.price!,
          duration: serviceData.duration,
          image: imageUrl,
          isActive: serviceData.isActive ?? true,
          maxAllowBooking: serviceData.maxAllowBooking,
        },
      },
      {
        onSuccess: () => {
          setIsDialogOpen(false);
        },
      }
    );
  };

  const handleEditService = async (serviceData: Partial<Service> & { imageFile?: File | null }) => {
    if (!editingService || !business?.id) return;

    let imageUrl: string | undefined = editingService.image || undefined;

    // Upload new image if provided
    if (serviceData.imageFile) {
      const uploadResult = await uploadImageMutation.mutateAsync(serviceData.imageFile);
      imageUrl = uploadResult.url;
    }

    updateServiceMutation.mutate(
      {
        serviceId: editingService.id,
        serviceData: {
          name: serviceData.name!,
          description: serviceData.description,
          price: serviceData.price!,
          duration: serviceData.duration,
          image: imageUrl,
          isActive: serviceData.isActive,
          maxAllowBooking: serviceData.maxAllowBooking,
        },
      },
      {
        onSuccess: () => {
          setIsDialogOpen(false);
          setEditingService(null);
        },
      }
    );
  };

  const handleDeleteService = async () => {
    if (!serviceToDelete) return;

    deleteServiceMutation.mutate(
      { serviceId: serviceToDelete, businessId: business?.id },
      {
        onSuccess: () => {
          setServiceToDelete(null);
          // Service deleted, cache invalidated automatically
        },
      }
    );
  };

  const handleToggleStatus = async (serviceId: number, isActive: boolean) => {
    toggleStatusMutation.mutate(
      { serviceId, isActive, businessId: business?.id },
      {
        onSuccess: () => {
          // Status toggled, cache invalidated automatically
        },
      }
    );
  };

  const handleViewReviews = (service: Service) => {
    setReviewsService(service);
    setIsReviewsDialogOpen(true);
  };

  const handleCloseReviewsDialog = () => {
    setIsReviewsDialogOpen(false);
    setReviewsService(null);
  };

  const handleOpenCreateDialog = () => {
    if (!business?.isVerified) {
      toast.error("Your business must be verified before adding services", {
        description: "Please wait for admin verification. This usually takes 1-2 business days.",
      });
      return;
    }

    // Check service limit
    if (serviceLimitInfo.atLimit) {
      toast.error("Service limit reached", {
        description: `You've reached your ${subscription?.planName} plan limit of ${serviceLimitInfo.max} services. Upgrade to add more.`,
        action: {
          label: "Upgrade",
          onClick: () => router.push("/provider/subscription"),
        },
      });
      return;
    }

    // Warn if approaching limit
    if (serviceLimitInfo.hasLimit && serviceLimitInfo.remaining <= 2) {
      toast.warning(`You can add ${serviceLimitInfo.remaining} more service${serviceLimitInfo.remaining === 1 ? '' : 's'} on your current plan.`, {
        description: "Consider upgrading to increase your service limit.",
        action: {
          label: "View Plans",
          onClick: () => router.push("/provider/subscription"),
        },
      });
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

  // Calculate stats from services (matching ServiceStats interface)
  const stats = {
    total: services.length,
    active: services.filter((s) => s.isActive === true).length,
    inactive: services.filter((s) => s.isActive !== true).length,
    averagePrice: services.length > 0
      ? Math.round(services.reduce((sum, s) => sum + s.price, 0) / services.length)
      : 0,
  };

  // Filter and sort services
  const filteredServices = services
    .filter((service) => {
      // Status filter - handle undefined as inactive
      const isActive = service.isActive === true;
      if (statusFilter === "active" && !isActive) return false;
      if (statusFilter === "inactive" && isActive) return false;

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
    return <ProviderServicesSkeleton />;
  }

  const isAnyMutationPending =
    createServiceMutation.isPending ||
    updateServiceMutation.isPending ||
    deleteServiceMutation.isPending ||
    toggleStatusMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Services</h1>
          <p className="text-muted-foreground">Manage your service offerings</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="icon"
            disabled={isAnyMutationPending}
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="h-8 w-8 p-0"
            title="Grid view"
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="h-8 w-8 p-0"
            title="List view"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleOpenCreateDialog}
            disabled={!business?.isVerified || serviceLimitInfo.atLimit}
            className="whitespace-nowrap"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Add Service</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Service Limit Warning Banner */}
      {serviceLimitInfo.hasLimit && (
        <Alert className={`border-2 ${
          serviceLimitInfo.atLimit
            ? "border-red-200 bg-red-50"
            : serviceLimitInfo.remaining <= 2
            ? "border-amber-200 bg-amber-50"
            : "border-blue-200 bg-blue-50"
        }`}>
          {serviceLimitInfo.atLimit ? (
            <AlertCircle className="h-4 w-4 text-red-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          )}
          <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className={`font-semibold ${
                serviceLimitInfo.atLimit ? "text-red-800" : "text-amber-800"
              }`}>
                {serviceLimitInfo.atLimit
                  ? "Service Limit Reached"
                  : `Service Limit: ${serviceLimitInfo.current}/${serviceLimitInfo.max}`}
              </p>
              <p className={`text-sm ${
                serviceLimitInfo.atLimit ? "text-red-700" : "text-amber-700"
              }`}>
                {serviceLimitInfo.atLimit
                  ? `You've reached the maximum number of services on your ${subscription?.planName} plan. Upgrade to add more services.`
                  : `You can add ${serviceLimitInfo.remaining} more service${serviceLimitInfo.remaining === 1 ? '' : 's'} on your current plan.`}
              </p>
            </div>
            <Button
              onClick={() => router.push("/provider/subscription")}
              variant={serviceLimitInfo.atLimit ? "default" : "outline"}
              size="sm"
              className={serviceLimitInfo.atLimit
                ? "bg-red-600 hover:bg-red-700 text-white"
                : ""
              }
            >
              {serviceLimitInfo.atLimit ? "Upgrade Now" : "View Plans"}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Service Limit Progress Bar (when not at limit) */}
      {serviceLimitInfo.hasLimit && !serviceLimitInfo.atLimit && (
        <div className="rounded-lg border bg-muted/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Service Usage</span>
            <span className="text-sm text-muted-foreground">
              {serviceLimitInfo.current} of {serviceLimitInfo.max} services
            </span>
          </div>
          <Progress
            value={serviceLimitInfo.percentage}
            className={`h-2 ${
              serviceLimitInfo.percentage >= 80
                ? "[&>div]:bg-red-500"
                : serviceLimitInfo.percentage >= 60
                ? "[&>div]:bg-amber-500"
                : "[&>div]:bg-green-500"
            }`}
          />
        </div>
      )}

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
        onDelete={(id) => setServiceToDelete(id)}
        onToggleStatus={handleToggleStatus}
        onViewReviews={handleViewReviews}
      />

      {/* Create/Edit Dialog */}
      <ServiceDialog
        open={isDialogOpen}
        onOpenChange={handleCloseDialog}
        service={editingService}
        onSubmit={editingService ? handleEditService : handleCreateService}
      />

      {/* Reviews Dialog */}
      <ServiceReviews
        serviceId={reviewsService?.id || 0}
        serviceName={reviewsService?.name || ""}
        serviceRating={Number(reviewsService?.rating || 0)}
        totalReviews={reviewsService?.totalReviews || 0}
        open={isReviewsDialogOpen}
        onOpenChange={setIsReviewsDialogOpen}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={serviceToDelete !== null} onOpenChange={(open) => !open && setServiceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this service? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteServiceMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteService}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              disabled={deleteServiceMutation.isPending}
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
