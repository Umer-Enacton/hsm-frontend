"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/common/ImageUpload";
import { Badge } from "@/components/ui/badge";
import { Loader2, Building2, MapPin, Phone, Mail, Globe } from "lucide-react";
import { uploadBusinessLogo, uploadBusinessCoverImage } from "@/lib/provider/api";
import { api, API_ENDPOINTS } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Category {
  id: number;
  name: string;
  description?: string;
}

interface BusinessProfileData {
  name: string;
  description: string;
  categoryId: number;
  category?: string; // For display purposes
  phone: string;
  email: string;
  address: string;
  website?: string;
  logo?: File | null;
  coverImage?: File | null;
}

interface Stage1BusinessProfileProps {
  initialData?: Partial<BusinessProfileData>;
  onNext: (data: BusinessProfileData) => void;
  autoFocus?: boolean;
}

export function Stage1BusinessProfile({
  initialData,
  onNext,
  autoFocus = false,
}: Stage1BusinessProfileProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const [formData, setFormData] = useState<BusinessProfileData>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    categoryId: initialData?.categoryId || 0,
    category: initialData?.category || "",
    phone: initialData?.phone || "",
    email: initialData?.email || "",
    address: initialData?.address || "",
    website: initialData?.website || "",
    logo: null,
    coverImage: null,
  });

  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(
    initialData?.categoryId || 0
  );

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get<{ categories: Category[] }>(
          API_ENDPOINTS.CATEGORIES
        );
        setCategories(response.categories || []);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);
  const [pendingLogo, setPendingLogo] = useState<File | null>(null);
  const [pendingCover, setPendingCover] = useState<File | null>(null);
  const [isLoadingLogo, setIsLoadingLogo] = useState(false);
  const [isLoadingCover, setIsLoadingCover] = useState(false);

  // Auto-save logic - notify parent when data is valid
  useEffect(() => {
    if (
      formData.name &&
      formData.categoryId > 0 &&
      formData.phone &&
      formData.email &&
      formData.address
    ) {
      onNext({
        ...formData,
        logo: pendingLogo,
        coverImage: pendingCover,
      });
    }
  }, [formData, pendingLogo, pendingCover]);

  const handleInputChange = (
    field: keyof BusinessProfileData,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCategorySelect = (categoryId: number, categoryName: string) => {
    setSelectedCategoryId(categoryId);
    handleInputChange("categoryId", categoryId);
    handleInputChange("category", categoryName);
  };

  const handleLogoSelect = async (file: File | null) => {
    setPendingLogo(file);
  };

  const handleCoverSelect = async (file: File | null) => {
    setPendingCover(file);
  };

  const isValid =
    formData.name.trim() !== "" &&
    formData.description.trim().length >= 10 &&
    selectedCategoryId > 0 &&
    formData.phone.trim() !== "" &&
    formData.email.trim() !== "" &&
    formData.address.trim() !== "";

  return (
    <div className="space-y-8">
      {/* Business Name & Category */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="business-name" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Business Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="business-name"
            placeholder="e.g., QuickFix Plumbing Services"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            autoFocus={autoFocus}
            className={cn(!isValid && formData.name === "" && "border-destructive")}
          />
        </div>

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
            <>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Badge
                    key={category.id}
                    variant={selectedCategoryId === category.id ? "default" : "outline"}
                    className="cursor-pointer transition-colors hover:bg-primary/80"
                    onClick={() => handleCategorySelect(category.id, category.name)}
                  >
                    {category.name}
                  </Badge>
                ))}
              </div>
              {selectedCategoryId > 0 && (
                <p className="text-sm text-muted-foreground">
                  Selected: {categories.find((c) => c.id === selectedCategoryId)?.name}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">
          Business Description <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="description"
          placeholder="Tell customers about your business, services offered, and what makes you unique..."
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          rows={4}
          className={cn(
            formData.description.length > 0 && formData.description.length < 10 && "border-destructive"
          )}
        />
        <p className={cn(
          "text-xs",
          formData.description.length < 10 ? "text-destructive" : "text-muted-foreground"
        )}>
          {formData.description.length}/500 characters (minimum 10 required)
        </p>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Contact Information</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="e.g., +92 300 1234567"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="e.g., contact@quickfix.com"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Business Address <span className="text-destructive">*</span>
          </Label>
          <Input
            id="address"
            placeholder="e.g., 123 Main Street, Lahore, Pakistan"
            value={formData.address}
            onChange={(e) => handleInputChange("address", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Website (Optional)
          </Label>
          <Input
            id="website"
            type="url"
            placeholder="e.g., https://www.quickfix.com"
            value={formData.website}
            onChange={(e) => handleInputChange("website", e.target.value)}
          />
        </div>
      </div>

      {/* Images */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Business Images</h3>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Logo</Label>
            <ImageUpload
              currentImage={null}
              onImageSelect={handleLogoSelect}
              isPending={!!pendingLogo}
              isLoading={isLoadingLogo}
              accept="image/jpeg,image/jpg,image/png,image/webp"
              maxSize={2 * 1024 * 1024} // 2MB
              className="max-w-xs"
            />
            <p className="text-xs text-muted-foreground">
              Recommended: Square image (500x500px), max 2MB
            </p>
          </div>

          <div className="space-y-2">
            <Label>Cover Image</Label>
            <ImageUpload
              currentImage={null}
              onImageSelect={handleCoverSelect}
              isPending={!!pendingCover}
              isLoading={isLoadingCover}
              accept="image/jpeg,image/jpg,image/png,image/webp"
              maxSize={5 * 1024 * 1024} // 5MB
              className="max-w-xs"
            />
            <p className="text-xs text-muted-foreground">
              Recommended: Landscape (1200x400px), max 5MB
            </p>
          </div>
        </div>
      </div>

      {/* Validation Status */}
      <div className="flex items-center gap-2 rounded-lg border p-4 bg-muted/30">
        {isValid ? (
          <>
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
              <svg
                className="h-3 w-3 text-primary-foreground"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <span className="text-sm font-medium">
              All required fields completed
            </span>
          </>
        ) : (
          <>
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted-foreground">
              <span className="text-xs text-background">!</span>
            </div>
            <span className="text-sm text-muted-foreground">
              Please fill in all required fields (*)
            </span>
          </>
        )}
      </div>
    </div>
  );
}
