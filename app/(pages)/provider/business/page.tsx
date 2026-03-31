"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Package,
  Calendar,
  Users,
  MapPin,
  Phone,
  Mail,
  Globe,
  FileText,
  Edit,
  CheckCircle,
  Clock,
  Star,
  Award,
  TrendingUp,
  DollarSign,
  IndianRupee,
  MessageSquare,
} from "lucide-react";
import { getUserData } from "@/lib/auth-utils";
import { getProviderBusiness, updateBusiness } from "@/lib/provider/api";
import { api, API_ENDPOINTS } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EditBusinessDialog } from "./components/EditBusinessDialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { BusinessProfileSkeleton } from "@/components/provider/skeletons/BusinessProfileSkeleton";

interface BusinessStats {
  totalServices: number;
  activeServices: number;
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  completionRate: number;
  totalRevenue: number;
  averageJobValue: number;
  totalReviews: number;
  averageRating: number;
  recentReviews: any[];
}

export default function ProviderBusinessPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [business, setBusiness] = useState<any>(null);
  const [stats, setStats] = useState<BusinessStats | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = getUserData();
        if (userData) {
          const businessData = await getProviderBusiness(userData.id);
          setBusiness(businessData);

          if (!businessData) {
            setIsLoading(false);
            return;
          }

          // Fetch services
          const servicesResponse: any = await api.get(
            API_ENDPOINTS.SERVICES_BY_BUSINESS(businessData.id),
          );
          const services = Array.isArray(servicesResponse)
            ? servicesResponse
            : servicesResponse?.services || servicesResponse?.data || [];
          const activeServices = services.filter(
            (s: any) => s.isActive || s.is_active,
          ).length;

          // Fetch bookings
          const bookingsResponse: any = await api.get(
            API_ENDPOINTS.PROVIDER_BOOKINGS,
          );
          const bookings = Array.isArray(bookingsResponse)
            ? bookingsResponse
            : bookingsResponse?.bookings || [];

          const pendingBookings = bookings.filter(
            (b: any) => b.status === "pending",
          ).length;
          const confirmedBookings = bookings.filter(
            (b: any) => b.status === "confirmed",
          ).length;
          const completedBookings = bookings.filter(
            (b: any) => b.status === "completed",
          ).length;
          const totalBookings = bookings.length;
          const completionRate =
            totalBookings > 0
              ? Math.round((completedBookings / totalBookings) * 100)
              : 0;

          const totalRevenue = bookings
            .filter((b: any) => b.status === "completed")
            .reduce(
              (sum: number, b: any) => sum + (b.price || b.totalPrice || 0),
              0,
            );

          const averageJobValue =
            completedBookings > 0
              ? Math.round(totalRevenue / completedBookings)
              : 0;

          // Fetch reviews
          let recentReviews: any[] = [];
          try {
            const feedbackResponse: any = await api.get(
              API_ENDPOINTS.FEEDBACK_BUSINESS(businessData.id),
            );
            const feedback = Array.isArray(feedbackResponse)
              ? feedbackResponse
              : feedbackResponse?.feedback || feedbackResponse?.data || [];
            recentReviews = feedback.slice(0, 5);
          } catch (e) {
            console.log("Could not fetch reviews");
          }

          setStats({
            totalServices: services.length,
            activeServices,
            totalBookings,
            pendingBookings,
            confirmedBookings,
            completedBookings,
            completionRate,
            totalRevenue,
            averageJobValue,
            totalReviews: businessData.totalReviews || 0,
            averageRating: businessData.rating || 0,
            recentReviews,
          });
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load business profile");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleEditSave = async (updatedData: any) => {
    setIsSaving(true);
    try {
      const updatedBusiness = await updateBusiness(business.id, {
        name: updatedData.name,
        description: updatedData.description,
        categoryId: updatedData.categoryId,
        phone: updatedData.phone,
        state: updatedData.state,
        city: updatedData.city,
        logo: updatedData.logo,
        coverImage: updatedData.coverImage,
        website: updatedData.website,
      });

      setBusiness(updatedBusiness);
      setIsEditDialogOpen(false);

      toast.success("Business profile updated successfully!", {
        description: "Your changes have been saved.",
      });
    } catch (error) {
      console.error("Error saving business:", error);
      toast.error("Failed to update business profile", {
        description: "Please try again later.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <BusinessProfileSkeleton />;
  }

  if (!business) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-muted-foreground">No business profile found.</p>
        <Button onClick={() => router.push("/onboarding")}>
          Complete Onboarding
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Business Profile
          </h1>
          <p className="text-muted-foreground">
            Manage your business information and view performance
          </p>
        </div>
        <Button
          onClick={() => setIsEditDialogOpen(true)}
          className="gap-2 whitespace-nowrap"
        >
          <Edit className="h-4 w-4" />
          Edit Profile
        </Button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30">
                  <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {stats.activeServices}
                  </p>
                  <p className="text-xs text-blue-700/70 dark:text-blue-400/70">
                    of {stats.totalServices} services
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200 dark:border-orange-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-orange-100 dark:bg-orange-900/30">
                  <Calendar className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                    {stats.totalBookings}
                  </p>
                  <p className="text-xs text-orange-700/70 dark:text-orange-400/70">
                    {stats.pendingBookings} pending
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border-emerald-200 dark:border-emerald-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-emerald-100 dark:bg-emerald-900/30">
                  <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                    {stats.completionRate}%
                  </p>
                  <p className="text-xs text-emerald-700/70 dark:text-emerald-400/70">
                    Completion rate
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border-yellow-200 dark:border-yellow-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-yellow-100 dark:bg-yellow-900/30">
                  <Star className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                    {stats.averageRating > 0
                      ? stats.averageRating.toFixed(1)
                      : "N/A"}
                  </p>
                  <p className="text-xs text-yellow-700/70 dark:text-yellow-400/70">
                    {stats.totalReviews} reviews
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Hero Card with Cover */}
      <Card className="overflow-hidden py-0">
        {/* Cover Image */}
        <div className="relative h-36 sm:h-48 bg-muted">
          {business.coverImage || business.logo ? (
            <img
              src={business.coverImage || business.logo || undefined}
              alt={`${business.name} cover`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center">
              <Globe className="h-16 w-16 sm:h-24 sm:w-24 text-primary/20" />
            </div>
          )}

          {/* Logo Overlay - Bottom Left */}
          {(business.logo || (!business.logo && !business.coverImage)) && (
            <div className="absolute -bottom-4 sm:-bottom-6 left-3 sm:left-6">
              <div className="h-14 w-14 sm:h-20 sm:w-20 rounded-md border-4 border-background overflow-hidden bg-card shadow-lg">
                {business.logo ? (
                  <img
                    src={business.logo}
                    alt={business.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-primary flex items-center justify-center">
                    <span className="text-xl sm:text-2xl font-bold text-primary-foreground">
                      {business.name?.charAt(0)?.toUpperCase() || "B"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Badges - Top Right */}
          <div className="absolute top-2 sm:top-4 right-2 sm:right-4 flex flex-col gap-1 items-end">
            {business.isVerified ? (
              <Badge className="bg-green-100 text-green-700 border-green-300 px-2 py-1 text-[10px] sm:px-3 sm:py-1.5">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
                <span className="hidden sm:inline">Verified</span>
                <span className="sm:hidden">✓</span>
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
        <div className="px-3 sm:px-6 pb-3 sm:pb-4 pt-1 sm:pt-2 space-y-2 sm:space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold truncate">
                {business.name}
              </h1>
              {business.rating > 0 && (
                <div className="flex items-center gap-1.5 sm:gap-2 mt-1">
                  <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-sm sm:text-base">
                    {business.rating.toFixed(1)}
                  </span>
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    ({business.totalReviews || 0}{" "}
                    {business.totalReviews === 1 ? "review" : "reviews"})
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Location, Category, Description */}
          <div className="space-y-1.5 sm:space-y-2">
            {/* Location */}
            {business.city && business.state && (
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                <span className="truncate">
                  {business.city}, {business.state}
                </span>
              </div>
            )}

            {/* Category */}
            {business.category && (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Badge variant="outline" className="text-xs">
                  {business.category}
                </Badge>
              </div>
            )}

            {/* Description */}
            {business.description && (
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                {business.description}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Contact & Revenue */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {business.phone && (
                  <div className="flex items-center gap-3 p-3 rounded-md border">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                      <Phone className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <a
                        href={`tel:${business.phone}`}
                        className="text-sm font-medium hover:text-primary truncate block"
                      >
                        {business.phone}
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-3 rounded-md border">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium truncate">
                      {business.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-md border sm:col-span-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="text-sm font-medium">
                      {business.city}, {business.state}
                    </p>
                  </div>
                </div>

                {business.website && (
                  <div className="flex items-center gap-3 p-3 rounded-md border sm:col-span-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                      <Globe className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">Website</p>
                      <a
                        href={business.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium hover:text-primary truncate block"
                      >
                        {business.website}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Performance Overview */}
          {stats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="p-4 rounded-md bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border border-emerald-200 dark:border-emerald-800">
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mb-1">
                      Total Revenue
                    </p>
                    <div className="flex items-center gap-1">
                      <IndianRupee className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                        {stats.totalRevenue.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-md bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 border border-purple-200 dark:border-purple-800">
                    <p className="text-xs text-purple-700 dark:text-purple-400 font-medium mb-1">
                      Avg Job Value
                    </p>
                    <div className="flex items-center gap-1">
                      <IndianRupee className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                        {stats.averageJobValue}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-md bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-blue-700 dark:text-blue-400 font-medium mb-1">
                      Jobs Completed
                    </p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {stats.completedBookings}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Reviews */}
          {stats && stats.recentReviews.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Recent Reviews
                  </CardTitle>
                  <Badge variant="outline">{stats.totalReviews} total</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.recentReviews.map((review: any) => (
                    <div key={review.id} className="p-4 rounded-md border">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm">
                              {review.customerName || "Customer"}
                            </p>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-medium">
                                {review.rating}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {review.serviceName || review.service?.name}
                          </p>
                        </div>
                      </div>
                      {review.comments && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          "{review.comments}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Status & Quick Actions */}
        <div className="space-y-6">
          {/* Verification Status */}
          <Card className={cn(
            business.isVerified
              ? "bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border-emerald-200 dark:border-emerald-800"
              : "bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border-yellow-200 dark:border-yellow-800"
          )}>
            <CardHeader>
              <CardTitle className={cn("text-base", business.isVerified ? "text-emerald-900 dark:text-emerald-100" : "text-yellow-900 dark:text-yellow-100")}>Account Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full",
                    business.isVerified ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-yellow-100 dark:bg-yellow-900/30",
                  )}
                >
                  {business.isVerified ? (
                    <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  )}
                </div>
                <div>
                  <p className={cn("font-semibold", business.isVerified ? "text-emerald-900 dark:text-emerald-100" : "text-yellow-900 dark:text-yellow-100")}>
                    {business.isVerified
                      ? "Verified Business"
                      : "Pending Verification"}
                  </p>
                  <p className={cn("text-sm", business.isVerified ? "text-emerald-700/70 dark:text-emerald-400/70" : "text-yellow-700/70 dark:text-yellow-400/70")}>
                    {business.isVerified
                      ? "Your business is verified"
                      : "Awaiting admin approval"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          {stats && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-md bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-800">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm text-blue-800 dark:text-blue-200">Active Services</span>
                  </div>
                  <span className="text-lg font-bold text-blue-900 dark:text-blue-100">
                    {stats.activeServices}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-md bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-800">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    <span className="text-sm text-orange-800 dark:text-orange-200">Total Bookings</span>
                  </div>
                  <span className="text-lg font-bold text-orange-900 dark:text-orange-100">
                    {stats.totalBookings}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-md bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-100 dark:border-yellow-800">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    <span className="text-sm text-yellow-800 dark:text-yellow-200">Rating</span>
                  </div>
                  <span className="text-sm font-bold text-yellow-900 dark:text-yellow-100">
                    {stats.averageRating > 0
                      ? stats.averageRating.toFixed(1)
                      : "N/A"}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push("/provider/services")}
                disabled={!business.isVerified}
              >
                <Package className="h-4 w-4 mr-3" />
                Manage Services
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push("/provider/availability")}
              >
                <Calendar className="h-4 w-4 mr-3" />
                Set Availability
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push("/provider/bookings")}
              >
                <Users className="h-4 w-4 mr-3" />
                View Bookings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <EditBusinessDialog
        business={business}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleEditSave}
        isSaving={isSaving}
      />
    </div>
  );
}
