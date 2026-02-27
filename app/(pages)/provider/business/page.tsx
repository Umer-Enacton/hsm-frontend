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
import { VerificationAlert } from "@/components/provider/shared/VerificationAlert";
import { EditBusinessDialog } from "./components/EditBusinessDialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

          // Fetch services
          const servicesResponse: any = await api.get(API_ENDPOINTS.SERVICES_BY_BUSINESS(businessData.id));
          const services = Array.isArray(servicesResponse)
            ? servicesResponse
            : (servicesResponse?.services || servicesResponse?.data || []);
          const activeServices = services.filter((s: any) => s.isActive || s.is_active).length;

          // Fetch bookings
          const bookingsResponse: any = await api.get(API_ENDPOINTS.PROVIDER_BOOKINGS);
          const bookings = Array.isArray(bookingsResponse)
            ? bookingsResponse
            : (bookingsResponse?.bookings || []);

          const pendingBookings = bookings.filter((b: any) => b.status === "pending").length;
          const confirmedBookings = bookings.filter((b: any) => b.status === "confirmed").length;
          const completedBookings = bookings.filter((b: any) => b.status === "completed").length;
          const totalBookings = bookings.length;
          const completionRate = totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0;

          const totalRevenue = bookings
            .filter((b: any) => b.status === "completed")
            .reduce((sum: number, b: any) => sum + (b.price || b.totalPrice || 0), 0);

          const averageJobValue = completedBookings > 0 ? Math.round(totalRevenue / completedBookings) : 0;

          // Fetch reviews
          let recentReviews: any[] = [];
          try {
            const feedbackResponse: any = await api.get(API_ENDPOINTS.FEEDBACK_BUSINESS(businessData.id));
            const feedback = Array.isArray(feedbackResponse)
              ? feedbackResponse
              : (feedbackResponse?.feedback || feedbackResponse?.data || []);
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
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading business profile...</p>
        </div>
      </div>
    );
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Business Profile</h1>
          <p className="text-muted-foreground">
            Manage your business information and view performance
          </p>
        </div>
        <Button onClick={() => setIsEditDialogOpen(true)} className="gap-2">
          <Edit className="h-4 w-4" />
          Edit Profile
        </Button>
      </div>

      {/* Verification Alert */}
      <VerificationAlert
        isVerified={business.isVerified}
        businessName={business.name}
      />

      {/* Hero Card with Cover */}
      <Card className="overflow-hidden">
        {/* Cover Image */}
        <div className="relative h-56 bg-gradient-to-br from-primary/20 via-primary/10 to-background">
          {business.coverImage ? (
            <img
              src={business.coverImage}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Globe className="h-16 w-16 mx-auto text-primary/30" />
                <p className="text-sm text-muted-foreground mt-3">
                  Add a cover image to showcase your business
                </p>
              </div>
            </div>
          )}

          {/* Verification Badge - Top Right */}
          <div className="absolute top-4 right-4">
            {business.isVerified ? (
              <Badge className="bg-green-600 gap-1 px-3 py-1.5">
                <CheckCircle className="h-3 w-3" />
                Verified
              </Badge>
            ) : (
              <Badge className="bg-yellow-600 gap-1 px-3 py-1.5">
                <Clock className="h-3 w-3" />
                Pending
              </Badge>
            )}
          </div>
        </div>

        {/* Profile Header */}
        <CardContent className="relative">
          <div className="-mt-16 mb-6">
            <Avatar className="h-28 w-28 border-4 border-background shadow-xl">
              {business.logo ? (
                <AvatarImage src={business.logo} alt={business.name} />
              ) : (
                <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                  {business.name?.charAt(0)?.toUpperCase() || "B"}
                </AvatarFallback>
              )}
            </Avatar>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-bold">{business.name}</h2>
                {business.category && (
                  <Badge variant="outline" className="text-xs">
                    {business.category}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="flex items-center gap-1 text-sm">
                  <MapPin className="h-4 w-4" />
                  <span>{business.city}, {business.state}</span>
                </div>
                {business.rating > 0 && (
                  <>
                    <span className="text-sm">•</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{business.rating.toFixed(1)}</span>
                      <span className="text-xs">({business.totalReviews || 0})</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/provider/services")}
                disabled={!business.isVerified}
              >
                <Package className="h-4 w-4 mr-2" />
                Services
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/provider/availability")}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Availability
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/provider/bookings")}
              >
                <Users className="h-4 w-4 mr-2" />
                Bookings
              </Button>
            </div>
          </div>

          {/* Description */}
          {business.description && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">About</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {business.description}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Overview */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activeServices}</p>
                  <p className="text-xs text-muted-foreground">
                    of {stats.totalServices} services
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalBookings}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.pendingBookings} pending
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.completionRate}%</p>
                  <p className="text-xs text-muted-foreground">
                    Completion rate
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
                  <Star className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "N/A"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stats.totalReviews} reviews
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
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

                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium truncate">{business.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg border sm:col-span-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="text-sm font-medium">{business.city}, {business.state}</p>
                  </div>
                </div>

                {business.website && (
                  <div className="flex items-center gap-3 p-3 rounded-lg border sm:col-span-2">
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
                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">Total Revenue</p>
                    <div className="flex items-center gap-1">
                      <IndianRupee className="h-5 w-5" />
                      <p className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">Avg Job Value</p>
                    <div className="flex items-center gap-1">
                      <IndianRupee className="h-5 w-5" />
                      <p className="text-2xl font-bold">{stats.averageJobValue}</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">Jobs Completed</p>
                    <p className="text-2xl font-bold">{stats.completedBookings}</p>
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
                    <div key={review.id} className="p-4 rounded-lg border">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm">{review.customerName || "Customer"}</p>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-medium">{review.rating}</span>
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
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Account Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30">
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full",
                    business.isVerified ? "bg-green-100" : "bg-yellow-100"
                  )}
                >
                  {business.isVerified ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <Clock className="h-6 w-6 text-yellow-600" />
                  )}
                </div>
                <div>
                  <p className="font-semibold">
                    {business.isVerified ? "Verified Business" : "Pending Verification"}
                  </p>
                  <p className="text-sm text-muted-foreground">
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
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Active Services</span>
                  </div>
                  <span className="text-lg font-bold">{stats.activeServices}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Total Bookings</span>
                  </div>
                  <span className="text-lg font-bold">{stats.totalBookings}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Rating</span>
                  </div>
                  <span className="text-sm font-bold">
                    {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "N/A"}
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
