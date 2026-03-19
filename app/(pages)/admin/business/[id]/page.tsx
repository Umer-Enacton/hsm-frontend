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
  Calendar,
  Wrench,
  DollarSign,
  User,
  IndianRupee,
  Ban,
  ShieldCheck,
} from "lucide-react";
import { api, API_ENDPOINTS } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  verifyBusiness,
  blockBusiness,
  unblockBusiness,
} from "@/lib/admin/business";
import {
  LoadingState,
  ErrorState,
  StatusBadge,
} from "@/components/admin/shared";
import { AdminBusinessDetailSkeleton } from "@/components/admin/skeletons";
import { BlockBusinessDialog } from "@/components/admin/BlockBusinessDialog";
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

interface ProviderInfo {
  providerEmail?: string;
  providerPhone?: string;
  providerAvatar?: string | null;
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
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);

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
      let providerInfo: ProviderInfo = {};
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

  const handleBlock = async () => {
    setIsBlockDialogOpen(true);
  };

  const handleUnblock = async () => {
    if (!business) return;

    setIsActionLoading(true);
    try {
      const result = await unblockBusiness(Number(businessId));
      toast.success("Business unblocked successfully", {
        description: `${business.name} can now receive new bookings`,
      });
      setBusiness({
        ...business,
        isBlocked: false,
        blockedReason: null,
        blockedAt: null,
      });
      window.dispatchEvent(new CustomEvent("business-updated"));
    } catch (error: any) {
      toast.error("Failed to unblock business", {
        description: error.message || "Please try again",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleBlocked = () => {
    // Refresh business details after blocking
    fetchBusinessDetails();
  };

  if (isLoading) {
    return <AdminBusinessDetailSkeleton />;
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
    <div className="space-y-3 sm:space-y-6">
      {/* Navigation Header (Below cover) */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/admin/business")}
          className="w-fit"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex flex-wrap items-center justify-end gap-2 flex-1">
          {!business.isVerified ? (
            <Button
              onClick={handleVerify}
              disabled={isActionLoading}
              className="text-xs sm:text-sm"
            >
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              Verify
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={handleVerify}
              disabled={isActionLoading}
              className="text-xs sm:text-sm text-green-600 border-green-600"
            >
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              Verified
            </Button>
          )}
          {business.isBlocked ? (
            <Button
              variant="outline"
              onClick={handleUnblock}
              disabled={isActionLoading}
              className="text-xs sm:text-sm text-green-600 hover:text-green-700 border-green-600 hover:bg-green-50"
            >
              <ShieldCheck className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              Unblock
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={handleBlock}
              disabled={isActionLoading}
              className="text-xs sm:text-sm text-destructive hover:text-destructive border-destructive"
            >
              <Ban className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              Block Business
            </Button>
          )}
        </div>
      </div>
      {/* Cover Image Banner */}
      <Card className="overflow-hidden py-0">
        <div className="relative h-36 sm:h-48 bg-muted">
          {business.coverImage || business.logo ? (
            <img
              src={business.coverImage || business.logo || undefined}
              alt={`${business.name} cover`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center">
              <Building2 className="h-16 w-16 sm:h-24 sm:w-24 text-primary/20" />
            </div>
          )}

          {/* Logo Overlay - Bottom Left */}
          {(business.logo || (!business.logo && !business.coverImage)) && (
            <div className="absolute -bottom-4 sm:-bottom-6 left-3 sm:left-6">
              <div className="h-14 w-14 sm:h-20 sm:w-20 rounded-xl border-4 border-background overflow-hidden bg-card shadow-lg">
                {business.logo ? (
                  <img
                    src={business.logo}
                    alt={business.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-primary flex items-center justify-center">
                    <span className="text-xl sm:text-2xl font-bold text-primary-foreground">
                      {business.name?.charAt(0) || "B"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Badges - Top Right */}
          <div className="absolute top-2 sm:top-4 right-2 sm:right-4 flex flex-col gap-1 items-end">
            {business.isBlocked ? (
              <Badge className="bg-red-100 text-red-700 border-red-300 px-2 py-1 text-[10px] sm:px-3 sm:py-1.5">
                <Ban className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
                <span className="hidden sm:inline">Blocked</span>
                <span className="sm:hidden">Blocked</span>
              </Badge>
            ) : business.isVerified ? (
              <Badge className="bg-green-100 text-green-700 border-green-300 px-2 py-1 text-[10px] sm:px-3 sm:py-1.5">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
                <span className="hidden sm:inline">Verified</span>
                <span className="sm:hidden">Verified</span>
              </Badge>
            ) : (
              <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300 px-2 py-1 text-[10px] sm:px-3 sm:py-1.5">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
                <span className="hidden sm:inline">Pending</span>
                <span className="sm:hidden">Pending</span>
              </Badge>
            )}
          </div>

          {/* Category Badge - Top Left */}
          {business.category && (
            <div className="absolute top-2 sm:top-4 left-2 sm:left-4">
              <Badge className="bg-white/90 backdrop-blur-sm text-foreground border-0 shadow-sm px-2 py-1 text-[10px] sm:px-3 sm:py-1.5">
                {business.category}
              </Badge>
            </div>
          )}
        </div>

        {/* Business Info Below Cover */}
        <div className="px-3 sm:px-6 pb-3 sm:pb-4 pt-1 sm:pt-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold truncate">
                {business.name}
              </h1>
              {business.rating && (
                <div className="flex items-center gap-1.5 sm:gap-2 mt-1">
                  <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-sm sm:text-base">
                    {business.rating.toFixed(1)}
                  </span>
                  {business.totalReviews && (
                    <span className="text-xs sm:text-sm text-muted-foreground">
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
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Left Column - Provider & Business Info */}
        <div className="space-y-4 sm:space-y-6">
          {/* Provider Information Card */}
          <Card className="gap-0">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg">
                <User className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="truncate">Provider / Owner</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 sm:gap-4">
                {/* Provider Avatar */}
                <Avatar className="h-12 w-12 sm:h-16 sm:w-16 border-2 rounded-sm p-2 flex-shrink-0">
                  {business.providerAvatar ? (
                    <AvatarImage
                      src={business.providerAvatar}
                      alt={business.providerName || "Provider"}
                    />
                  ) : (
                    <AvatarFallback className="text-xl sm:text-2xl bg-primary text-primary-foreground">
                      {business.providerName?.charAt(0)?.toUpperCase() || "P"}
                    </AvatarFallback>
                  )}
                </Avatar>

                {/* Provider Details */}
                <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
                  {business.providerName && (
                    <div>
                      <p className="text-sm sm:text-base font-semibold truncate">
                        {business.providerName}
                      </p>
                    </div>
                  )}

                  {business.providerEmail && (
                    <div>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                        <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                        <a
                          href={`mailto:${business.providerEmail}`}
                          className="text-primary hover:underline truncate"
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
          <Card className="gap-0">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg">
                <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="truncate">Business Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              {business.description && (
                <div>
                  <h4 className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">
                    Description
                  </h4>
                  <p className="text-xs sm:text-sm line-clamp-2">
                    {business.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {business.city && business.state && (
                  <div>
                    <h4 className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">
                      Location
                    </h4>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                      <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">
                        {business.city}, {business.state}
                      </span>
                    </div>
                  </div>
                )}

                {business.phone && (
                  <div>
                    <h4 className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">
                      Business Phone
                    </h4>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                      <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{business.phone}</span>
                    </div>
                  </div>
                )}

                {business.category && (
                  <div>
                    <h4 className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">
                      Category
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {business.category}
                    </Badge>
                  </div>
                )}

                {business.website && (
                  <div>
                    <h4 className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">
                      Website
                    </h4>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                      <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                      <a
                        href={business.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline truncate"
                      >
                        {business.website}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {business.rating && (
                <div>
                  <h4 className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">
                    Rating
                  </h4>
                  <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                    <div className="flex items-center">
                      <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                      <span className="ml-1 font-medium">
                        {business.rating.toFixed(1)}
                      </span>
                    </div>
                    {business.totalReviews && (
                      <span className="text-muted-foreground">
                        ({business.totalReviews}{" "}
                        {business.totalReviews === 1 ? "review" : "reviews"})
                      </span>
                    )}
                  </div>
                </div>
              )}

              {business.createdAt && (
                <div>
                  <h4 className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">
                    Joined
                  </h4>
                  <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                    <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
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
          <Card className="h-full gap-0">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg">
                <Wrench className="h-4 w-4 sm:h-5 sm:w-5" />
                Services ({business.totalServices || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {business.services && business.services.length > 0 ? (
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                  {business.services.map((service) => (
                    <Card
                      key={service.id}
                      className="group p-2.5  hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
                      onClick={() =>
                        router.push(`/admin/services/${service.id}`)
                      }
                    >
                      <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
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
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-muted-foreground">
                          {/* Rating */}
                          {business.rating && (
                            <div className="flex items-center gap-0.5">
                              <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-yellow-400 text-yellow-400" />
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
                            <div className="flex items-center gap-0.5">
                              <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                              <span className="truncate">{business.city}</span>
                            </div>
                          )}

                          {/* Duration */}
                          {service.duration && (
                            <div className="flex items-center gap-0.5">
                              <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                              <span>{service.duration}m</span>
                            </div>
                          )}
                        </div>

                        {/* Price & View Button */}
                        <div className="flex items-center justify-between pt-2 border-t">
                          <div>
                            <span className="text-base sm:text-lg font-bold flex items-center">
                              <IndianRupee className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              <span>{service.price}</span>
                            </span>
                          </div>
                          <Button
                            size="sm"
                            className="h-7 sm:h-8 text-xs"
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
                <div className="text-center py-12 sm:py-16 text-muted-foreground">
                  <Wrench className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 opacity-20" />
                  <p className="text-base sm:text-lg font-medium mb-1">
                    No services yet
                  </p>
                  <p className="text-xs sm:text-sm">
                    This business hasn't added any services.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Block Business Dialog */}
      {business && (
        <BlockBusinessDialog
          open={isBlockDialogOpen}
          onOpenChange={setIsBlockDialogOpen}
          businessId={Number(businessId)}
          businessName={business.name}
          onBlocked={handleBlocked}
        />
      )}
    </div>
  );
}
