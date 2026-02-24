"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MapPin, Plus, Edit, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { getAddresses, createAddress, updateAddress, deleteAddress } from "@/lib/customer/api";
import type { Address } from "@/types/customer";
import Link from "next/link";
import { getAllStates } from "@/lib/data/india-locations";

const ADDRESS_TYPES = ["home", "work", "other"] as const;

export default function CustomerAddressesPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    addressType: "home" as Address["addressType"],
    street: "",
    city: "",
    state: "",
    zipCode: "",
  });

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      const data = await getAddresses();
      console.log("📡 Addresses loaded:", data);
      console.log("📡 Addresses count:", Array.isArray(data) ? data.length : 'not array');
      // Ensure data is an array
      setAddresses(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Error loading addresses:", error);
      toast.error("Failed to load addresses");
      setAddresses([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      if (editingAddress) {
        await updateAddress(editingAddress.id, formData);
        toast.success("Address updated successfully");
      } else {
        await createAddress(formData);
        toast.success("Address added successfully");
      }

      await loadAddresses();
      handleCloseDialog();
    } catch (error: any) {
      console.error("Error saving address:", error);
      toast.error(error.message || "Failed to save address");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      addressType: address.addressType,
      street: address.street,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (addressId: number) => {
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

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingAddress(null);
    setFormData({
      addressType: "home",
      street: "",
      city: "",
      state: "",
      zipCode: "",
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading addresses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Addresses</h1>
          <p className="text-muted-foreground">Manage your service addresses</p>
        </div>
        <Link href="/customer/addresses/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add New Address
          </Button>
        </Link>
      </div>

      {/* Addresses List */}
      {addresses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No addresses saved</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Add addresses to quickly select them during booking
            </p>
            <Link href="/customer/addresses/new">
              <Button>Add Your First Address</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {addresses.map((address) => (
            <Card key={address.id} className="relative group">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-primary/10 p-2">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg capitalize">{address.addressType}</CardTitle>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(address)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(address.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{address.street}</p>
                  <p className="text-muted-foreground">
                    {address.city}, {address.state} {address.zipCode}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAddress ? "Edit Address" : "Add New Address"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Address Type *</Label>
                <Select
                  value={formData.addressType}
                  onValueChange={(value: any) => setFormData({ ...formData, addressType: value })}
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
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>City *</Label>
                <Input
                  placeholder="Enter city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>State *</Label>
                <Select
                  value={formData.state}
                  onValueChange={(value) => setFormData({ ...formData, state: value })}
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
                <Label>Zip Code *</Label>
                <Input
                  placeholder="Enter zip code"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : editingAddress ? "Update" : "Add"} Address
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
