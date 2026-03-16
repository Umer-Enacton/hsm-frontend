"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Wrench,
  Building2,
  MapPin,
  Clock,
  IndianRupee,
  Image as ImageIcon,
  CheckCircle,
  X,
  Ban,
  Phone,
  Calendar,
  Star,
  User,
  Mail,
} from "lucide-react";
import { api, API_ENDPOINTS } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LoadingState,
  ErrorState,
  StatusBadge,
} from "@/components/admin/shared";
import { cn } from "@/lib/utils";

interface ServiceDetails {
  id: number;
  name: string;
  description: string;
  price: number;
  duration?: number;
  EstimateDuration?: number;
  business_id?: number;
  businessProfileId?: number;
  image: string | null;
  isActive: boolean;
  created_at?: string;
  createdAt?: string;
  rating?: string | number;
  totalReviews?: number;
  business?: {
    id: number;
    name: string;
    businessName?: string;
    category?: string;
    city?: string;
    state?: string;
    phone?: string;
    logo?: string | null;
    isVerified: boolean;
    userId?: number;
    providerId?: number;
  };
  provider?: {
    id: number;
    name: string;
    email: string;
    phone?: string;
    avatar?: string | null;
  };
}

export default function ServiceDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const serviceId = params.id as string;

  const [service, setService] = useState<ServiceDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    if (serviceId) {
      fetchServiceDetails();
    }
  }, [serviceId]);

  const fetchServiceDetails = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch service details
      const serviceResponse: any = await api.get(
        API_ENDPOINTS.SERVICE_BY_ID(serviceId),
      );
      const serviceData = serviceResponse.service || serviceResponse;
      console.log("Service data:", serviceData);

      // Fetch business details
      let businessData = {};
      let providerData = {};

      try {
        const businessId =
          serviceData.business_id || serviceData.businessProfileId;
        console.log("Business ID:", businessId);

        if (businessId) {
          const businessResponse: any = await api.get(
            API_ENDPOINTS.BUSINESS_BY_ID(businessId),
          );
          const business = businessResponse.business || businessResponse;
          console.log("Business data:", business);

          const providerId = business.userId || business.providerId;
          console.log("Provider ID:", providerId);

          businessData = {
            business: {
              id: business.id,
              name: business.businessName || business.name,
              category: business.category,
              city: business.city,
              state: business.state,
              phone: business.phone,
              logo: business.logo,
              isVerified: business.isVerified,
              userId: providerId,
            },
          };

          // Fetch provider info
          if (providerId) {
            try {
              const userResponse: any = await api.get(
                `${API_ENDPOINTS.USERS}/${providerId}`,
              );
              console.log("User response:", userResponse);

              const userData = userResponse.user || userResponse;
              providerData = {
                provider: {
                  id: userData.id || providerId,
                  name: userData.name,
                  email: userData.email,
                  phone: userData.phone,
                  avatar: userData.avatar || userData.profile_image,
                },
              };
              console.log("Provider data extracted:", providerData);
            } catch (e) {
              console.log("Could not fetch provider info:", e);
            }
          } else {
            console.log("No provider ID found on business");
          }
        } else {
          console.log("No business ID found on service");
        }
      } catch (e) {
        console.log("Could not fetch business details:", e);
      }

      setService({
        ...serviceData,
        ...businessData,
        ...providerData,
        duration: serviceData.duration || serviceData.EstimateDuration,
        isActive: serviceData.isActive ?? serviceData.is_active ?? true,
      });
    } catch (err: any) {
      console.error("Failed to fetch service details:", err);
      setError(err.message || "Failed to load service details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!service) return;
    setIsActionLoading(true);
    try {
      const newStatus = !service.isActive;
      await api.patch(`${API_ENDPOINTS.SERVICE_BY_ID(serviceId)}`, {
        isActive: newStatus,
      });
      toast.success(
        `Service ${newStatus ? "activated" : "deactivated"} successfully`,
      );
      setService({ ...service, isActive: newStatus });
    } catch (error: any) {
      toast.error("Failed to update service status", {
        description: error.message || "Please try again",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this service? This action cannot be undone.",
      )
    ) {
      return;
    }
    setIsActionLoading(true);
    try {
      await api.delete(`${API_ENDPOINTS.SERVICE_BY_ID(serviceId)}`);
      toast.success("Service deleted successfully");
      router.push("/admin/services");
    } catch (error: any) {
      toast.error("Failed to delete service", {
        description: error.message || "Please try again",
      });
      setIsActionLoading(false);
    }
  };

  const formatRating = (rating: string | number | undefined): number | null => {
    if (rating === undefined || rating === null || rating === "") return null;
    const num = typeof rating === "string" ? parseFloat(rating) : rating;
    return isNaN(num) ? null : num;
  };

  if (isLoading) {
    return <LoadingState message="Loading service details..." />;
  }

  if (error || !service) {
    return (
      <ErrorState
        message={error || "Service not found"}
        onRetry={() => router.push("/admin/services")}
      />
    );
  }

  const ratingValue = formatRating(service.rating);
  const duration = service.duration || service.EstimateDuration || 0;

  return (
    <div className="space-y-3 sm:space-y-6">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/admin/services")}
          className="w-fit"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex flex-wrap items-center justify-end gap-2 flex-1">
          {service.isActive ? (
            <Button
              variant="outline"
              onClick={handleToggleStatus}
              disabled={isActionLoading}
              className="text-xs sm:text-sm"
            >
              <Ban className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              Deactivate
            </Button>
          ) : (
            <Button onClick={handleToggleStatus} disabled={isActionLoading} className="text-xs sm:text-sm">
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              Activate
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleDelete}
            disabled={isActionLoading}
            className="text-destructive hover:text-destructive text-xs sm:text-sm"
          >
            <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      {/* Cover Image Banner */}
      <Card className="overflow-hidden">
        <div className="relative h-36 sm:h-56 bg-muted">
          {service.image ? (
            <img
              src={service.image}
              alt={`${service.name} service`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center">
              <Wrench className="h-16 w-16 sm:h-24 sm:w-24 text-primary/20" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 sm:top-4 left-2 sm:left-4 flex gap-1.5 sm:gap-2">
            {service.business?.category && (
              <Badge className="bg-white/90 backdrop-blur-sm text-foreground border-0 shadow-sm px-2 py-1 text-[10px] sm:px-3 sm:py-1.5">
                {service.business.category}
              </Badge>
            )}
            {service.business?.isVerified && (
              <Badge className="bg-green-100 text-green-700 border-green-300 px-2 py-1 text-[10px] sm:px-3 sm:py-1.5">
                <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                <span className="hidden sm:inline">Verified</span>
                <span className="sm:hidden">✓</span>
              </Badge>
            )}
          </div>

          {/* Status Badge */}
          <div className="absolute top-2 sm:top-4 right-2 sm:right-4">
            <StatusBadge status={service.isActive ? "active" : "inactive"} />
          </div>

          {/* Rating Badge - Bottom Left */}
          {ratingValue !== null && ratingValue > 0 && (
            <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 bg-white/90 backdrop-blur-sm rounded-full px-2 sm:px-4 py-1 sm:py-2 shadow-sm">
              <div className="flex items-center gap-0.5 sm:gap-1">
                <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold text-xs sm:text-sm">{ratingValue.toFixed(1)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Service Info */}
        <div className="px-3 sm:px-6 pb-3 sm:pb-4 pt-1 sm:pt-2">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold truncate pr-16">{service.name}</h1>
          <p className="text-muted-foreground mt-1.5 sm:mt-2 max-w-full text-sm sm:text-base line-clamp-2">
            {service.description || "No description provided"}
          </p>

          {/* Quick Stats */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-6 mt-2 sm:mt-3">
            <div className="flex items-center gap-1 sm:gap-2 text-sm sm:text-base lg:text-lg font-bold">
              <IndianRupee className="h-3.5 w-3.5 sm:h-4 sm:h-5 sm:w-5" />
              <span>{service.price}</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 text-muted-foreground text-xs sm:text-sm">
              <Clock className="h-3 w-3 sm:h-3.5 sm:h-4 sm:w-4" />
              <span>{duration} min</span>
            </div>
            {service.business?.city && service.business?.state && (
              <div className="flex items-center gap-1 sm:gap-2 text-muted-foreground text-xs sm:text-sm truncate">
                <MapPin className="h-3 w-3 sm:h-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">
                  {service.business.city}, {service.business.state}
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Two Column Layout */}
      <div className="grid gap-3 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Left Column - Business & Provider Info */}
        <div className="space-y-3 sm:space-y-6">
          {/* Business Information Card */}

          {/* Provider Information Card */}
          {service.provider && (
            <Card>
              <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <User className="h-4 w-4 sm:h-5 sm:w-5" />
                  Provider / Owner
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <Avatar className="h-12 w-12 sm:h-14 sm:w-14 border-2 rounded-sm p-1.5 sm:p-2 flex-shrink-0">
                    {service.provider.avatar ? (
                      <AvatarImage
                        src={service.provider.avatar}
                        alt={service.provider.name}
                      />
                    ) : (
                      <AvatarFallback className="text-base sm:text-xl bg-primary text-primary-foreground">
                        {service.provider.name?.charAt(0)?.toUpperCase() || "P"}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1 min-w-0 space-y-1 sm:space-y-1.5">
                    <p className="font-semibold text-sm sm:text-base truncate">{service.provider.name}</p>
                    {service.provider.email && (
                      <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                        <Mail className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                        <a
                          href={`mailto:${service.provider.email}`}
                          className="text-primary hover:underline truncate"
                        >
                          {service.provider.email}
                        </a>
                      </div>
                    )}
                    {service.provider.phone && (
                      <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                        <Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                        <span className="truncate">{service.provider.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {service.business && (
            <Card>
              <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
                  Business Information
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 sm:space-y-4">
                <div className="flex items-start gap-2.5 sm:gap-3">
                  {service.business.logo && (
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg overflow-hidden border flex-shrink-0">
                      <img
                        src={service.business.logo}
                        alt={service.business.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base truncate">
                      {service.business.name}
                    </h3>
                    {service.business.category && (
                      <Badge variant="outline" className="mt-1 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
                        {service.business.category}
                      </Badge>
                    )}
                  </div>
                </div>

                {service.business.city && service.business.state && (
                  <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="truncate">
                      {service.business.city}, {service.business.state}
                    </span>
                  </div>
                )}

                {service.business.phone && (
                  <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="truncate">{service.business.phone}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Service Details */}
        <div className="space-y-3 sm:space-y-6">
          {/* Service Details Card */}
          <Card>
            <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
              <CardTitle className="text-base sm:text-lg">Service Details</CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-3 sm:space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Service ID</p>
                  <p className="font-mono text-xs sm:text-sm">#{service.id}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Status</p>
                  <StatusBadge
                    status={service.isActive ? "active" : "inactive"}
                  />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Price</p>
                  <div className="flex items-center gap-1 font-semibold text-sm sm:text-base">
                    <IndianRupee className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span>{service.price}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Duration</p>
                  <div className="flex items-center gap-1 text-xs sm:text-sm">
                    <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                    <span>{duration} min</span>
                  </div>
                </div>
              </div>

              {ratingValue !== null && ratingValue > 0 && (
                <div className="pt-2 sm:pt-3 border-t">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Rating</p>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium text-sm sm:text-base">
                      {ratingValue.toFixed(1)}
                    </span>
                    {service.totalReviews && (
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        ({service.totalReviews}{" "}
                        {service.totalReviews === 1 ? "review" : "reviews"})
                      </span>
                    )}
                  </div>
                </div>
              )}

              {service.createdAt && (
                <div className="pt-2 sm:pt-3 border-t">
                  <p className="text-xs sm:text-sm text-muted-foreground">Created</p>
                  <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                    <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                    <span>
                      {new Date(service.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Service Image Card */}
          {/* {service.image && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Service Image
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg overflow-hidden border">
                  <img
                    src={service.image}
                    alt={service.name}
                    className="w-full h-auto object-cover"
                  />
                </div>
              </CardContent>
            </Card>
          )} */}
        </div>
      </div>
    </div>
  );
}
