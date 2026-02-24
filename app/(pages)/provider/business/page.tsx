"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getUserData } from "@/lib/auth-utils";
import { getProviderBusiness, updateBusiness } from "@/lib/provider/api";
import { BusinessProfileCard } from "./components/BusinessProfileCard";
import { BusinessStats } from "./components/BusinessStats";
import { BusinessDetails } from "./components/BusinessDetails";
import { EditBusinessDialog } from "./components/EditBusinessDialog";
import { Button } from "@/components/ui/button";
import { VerificationAlert } from "@/components/provider/shared/VerificationAlert";
import { Calendar, Package, Users } from "lucide-react";
import { toast } from "sonner";

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
      console.log("Saving business data:", updatedData);

      // Call the update API - include phone, state, and city fields
      const updatedBusiness = await updateBusiness(business.id, {
        name: updatedData.name,
        description: updatedData.description,
        categoryId: updatedData.categoryId,
        phone: updatedData.phone, // Include business phone
        state: updatedData.state, // Include state
        city: updatedData.city, // Include city
        logo: updatedData.logo,
        coverImage: updatedData.coverImage,
        website: updatedData.website,
      });

      console.log("Business updated successfully:", updatedBusiness);

      // Update local state
      setBusiness(updatedBusiness);
      setIsEditDialogOpen(false);

      // Show success toast
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
      <div className="flex h-96 items-center justify-center">
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
          <h1 className="text-2xl font-bold tracking-tight">Business Profile</h1>
          <p className="text-muted-foreground">
            Manage your business information and settings
          </p>
        </div>
        <Button onClick={() => setIsEditDialogOpen(true)}>
          Edit Profile
        </Button>
      </div>

      {/* Verification Alert */}
      <VerificationAlert
        isVerified={business.isVerified}
        businessName={business.name}
      />

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => router.push("/provider/services")}
          disabled={!business.isVerified}
        >
          <Package className="h-4 w-4 mr-2" />
          Manage Services
          {!business.isVerified && "(Requires Verification)"}
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push("/provider/availability")}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Set Availability
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push("/provider/bookings")}
        >
          <Users className="h-4 w-4 mr-2" />
          View Bookings
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Profile Card & Details */}
        <div className="space-y-6 lg:col-span-2">
          <BusinessProfileCard business={business} onEdit={() => setIsEditDialogOpen(true)} />
          <BusinessDetails business={business} />
        </div>

        {/* Right Column - Stats */}
        <div className="lg:col-span-1">
          <BusinessStats business={business} />
        </div>
      </div>

      {/* Edit Dialog */}
      {isEditDialogOpen && (
        <EditBusinessDialog
          business={business}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSave={handleEditSave}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}
