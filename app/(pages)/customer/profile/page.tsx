"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { isAuthenticated } from "@/lib/auth-utils";
import { getCurrentProfile } from "@/lib/profile-api";
import { getAddresses, createAddress, updateAddress, deleteAddress } from "@/lib/customer/api";
import {
  ProfileHeader,
  ProfileTabs,
  ProfileOverview,
  ProfileEditForm,
  PasswordChangeForm,
  type ProfileTab,
} from "@/components/profile";
import type { User } from "@/types/auth";
import type { Address } from "@/types/customer";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Plus, List, Grid3x3, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAllStates, getCitiesByState } from "@/lib/data/india-locations";

const ADDRESS_TYPES = ["home", "work", "other"] as const;
type ViewMode = "list" | "grid";
type CustomerProfileTab = ProfileTab | "addresses";

export default function CustomerProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<CustomerProfileTab>("overview");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Addresses state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isSubmittingAddress, setIsSubmittingAddress] = useState(false);
  const [addressViewMode, setAddressViewMode] = useState<ViewMode>("list");
  const [addressForm, setAddressForm] = useState({
    addressType: "home" as Address["addressType"],
    street: "",
    city: "",
    state: "",
    zipCode: "",
  });

  // Memoize available cities based on selected state to prevent infinite re-renders
  const availableCities = React.useMemo(() => {
    if (!addressForm.state) return [];
    return getCitiesByState(addressForm.state);
  }, [addressForm.state]);

  // Check auth and load user on mount
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    loadProfile();
    loadAddresses();
  }, [router]);

  const loadProfile = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getCurrentProfile();
      setUser(data);
    } catch (err: any) {
      setError(err.message || "Failed to load profile");
      toast.error(err.message || "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  };

  const loadAddresses = async () => {
    try {
      const data = await getAddresses();
      setAddresses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading addresses:", error);
      toast.error("Failed to load addresses");
      setAddresses([]);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadProfile();
    await loadAddresses();
    setIsRefreshing(false);
    toast.success("Profile refreshed");
  };

  const handleProfileUpdate = (updatedUser: User) => {
    setUser(updatedUser);
    setActiveTab("overview");
    // Emit custom event to notify layout to refresh user data
    window.dispatchEvent(new CustomEvent('profile-updated'));
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
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmittingAddress(true);

      if (editingAddress) {
        await updateAddress(editingAddress.id, addressForm);
        toast.success("Address updated successfully");
      } else {
        await createAddress(addressForm);
        toast.success("Address added successfully");
      }

      await loadAddresses();
      handleCloseAddressDialog();
    } catch (error: any) {
      console.error("Error saving address:", error);
      toast.error(error.message || "Failed to save address");
    } finally {
      setIsSubmittingAddress(false);
    }
  };

  const handleDeleteAddress = async (addressId: number) => {
    if (!confirm("Are you sure you want to delete this address?")) return;

    try {
      await deleteAddress(addressId);
      toast.success("Address deleted successfully");
      await loadAddresses();
    } catch (error: any) {
      console.error("Error deleting address:", error);
      toast.error(error.message || "Failed to delete address");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive mb-2">
            Failed to load profile
          </p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadProfile} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Customer-specific stats (placeholder - can be enhanced with real data)
  const customerStats = {
    totalBookings: 0, // TODO: Fetch from API
    completedBookings: 0, // TODO: Fetch from API
    pendingBookings: 0, // TODO: Fetch from API
  };

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
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Profile Header */}
      <ProfileHeader user={user} />

      {/* Tabs */}
      <ProfileTabs
        activeTab={activeTab as ProfileTab}
        onTabChange={(tab) => setActiveTab(tab as CustomerProfileTab)}
        showAddressesTab
      />

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <ProfileOverview
              user={user}
              onEditClick={() => setActiveTab("edit")}
            />

            {/* Customer Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold">{customerStats.totalBookings}</div>
                  <div className="text-sm text-muted-foreground mt-1">Total Bookings</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold">{customerStats.completedBookings}</div>
                  <div className="text-sm text-muted-foreground mt-1">Completed</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold">{customerStats.pendingBookings}</div>
                  <div className="text-sm text-muted-foreground mt-1">Pending</div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Info */}
            <Card>
              <CardContent className="p-6 space-y-2">
                <h3 className="text-lg font-semibold">Account Information</h3>
                <p className="text-sm text-muted-foreground">
                  Manage your account settings and preferences. You can update your profile
                  information, change your password, manage your addresses, and control your security settings.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
        {activeTab === "edit" && (
          <ProfileEditForm
            user={user}
            onUpdate={handleProfileUpdate}
            onCancel={() => setActiveTab("overview")}
          />
        )}
        {activeTab === "security" && <PasswordChangeForm />}
        {activeTab === "addresses" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">My Addresses</h2>
                <p className="text-muted-foreground">Manage your service addresses</p>
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
                <Button onClick={() => handleOpenAddressDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Address
                </Button>
              </div>
            </div>

            {addresses.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No addresses saved</h3>
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
                    className="group relative bg-card border rounded-lg p-4 hover:border-primary/50 hover:shadow-sm transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        {/* Icon */}
                        <div className="flex-shrink-0 mt-1">
                          {address.addressType === 'home' && (
                            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                              🏠
                            </div>
                          )}
                          {address.addressType === 'work' && (
                            <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                              💼
                            </div>
                          )}
                          {address.addressType === 'other' && (
                            <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAddress(address.id)}
                          className="h-8 px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
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
                    className="group relative bg-card border rounded-lg p-5 hover:border-primary/50 hover:shadow-sm transition-all duration-200"
                  >
                    <div className="flex flex-col h-full">
                      {/* Header with icon and actions */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {address.addressType === 'home' && (
                            <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                              🏠
                            </div>
                          )}
                          {address.addressType === 'work' && (
                            <div className="w-12 h-12 rounded-lg bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                              💼
                            </div>
                          )}
                          {address.addressType === 'other' && (
                            <div className="w-12 h-12 rounded-lg bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteAddress(address.id)}
                          className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Address Dialog */}
      <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? "Edit Address" : "Add New Address"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveAddress}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Address Type *</Label>
                <Select
                  value={addressForm.addressType}
                  onValueChange={(value: any) =>
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
                  onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>State *</Label>
                <Select
                  value={addressForm.state}
                  onValueChange={(value) => {
                    setAddressForm({ ...addressForm, state: value, city: "" }); // Clear city when state changes
                  }}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAllStates().map((state: string) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>City *</Label>
                <Select
                  value={addressForm.city}
                  onValueChange={(value) => setAddressForm({ ...addressForm, city: value })}
                  disabled={!addressForm.state}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={addressForm.state ? "Select city" : "Select state first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCities.map((city: string) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Zip Code *</Label>
                <Input
                  placeholder="Enter zip code"
                  value={addressForm.zipCode}
                  onChange={(e) => setAddressForm({ ...addressForm, zipCode: e.target.value })}
                  required
                />
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
              <Button type="submit" disabled={isSubmittingAddress}>
                {isSubmittingAddress ? "Saving..." : editingAddress ? "Update" : "Add"} Address
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
