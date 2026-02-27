"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Star,
  CheckCircle,
  Clock,
  X,
  Trash2,
  Calendar,
  Wrench,
  DollarSign,
  User,
  IndianRupee,
} from "lucide-react";
import { api, API_ENDPOINTS } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  verifyBusiness,
  unverifyBusiness,
  deleteBusiness,
} from "@/lib/admin/business";
import {
  LoadingState,
  ErrorState,
  StatusBadge,
} from "@/components/admin/shared";
import type { Business } from "@/types/provider";

interface Service {
  id: number;
  name: string;
  description?: string;
  price: number;
  duration?: number;
  isActive: boolean;
  image?: string | null;
}

interface BusinessDetails extends Business {
  providerEmail?: string;
  providerPhone?: string;
  providerAvatar?: string | null;
  website?: string;
  services?: Service[];
  totalServices?: number;
  activeServices?: number;
  rating?: number;
  totalReviews?: number;
}

export default function BusinessDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const businessId = params.id as string;

  const [business, setBusiness] = useState<BusinessDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    if (businessId) {
      fetchBusinessDetails();
    }
  }, [businessId]);

  const fetchBusinessDetails = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch business details
      const businessResponse: any = await api.get(
        API_ENDPOINTS.BUSINESS_BY_ID(businessId),
      );
      const businessData = businessResponse.business || businessResponse;

      console.log("Business data:", businessData);
      console.log(
        "Has userId:",
        businessData.userId || businessData.providerId,
      );
      console.log("Has providerName:", businessData.providerName);
      console.log("Has email:", businessData.email);

      // Fetch provider info
      let providerInfo = {};
      try {
        if (businessData.userId || businessData.providerId) {
          const userId = businessData.userId || businessData.providerId;
          console.log("Fetching user data for userId:", userId);
          const userResponse: any = await api.get(
            `${API_ENDPOINTS.USERS}/${userId}`,
          );
          console.log("User response:", userResponse);

          providerInfo = {
            providerEmail: userResponse.email,
            providerPhone: userResponse.phone,
            providerAvatar:
              userResponse.user.avatar ||
              userResponse.profile_image ||
              userResponse.profileImage,
          };
          console.log("Provider info extracted:", providerInfo);
        }
      } catch (e) {
        console.log("Could not fetch provider info:", e);
      }

      // If provider info fetch failed, use data from business
      if (!providerInfo.providerEmail && businessData.email) {
        providerInfo.providerEmail = businessData.email;
        console.log("Using business email:", businessData.email);
      }

      // if (!providerInfo.providerAvatar && businessData.logo) {
      //   console.log(providerInfo);
      //   providerInfo.providerAvatar = businessData.logo;
      // }

      console.log("Final provider info:", providerInfo);

      // Fetch services
      let servicesData: Service[] = [];
      try {
        const servicesResponse: any = await api.get(
          API_ENDPOINTS.SERVICES_BY_BUSINESS(businessId),
        );
        servicesData = Array.isArray(servicesResponse)
          ? servicesResponse
          : servicesResponse?.services || servicesResponse?.data || [];
      } catch (e) {
        console.log("Could not fetch services");
      }

      const activeServicesCount = servicesData.filter((s) => s.isActive).length;

      setBusiness({
        ...businessData,
        ...providerInfo,
        services: servicesData,
        totalServices: servicesData.length,
        activeServices: activeServicesCount,
      });
    } catch (err: any) {
      console.error("Failed to fetch business details:", err);
      setError(err.message || "Failed to load business details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!business) return;

    setIsActionLoading(true);
    try {
      const result = await verifyBusiness(Number(businessId));
      toast.success("Business verified successfully");
      setBusiness({ ...business, isVerified: true });
      window.dispatchEvent(new CustomEvent("business-updated"));
    } catch (error: any) {
      toast.error("Failed to verify business", {
        description: error.message || "Please try again",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleUnverify = async () => {
    if (!business) return;

    setIsActionLoading(true);
    try {
      const result = await unverifyBusiness(Number(businessId));
      toast.success("Business unverified");
      setBusiness({ ...business, isVerified: false });
      window.dispatchEvent(new CustomEvent("business-updated"));
    } catch (error: any) {
      toast.error("Failed to unverify business", {
        description: error.message || "Please try again",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this business? This action cannot be undone and will delete all associated data.",
      )
    ) {
      return;
    }

    setIsActionLoading(true);
    try {
      await deleteBusiness(Number(businessId));
      toast.success("Business deleted successfully");
      router.push("/admin/business");
    } catch (error: any) {
      toast.error("Failed to delete business", {
        description: error.message || "Please try again",
      });
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading business details..." />;
  }

  if (error || !business) {
    return (
      <ErrorState
        message={error || "Business not found"}
        onRetry={() => router.push("/admin/business")}
      />
    );
  }
  console.log("final business", business);

  return (
    <div className="space-y-6 ">
      {/* Navigation Header (Below cover) */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/admin/business")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center justify-end w-full gap-2">
          {business.isVerified ? (
            <Button
              variant="outline"
              onClick={handleUnverify}
              disabled={isActionLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Unverify Business
            </Button>
          ) : (
            <Button onClick={handleVerify} disabled={isActionLoading}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Verify Business
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleDelete}
            disabled={isActionLoading}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Business
          </Button>
        </div>
      </div>
      {/* Cover Image Banner */}
      <Card className="overflow-hidden">
        <div className="relative h-48 bg-muted">
          {business.coverImage || business.logo ? (
            <img
              src={business.coverImage || business.logo}
              alt={`${business.name} cover`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center">
              <Building2 className="h-24 w-24 text-primary/20" />
            </div>
          )}

          {/* Logo Overlay - Bottom Left */}
          {(business.logo || (!business.logo && !business.coverImage)) && (
            <div className="absolute -bottom-6 left-6">
              <div className="h-20 w-20 rounded-xl border-4 border-background overflow-hidden bg-card shadow-lg">
                {business.logo ? (
                  <img
                    src={business.logo}
                    alt={business.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-primary flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary-foreground">
                      {business.name?.charAt(0) || "B"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Verification Badge - Top Right */}
          <div className="absolute top-4 right-4">
            {business.isVerified ? (
              <Badge className="bg-green-100 text-green-700 border-green-300 px-3 py-1.5">
                <CheckCircle className="h-4 w-4 mr-1" />
                Verified
              </Badge>
            ) : (
              <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300 px-3 py-1.5">
                <Clock className="h-4 w-4 mr-1" />
                Pending Verification
              </Badge>
            )}
          </div>

          {/* Category Badge - Top Left */}
          {business.category && (
            <div className="absolute top-4 left-4">
              <Badge className="bg-white/90 backdrop-blur-sm text-foreground border-0 shadow-sm px-3 py-1.5">
                {business.category}
              </Badge>
            </div>
          )}
        </div>

        {/* Business Info Below Cover */}
        <div className="px-6 pb-4 pt-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{business.name}</h1>
              {business.rating && (
                <div className="flex items-center gap-2 mt-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">
                    {business.rating.toFixed(1)}
                  </span>
                  {business.totalReviews && (
                    <span className="text-sm text-muted-foreground">
                      ({business.totalReviews}{" "}
                      {business.totalReviews === 1 ? "review" : "reviews"})
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Action Bar */}

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Provider & Business Info */}
        <div className="space-y-6">
          {/* Provider Information Card */}
          <Card className="gap-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Provider / Owner Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                {/* Provider Avatar */}
                <Avatar className="h-16 w-16 border-2 rounded-sm p-2">
                  {business.providerAvatar ? (
                    <AvatarImage
                      src={business.providerAvatar}
                      alt={business.providerName || "Provider"}
                    />
                  ) : (
                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                      {business.providerName?.charAt(0)?.toUpperCase() || "P"}
                    </AvatarFallback>
                  )}
                </Avatar>

                {/* Provider Details */}
                <div className="flex-1 space-y-3">
                  {business.providerName && (
                    <div>
                      <p className="text-base font-semibold">
                        {business.providerName}
                      </p>
                    </div>
                  )}

                  {business.providerEmail && (
                    <div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`mailto:${business.providerEmail}`}
                          className="text-primary hover:underline"
                        >
                          {business.providerEmail}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {business.description && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    Description
                  </h4>
                  <p className="text-sm">{business.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {business.city && business.state && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      Location
                    </h4>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {business.city}, {business.state}
                      </span>
                    </div>
                  </div>
                )}

                {business.phone && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      Business Phone
                    </h4>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{business.phone}</span>
                    </div>
                  </div>
                )}

                {business.category && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      Category
                    </h4>
                    <Badge variant="outline">{business.category}</Badge>
                  </div>
                )}

                {business.website && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      Website
                    </h4>
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={business.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {business.website}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {business.rating && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    Rating
                  </h4>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="ml-1 font-medium">
                        {business.rating.toFixed(1)}
                      </span>
                    </div>
                    {business.totalReviews && (
                      <span className="text-sm text-muted-foreground">
                        ({business.totalReviews}{" "}
                        {business.totalReviews === 1 ? "review" : "reviews"})
                      </span>
                    )}
                  </div>
                </div>
              )}

              {business.createdAt && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    Joined
                  </h4>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {new Date(business.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Services Section (2/3 width) */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Services ({business.totalServices || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {business.services && business.services.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {business.services.map((service) => (
                    <Card
                      key={service.id}
                      className="group hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => router.push(`/admin/services/${service.id}`)}
                    >
                      <CardContent className="p-4 space-y-3">
                        {/* Service Name & Status */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                              {service.name}
                            </h3>
                            <p className="text-xs text-muted-foreground truncate">
                              {business.name}
                            </p>
                          </div>
                          <StatusBadge
                            status={service.isActive ? "active" : "inactive"}
                          />
                        </div>

                        {/* Description */}
                        {service.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {service.description}
                          </p>
                        )}

                        {/* Meta Info */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          {/* Rating */}
                          {business.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium text-foreground">
                                {business.rating.toFixed(1)}
                              </span>
                              <span className="text-muted-foreground">
                                ({business.totalReviews || 0})
                              </span>
                            </div>
                          )}

                          {/* Location */}
                          {business.city && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">{business.city}</span>
                            </div>
                          )}

                          {/* Duration */}
                          {service.duration && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{service.duration}m</span>
                            </div>
                          )}
                        </div>

                        {/* Price & View Button */}
                        <div className="flex items-center justify-between pt-2 border-t">
                          <div>
                            <span className="text-lg font-bold flex items-center">
                              <IndianRupee className="h-4 w-4" />
                              {service.price}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            className="h-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/admin/services/${service.id}`);
                            }}
                          >
                            View
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <Wrench className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-medium mb-1">No services yet</p>
                  <p className="text-sm">
                    This business hasn't added any services.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
