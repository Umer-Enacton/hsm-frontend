"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { isAuthenticated } from "@/lib/auth-utils";
import {
  ProfileHeader,
  ProfileTabs,
  ProfileOverview,
  EditProfileModal,
  PasswordChangeForm,
  type ProfileTab,
} from "@/components/profile";
import {
  useProfile,
  useAddresses,
  useUpdateProfile,
  useUploadAvatar,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
} from "@/lib/queries";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/queries/query-keys";
import type { Address } from "@/types/customer";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Plus, List, Grid3x3, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAllStates, getCitiesByState } from "@/lib/data/india-locations";
import { CustomerProfileSkeleton } from "@/components/customer/skeletons";

const ADDRESS_TYPES = ["home", "work", "other"] as const;
type ViewMode = "list" | "grid";
type CustomerProfileTab = ProfileTab;

export default function CustomerProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // UI State (keep local)
  const [activeTab, setActiveTab] = useState<CustomerProfileTab>("overview");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Addresses UI state
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressViewMode, setAddressViewMode] = useState<ViewMode>("list");
  const [addressForm, setAddressForm] = useState({
    addressType: "home" as Address["addressType"],
    street: "",
    city: "",
    state: "",
    zipCode: "",
  });
  const [addressErrors, setAddressErrors] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
  });
  const [addressTouched, setAddressTouched] = useState({
    street: false,
    city: false,
    state: false,
    zipCode: false,
  });

  // React Query hooks
  const { data: user, isLoading: isLoadingProfile, error } = useProfile();
  const { data: addresses = [], isLoading: isLoadingAddresses } =
    useAddresses();
  const updateProfileMutation = useUpdateProfile();
  const uploadAvatarMutation = useUploadAvatar();
  const createAddressMutation = useCreateAddress();
  const updateAddressMutation = useUpdateAddress();
  const deleteAddressMutation = useDeleteAddress();

  const isLoading = isLoadingProfile || isLoadingAddresses;
  const isSubmittingAddress =
    createAddressMutation.isPending ||
    updateAddressMutation.isPending ||
    deleteAddressMutation.isPending;

  // Memoize available cities
  const availableCities = React.useMemo(() => {
    if (!addressForm.state) return [];
    return getCitiesByState(addressForm.state);
  }, [addressForm.state]);

  // Check auth on mount
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    }
  }, [router]);

  // Handlers
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROFILE] });
      await queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Profile refreshed");
    } catch {
      toast.error("Failed to refresh profile");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleProfileUpdate = async (updates: {
    name?: string;
    email?: string;
    phone?: string;
  }) => {
    updateProfileMutation.mutate(updates);
  };

  // Address handlers
  const handleOpenAddressDialog = (address?: Address) => {
    if (address) {
      setEditingAddress(address);
      setAddressForm({
        addressType: address.addressType,
        street: address.street,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
      });
    } else {
      setEditingAddress(null);
      setAddressForm({
        addressType: "home",
        street: "",
        city: "",
        state: "",
        zipCode: "",
      });
    }
    // Reset errors and touched states
    setAddressErrors({ street: "", city: "", state: "", zipCode: "" });
    setAddressTouched({ street: false, city: false, state: false, zipCode: false });
    setIsAddressDialogOpen(true);
  };

  const handleCloseAddressDialog = () => {
    setIsAddressDialogOpen(false);
    setEditingAddress(null);
    setAddressForm({
      addressType: "home",
      street: "",
      city: "",
      state: "",
      zipCode: "",
    });
    setAddressErrors({ street: "", city: "", state: "", zipCode: "" });
    setAddressTouched({ street: false, city: false, state: false, zipCode: false });
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setAddressTouched({ street: true, city: true, state: true, zipCode: true });

    // Validate
    const errors = {
      street: "",
      city: "",
      state: "",
      zipCode: "",
    };

    // Validate street address
    if (!addressForm.street.trim()) {
      errors.street = "Street address is required";
    } else if (addressForm.street.trim().length > 200) {
      errors.street = "Street address cannot exceed 200 characters";
    }

    // Validate state
    if (!addressForm.state) {
      errors.state = "State is required";
    }

    // Validate city
    if (!addressForm.city) {
      errors.city = "City is required";
    }

    // Validate zip code (India PIN code: 6 digits)
    if (!addressForm.zipCode) {
      errors.zipCode = "Zip code is required";
    } else if (!/^\d{6}$/.test(addressForm.zipCode)) {
      errors.zipCode = "Zip code must be 6 digits";
    }

    setAddressErrors(errors);

    if (errors.street || errors.city || errors.state || errors.zipCode) {
      return;
    }

    if (editingAddress) {
      updateAddressMutation.mutate({
        addressId: editingAddress.id,
        updates: addressForm,
      });
    } else {
      createAddressMutation.mutate(addressForm);
    }

    handleCloseAddressDialog();
  };

  const handleDeleteAddress = (addressId: number) => {
    deleteAddressMutation.mutate(addressId);
  };

  if (!user) {
    return <CustomerProfileSkeleton />;
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive mb-2">
            Failed to load profile
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="icon"
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
        </Button>
      </div>

      {/* Profile Header */}
      <ProfileHeader user={user} />

      {/* Tabs */}
      <ProfileTabs
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as CustomerProfileTab)}
      />

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "overview" &&
          (isLoading ? (
            // ProfileOverview Skeleton
            <div className="space-y-6">
              <Card>
                <div className="p-6 space-y-4">
                  <Skeleton className="h-6 w-36" />
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b">
                      <Skeleton className="h-4 w-10" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <Skeleton className="h-4 w-10" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <Skeleton className="h-4 w-10" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <Skeleton className="h-4 w-8" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-9 w-full rounded-md" />
                </div>
              </Card>
            </div>
          ) : (
            <ProfileOverview
              user={user}
              onEditClick={() => setIsEditModalOpen(true)}
            />
          ))}

        {activeTab === "security" && <PasswordChangeForm />}

        {activeTab === "addresses" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">My Addresses</h2>
                <p className="text-muted-foreground">
                  Manage your service addresses
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* View Toggle */}
                <div className="flex items-center border rounded-md p-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setAddressViewMode("list")}
                    className={`h-8 w-8 ${addressViewMode === "list" ? "bg-muted" : ""}`}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setAddressViewMode("grid")}
                    className={`h-8 w-8 ${addressViewMode === "grid" ? "bg-muted" : ""}`}
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </Button>
                </div>
                <Button onClick={() => handleOpenAddressDialog()} data-tour-add-address>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Address
                </Button>
              </div>
            </div>

            {addresses.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No addresses saved
                  </h3>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Add addresses to quickly select them during booking
                  </p>
                  <Button onClick={() => handleOpenAddressDialog()}>
                    Add Your First Address
                  </Button>
                </CardContent>
              </Card>
            ) : addressViewMode === "list" ? (
              <div className="space-y-3">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    className="group relative bg-card border rounded-md p-4 hover:border-primary/50 hover:shadow-sm transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        {/* Icon */}
                        <div className="flex-shrink-0 mt-1">
                          {address.addressType === "home" && (
                            <div className="w-10 h-10 rounded-md bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                              🏠
                            </div>
                          )}
                          {address.addressType === "work" && (
                            <div className="w-10 h-10 rounded-md bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                              💼
                            </div>
                          )}
                          {address.addressType === "other" && (
                            <div className="w-10 h-10 rounded-md bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                              📍
                            </div>
                          )}
                        </div>

                        {/* Address Info */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-base capitalize text-foreground">
                              {address.addressType}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {address.city}
                            </Badge>
                          </div>
                          <p className="text-sm text-foreground/80">
                            {address.street}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {address.city}, {address.state} {address.zipCode}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenAddressDialog(address)}
                          className="h-8 px-3"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this address?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteAddress(address.id)}
                                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    className="group relative bg-card border rounded-md p-5 hover:border-primary/50 hover:shadow-sm transition-all duration-200"
                  >
                    <div className="flex flex-col h-full">
                      {/* Header with icon and actions */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {address.addressType === "home" && (
                            <div className="w-12 h-12 rounded-md bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                              🏠
                            </div>
                          )}
                          {address.addressType === "work" && (
                            <div className="w-12 h-12 rounded-md bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                              💼
                            </div>
                          )}
                          {address.addressType === "other" && (
                            <div className="w-12 h-12 rounded-md bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                              📍
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold capitalize text-foreground">
                              {address.addressType}
                            </h3>
                            <Badge variant="outline" className="text-xs mt-1">
                              {address.city}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Address info */}
                      <div className="flex-1 space-y-2 mb-4">
                        <p className="text-sm text-foreground/80">
                          {address.street}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {address.city}, {address.state} {address.zipCode}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-3 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenAddressDialog(address)}
                          className="flex-1"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this address?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteAddress(address.id)}
                                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        user={user}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onUpdate={handleProfileUpdate}
        updateProfileMutation={updateProfileMutation}
        uploadAvatarMutation={uploadAvatarMutation}
      />

      {/* Add/Edit Address Dialog */}
      <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? "Edit Address" : "Add New Address"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveAddress} data-tour-address-form>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Address Type *</Label>
                <Select
                  value={addressForm.addressType}
                  onValueChange={(value: Address["addressType"]) =>
                    setAddressForm({ ...addressForm, addressType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ADDRESS_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Street Address *</Label>
                <Input
                  placeholder="House no., building, street area"
                  value={addressForm.street}
                  data-tour-street
                  onChange={(e) => {
                    setAddressForm({ ...addressForm, street: e.target.value });
                    if (addressTouched.street) {
                      const trimmed = e.target.value.trim();
                      setAddressErrors((prev) => ({
                        ...prev,
                        street: !trimmed
                          ? "Street address is required"
                          : trimmed.length > 200
                            ? "Street address cannot exceed 200 characters"
                            : "",
                      }));
                    }
                  }}
                  onBlur={() => {
                    setAddressTouched((prev) => ({ ...prev, street: true }));
                    const trimmed = addressForm.street.trim();
                    setAddressErrors((prev) => ({
                      ...prev,
                      street: !trimmed
                        ? "Street address is required"
                        : trimmed.length > 200
                          ? "Street address cannot exceed 200 characters"
                          : "",
                    }));
                  }}
                  className={
                    addressTouched.street && addressErrors.street
                      ? "border-destructive"
                      : ""
                  }
                  required
                />
                {addressTouched.street && addressErrors.street && (
                  <p className="text-xs text-destructive">
                    {addressErrors.street}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {addressForm.street.length}/200 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label>State *</Label>
                <Select
                  value={addressForm.state}
                  onValueChange={(value) => {
                    setAddressForm({ ...addressForm, state: value, city: "" });
                    setAddressTouched((prev) => ({ ...prev, state: true }));
                    setAddressErrors((prev) => ({ ...prev, state: "" }));
                  }}
                  required
                >
<SelectTrigger data-tour-state className={addressTouched.state && addressErrors.state ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent data-tour-state-options>
                    {getAllStates().map((state: string) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {addressTouched.state && addressErrors.state && (
                  <p className="text-xs text-destructive">{addressErrors.state}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>City *</Label>
                <Select
                  value={addressForm.city}
                  onValueChange={(value) => {
                    setAddressForm({ ...addressForm, city: value });
                    setAddressTouched((prev) => ({ ...prev, city: true }));
                    setAddressErrors((prev) => ({ ...prev, city: "" }));
                  }}
                  disabled={!addressForm.state}
                  required
                >
                  <SelectTrigger data-tour-city className={addressTouched.city && addressErrors.city ? "border-destructive" : ""}>
                    <SelectValue
                      placeholder={
                        addressForm.state ? "Select city" : "Select state first"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent data-tour-city-options>
                    {availableCities.map((city: string) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {addressTouched.city && addressErrors.city && (
                  <p className="text-xs text-destructive">{addressErrors.city}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Zip Code *</Label>
                <Input
                  placeholder="Enter 6-digit zip code"
                  value={addressForm.zipCode}
                  data-tour-zip
                  onChange={(e) => {
                    // Only digits allowed, max 6
                    const value = e.target.value
                      .replace(/[^\d]/g, "")
                      .slice(0, 6);
                    setAddressForm({ ...addressForm, zipCode: value });
                    if (addressTouched.zipCode) {
                      setAddressErrors((prev) => ({
                        ...prev,
                        zipCode:
                          value.length !== 6 ? "Zip code must be 6 digits" : "",
                      }));
                    }
                  }}
                  onBlur={() => {
                    setAddressTouched((prev) => ({ ...prev, zipCode: true }));
                    setAddressErrors((prev) => ({
                      ...prev,
                      zipCode:
                        addressForm.zipCode.length !== 6
                          ? "Zip code must be 6 digits"
                          : "",
                    }));
                  }}
                  className={
                    addressTouched.zipCode && addressErrors.zipCode
                      ? "border-destructive"
                      : ""
                  }
                  maxLength={6}
                  required
                />
                {addressTouched.zipCode && addressErrors.zipCode && (
                  <p className="text-xs text-destructive">
                    {addressErrors.zipCode}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  6 digits (India PIN code)
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseAddressDialog}
                disabled={isSubmittingAddress}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmittingAddress} data-tour-submit-address>
                {isSubmittingAddress
                  ? "Saving..."
                  : editingAddress
                    ? "Update"
                    : "Add"}{" "}
                Address
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
