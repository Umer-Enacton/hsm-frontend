"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Package, Calendar, Users, MapPin, Phone, Mail, Globe, FileText, Edit, CheckCircle, Clock, Star, Award, TrendingUp } from "lucide-react";
import { getUserData } from "@/lib/auth-utils";
import { getProviderBusiness, updateBusiness } from "@/lib/provider/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VerificationAlert } from "@/components/provider/shared/VerificationAlert";
import { EditBusinessDialog } from "./components/EditBusinessDialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ProviderBusinessPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [business, setBusiness] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadBusiness = async () => {
      try {
        const userData = getUserData();
        if (userData) {
          const businessData = await getProviderBusiness(userData.id);
          setBusiness(businessData);
        }
      } catch (error) {
        console.error("Error loading business:", error);
        toast.error("Failed to load business profile");
      } finally {
        setIsLoading(false);
      }
    };

    loadBusiness();
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
            Manage your business information and settings
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

      {/* Main Content - Hero Card with Cover */}
      <Card className="overflow-hidden">
        {/* Cover Image */}
        <div className="h-48 bg-gradient-to-r from-primary/20 via-primary/10 to-background relative">
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
        </div>

        {/* Profile Header */}
        <CardContent className="relative">
          <div className="-mt-16 mb-6">
            <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
              {business.logo ? (
                <AvatarImage src={business.logo} alt={business.name} />
              ) : (
                <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                  {business.name?.charAt(0)?.toUpperCase() || "B"}
                </AvatarFallback>
              )}
            </Avatar>
          </div>

          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-bold">{business.name}</h2>
                {business.isVerified && (
                  <Badge className="bg-green-600 gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Verified
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                {business.category && (
                  <Badge variant="outline" className="text-xs">
                    {business.category}
                  </Badge>
                )}
                <span className="text-sm">•</span>
                <div className="flex items-center gap-1 text-sm">
                  <MapPin className="h-4 w-4" />
                  <span>{business.city}, {business.state}</span>
                </div>
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
              <div>
                <p className="text-sm font-medium mb-1">About</p>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                  {business.description}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Grid & Contact Info */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Contact Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {business.phone && (
                  <div className="flex items-center gap-3 p-4 rounded-lg border hover:border-primary/50 transition-colors">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Phone className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground mb-0.5">Phone</p>
                      <a
                        href={`tel:${business.phone}`}
                        className="text-sm font-medium hover:text-primary truncate block"
                      >
                        {business.phone}
                      </a>
                    </div>
                  </div>
                )}

                {business.email && (
                  <div className="flex items-center gap-3 p-4 rounded-lg border hover:border-primary/50 transition-colors">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Mail className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                      <a
                        href={`mailto:${business.email}`}
                        className="text-sm font-medium hover:text-primary truncate block"
                      >
                        {business.email}
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-4 rounded-lg border">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-0.5">Location</p>
                    <p className="text-sm font-medium">{business.city}, {business.state}</p>
                  </div>
                </div>

                {business.website && (
                  <div className="flex items-center gap-3 p-4 rounded-lg border hover:border-primary/50 transition-colors">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Globe className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground mb-0.5">Website</p>
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Award className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground mb-2">Track your business performance</p>
                <p className="text-sm text-muted-foreground">
                  Complete bookings to see reviews and ratings from customers
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => router.push("/provider/bookings")}
                >
                  View Bookings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Status & Quick Actions */}
        <div className="space-y-6">
          {/* Verification Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Verification Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30">
                <div className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full",
                  business.isVerified ? "bg-green-100" : "bg-yellow-100"
                )}>
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
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Services</span>
                </div>
                <span className="text-lg font-bold">0</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Bookings</span>
                </div>
                <span className="text-lg font-bold">0</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Rating</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-bold">N/A</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Cards */}
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
