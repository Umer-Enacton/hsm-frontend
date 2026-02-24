"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { createAddress } from "@/lib/customer/api";
import Link from "next/link";
import { getAllStates, getCitiesByState } from "@/lib/data/india-locations";

const ADDRESS_TYPES = ["home", "work", "other"] as const;

export default function NewAddressPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    addressType: "home" as Address["addressType"],
    street: "",
    city: "",
    state: "",
    zipCode: "",
  });

  // Memoize available cities based on selected state to prevent infinite re-renders
  const availableCities = useMemo(() => {
    if (!formData.state) return [];
    return getCitiesByState(formData.state);
  }, [formData.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      console.log("Submitting address:", formData);

      const result = await createAddress(formData);
      console.log("Address created successfully:", result);

      toast.success("Address added successfully");

      // Small delay to show success message before redirect
      setTimeout(() => {
        router.push("/customer/addresses");
      }, 500);
    } catch (error: any) {
      console.error("Error creating address:", error);
      toast.error(error.message || "Failed to add address");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/customer/addresses">
          <Button variant="ghost" size="icon">
            ←
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Add New Address</h1>
          <p className="text-muted-foreground">Enter your service address details</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Address Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="addressType">Address Type *</Label>
              <Select
                value={formData.addressType}
                onValueChange={(value: any) => setFormData({ ...formData, addressType: value })}
                required
              >
                <SelectTrigger id="addressType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ADDRESS_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        {type === "home" && "🏠"}
                        {type === "work" && "💼"}
                        {type === "other" && "📍"}
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="street">Street Address *</Label>
              <Input
                id="street"
                placeholder="House/Flat no., Building name, Street, Area"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter complete address with house number and street name
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Select
                  value={formData.state}
                  onValueChange={(value) => setFormData({ ...formData, state: value, city: "" })}
                  required
                >
                  <SelectTrigger id="state">
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
                <Label htmlFor="city">City *</Label>
                <Select
                  value={formData.city}
                  onValueChange={(value) => setFormData({ ...formData, city: value })}
                  disabled={!formData.state}
                  required
                >
                  <SelectTrigger id="city">
                    <SelectValue placeholder={formData.state ? "Select city" : "Select state first"} />
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="zipCode">Zip Code *</Label>
              <Input
                id="zipCode"
                placeholder="Enter zip code"
                value={formData.zipCode}
                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Link href="/customer/addresses">
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Address"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
