"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUpload } from "@/components/common/ImageUpload";
import { StateCityPicker } from "@/components/common/StateCityPicker";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { api, API_ENDPOINTS } from "@/lib/api";
import { uploadBusinessLogo, uploadBusinessCoverImage } from "@/lib/provider/api";
import type { Business } from "@/types/provider";

interface EditBusinessDialogProps {
  business: Business;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => void;
  isSaving: boolean;
}

export function EditBusinessDialog({
  business,
  open,
  onOpenChange,
  onSave,
  isSaving,
}: EditBusinessDialogProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [activeTab, setActiveTab] = useState<"basic" | "images">("basic");
  const [isUploading, setIsUploading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: business.name || "",
    description: business.description || "",
    categoryId: 0,
    category: business.category || "",
    phone: business.phone || "",
    email: business.email || "",
    state: business.state || "",
    city: business.city || "",
    website: business.website || "",
    logo: null as File | null,
    coverImage: null as File | null,
  });

  // Validation state
  const [errors, setErrors] = useState({
    name: "",
    description: "",
    categoryId: "",
  });

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const response = await api.get<{ categories: any[] }>(API_ENDPOINTS.CATEGORIES);
        setCategories(response.categories || []);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    if (open) {
      fetchCategories();
    }
  }, [open]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        name: business.name || "",
        description: business.description || "",
        categoryId: business.categoryId || 0, // Use categoryId from business
        category: business.category || "",
        phone: business.phone || "",
        email: business.email || "",
        state: business.state || "",
        city: business.city || "",
        website: business.website || "",
        logo: null,
        coverImage: null,
      });
      setErrors({ name: "", description: "", categoryId: "" });
    }
  }, [open, business]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleCategorySelect = (categoryId: number, categoryName: string) => {
    setFormData((prev) => ({
      ...prev,
      categoryId,
      category: categoryName,
    }));
    setErrors((prev) => ({ ...prev, categoryId: "" }));
  };

  const handleLogoSelect = (file: File | null) => {
    setFormData((prev) => ({ ...prev, logo: file }));
  };

  const handleCoverSelect = (file: File | null) => {
    setFormData((prev) => ({ ...prev, coverImage: file }));
  };

  const validate = () => {
    const newErrors = {
      name: "",
      description: "",
      categoryId: "",
    };

    if (!formData.name.trim()) {
      newErrors.name = "Business name is required";
    } else if (formData.name.length < 3) {
      newErrors.name = "Name must be at least 3 characters";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    if (formData.categoryId === 0) {
      newErrors.categoryId = "Please select a category";
    }

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === "");
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsUploading(true);
    try {
      // Prepare data with existing images
      let logoUrl = business.logo || null;
      let coverImageUrl = business.coverImage || null;

      // Upload new logo if selected
      if (formData.logo instanceof File) {
        console.log("Uploading new logo...");
        try {
          const logoResult = await uploadBusinessLogo(formData.logo);
          logoUrl = logoResult.url;
          console.log("Logo uploaded successfully:", logoUrl);
        } catch (error) {
          console.error("Failed to upload logo:", error);
          // Continue with existing logo
        }
      }

      // Upload new cover image if selected
      if (formData.coverImage instanceof File) {
        console.log("Uploading new cover image...");
        try {
          const coverResult = await uploadBusinessCoverImage(formData.coverImage);
          coverImageUrl = coverResult.url;
          console.log("Cover image uploaded successfully:", coverImageUrl);
        } catch (error) {
          console.error("Failed to upload cover image:", error);
          // Continue with existing cover
        }
      }

      // Pass all data including uploaded image URLs
      onSave({
        ...formData,
        logo: logoUrl,
        coverImage: coverImageUrl,
      });
    } catch (error) {
      console.error("Error in handleSave:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const isValid =
    formData.name.trim().length >= 3 &&
    formData.description.trim().length >= 10 &&
    formData.categoryId > 0;

  const canSaveImages = activeTab === "images" && isValid;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Business Profile</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full" onValueChange={(value) => setActiveTab(value as "basic" | "images")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="images" disabled={!isValid}>
              Images {!isValid && "(Complete Basic Info first)"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            {/* Business Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Business Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="e.g., QuickFix Plumbing Services"
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>
                Category <span className="text-destructive">*</span>
              </Label>
              {isLoadingCategories ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading categories...</span>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Badge
                      key={category.id}
                      variant={formData.categoryId === category.id ? "default" : "outline"}
                      className="cursor-pointer transition-colors hover:bg-primary/80"
                      onClick={() =>
                        handleCategorySelect(category.id, category.name)
                      }
                    >
                      {category.name}
                    </Badge>
                  ))}
                </div>
              )}
              {errors.categoryId && (
                <p className="text-sm text-destructive">{errors.categoryId}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Tell customers about your business, services offered, and what makes you unique..."
                rows={4}
                className={`resize-none ${errors.description ? "border-destructive" : ""}`}
              />
              <p className="text-xs text-muted-foreground">
                {formData.description.length}/500 characters (minimum 10)
              </p>
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="e.g., +92 300 1234567"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="e.g., contact@quickfix.com"
              />
            </div>

            {/* State & City Selection */}
            <StateCityPicker
              state={formData.state}
              city={formData.city}
              onStateChange={(value) => handleInputChange("state", value)}
              onCityChange={(value) => handleInputChange("city", value)}
              required
            />

            {/* Website */}
            <div className="space-y-2">
              <Label htmlFor="website">Website (Optional)</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => handleInputChange("website", e.target.value)}
                placeholder="e.g., https://www.quickfix.com"
              />
            </div>
          </TabsContent>

          <TabsContent value="images" className="space-y-6 mt-4">
            <div>
              <h3 className="text-sm font-semibold mb-4">Business Logo</h3>
              <ImageUpload
                currentImage={business.logo}
                onImageSelect={handleLogoSelect}
                accept="image/jpeg,image/jpg,image/png,image/webp"
                maxSize={2 * 1024 * 1024}
                className="max-w-xs"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Recommended: Square image (500x500px), max 2MB
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-4">Cover Image</h3>
              <ImageUpload
                currentImage={business.coverImage}
                onImageSelect={handleCoverSelect}
                accept="image/jpeg,image/jpg,image/png,image/webp"
                maxSize={5 * 1024 * 1024}
                className="max-w-xs"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Recommended: Landscape (1200x400px), max 5MB
              </p>
            </div>

            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">
                💡 Images will be uploaded securely. Any unsaved changes will be lost when you close this dialog.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid || isSaving || isUploading}>
            {isSaving || isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isUploading ? "Uploading Images..." : "Saving..."}
              </>
            ) : activeTab === "images" && !isValid ? (
              "Complete Basic Info First"
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
