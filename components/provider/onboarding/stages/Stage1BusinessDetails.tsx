"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ImageUpload } from "@/components/common/ImageUpload";
import { StateCityPicker } from "@/components/common/StateCityPicker";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Phone, Mail, Globe, Loader2, AlertCircle } from "lucide-react";
import { getCitiesByState } from "@/lib/data/india-locations";
import { api, API_ENDPOINTS } from "@/lib/api";

interface Category {
  id: number;
  name: string;
  description?: string;
}

interface BusinessDetailsData {
  name: string;
  description: string;
  categoryId: number;
  category?: string; // For display purposes
  businessPhone?: string;
  state: string; // State/UT
  city: string; // City within state
  website?: string;
  logo?: File | null;
  coverImage?: File | null;
}

interface Stage1BusinessDetailsProps {
  initialData?: Partial<BusinessDetailsData>;
  onNext: (data: BusinessDetailsData) => void;
}

// Indian phone number validation: 10 digits, starts with 6-9
const validateIndianPhone = (phone: string): { isValid: boolean; error?: string } => {
  if (!phone) {
    return { isValid: true }; // Empty is valid (optional field)
  }
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length !== 10) {
    return { isValid: false, error: "Phone number must be 10 digits" };
  }
  if (!/^[6-9]/.test(digitsOnly)) {
    return { isValid: false, error: "Phone number must start with 6-9" };
  }
  return { isValid: true };
};

export function Stage1BusinessDetails({
  initialData,
  onNext,
}: Stage1BusinessDetailsProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const [formData, setFormData] = useState<BusinessDetailsData>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    categoryId: initialData?.categoryId || 0,
    category: initialData?.category || "",
    businessPhone: initialData?.businessPhone || "",
    state: initialData?.state || "",
    city: initialData?.city || "",
    website: initialData?.website || "",
    logo: null,
    coverImage: null,
  });

  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(
    initialData?.categoryId || 0,
  );

  // Validation error state
  const [phoneError, setPhoneError] = useState<string>("");

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get<{ categories: Category[] }>(
          API_ENDPOINTS.CATEGORIES,
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

  // Track last notified data to prevent duplicate calls
  const lastNotifiedDataRef = useRef<string>("");

  // Notify parent when data is valid and has changed
  useEffect(() => {
    const phoneValidation = validateIndianPhone(formData.businessPhone || "");

    // Update phone error state
    if (formData.businessPhone && !phoneValidation.isValid) {
      setPhoneError(phoneValidation.error || "");
    } else {
      setPhoneError("");
    }

    const dataString = JSON.stringify({
      name: formData.name,
      categoryId: formData.categoryId,
      state: formData.state,
      city: formData.city,
      businessPhone: formData.businessPhone,
    });

    // Only notify if data is valid AND has actually changed
    // Phone is optional, so we only validate it if provided
    if (
      formData.name &&
      formData.categoryId > 0 &&
      formData.state &&
      formData.city &&
      phoneValidation.isValid &&
      dataString !== lastNotifiedDataRef.current
    ) {
      lastNotifiedDataRef.current = dataString;
      onNext(formData);
    }
  }, [
    formData.name,
    formData.categoryId,
    formData.state,
    formData.city,
    formData.businessPhone,
    formData.category,
    onNext,
  ]);

  const handleCategoryChange = (categoryId: number) => {
    setSelectedCategoryId(categoryId);
    const category = categories.find((c) => c.id === categoryId);
    setFormData((prev) => ({
      ...prev,
      categoryId,
      category: category?.name,
    }));
  };

  const handleChange = (
    field: keyof BusinessDetailsData,
    value: string | File | null,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle phone change with validation
  const handlePhoneChange = (value: string) => {
    // Only allow digits
    const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
    handleChange("businessPhone", digitsOnly);

    // Validate immediately
    if (digitsOnly) {
      const validation = validateIndianPhone(digitsOnly);
      setPhoneError(validation.isValid ? "" : (validation.error || ""));
    } else {
      setPhoneError("");
    }
  };

  // Handle state change with city validation
  const handleStateChange = (newState: string) => {
    setFormData((prev) => {
      // When state changes, check if current city is valid for new state
      if (prev.city && newState) {
        const cities = getCitiesByState(newState);
        if (!cities.includes(prev.city)) {
          // Clear city if it's not valid for the new state
          return { ...prev, state: newState, city: "" };
        }
      }
      return { ...prev, state: newState };
    });
  };

  // Handle city change
  const handleCityChange = (newCity: string) => {
    setFormData((prev) => ({ ...prev, city: newCity }));
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Business Details</h3>
        <p className="text-sm text-muted-foreground">
          Tell us about your business so customers can find you
        </p>
      </div>

      {/* Business Logo & Cover */}
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <Label>Business Logo</Label>
            <ImageUpload
              currentImage={
                formData.logo ? URL.createObjectURL(formData.logo) : null
              }
              onImageSelect={(file) => handleChange("logo", file)}
              className="h-32"
            />
            {/* <p className="text-xs text-muted-foreground">
              Recommended: Square image, at least 500x500px
            </p> */}
          </div>

          <div className="space-y-3">
            <Label>Cover Image</Label>
            <ImageUpload
              currentImage={
                formData.coverImage
                  ? URL.createObjectURL(formData.coverImage)
                  : null
              }
              onImageSelect={(file) => handleChange("coverImage", file)}
              className="h-32"
            />
          </div>
        </div>
      </div>
      <div className="pt-15"></div>

      {/* Business Name */}
      <div className="space-y-3">
        <Label htmlFor="businessName" className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Business Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="businessName"
          placeholder="e.g., QuickFix Plumbing Services"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          required
        />
      </div>

      {/* Category */}
      <div className="space-y-3">
        <Label>
          Category <span className="text-destructive">*</span>
        </Label>
        {isLoadingCategories ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading categories...
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge
                key={category.id}
                variant={
                  selectedCategoryId === category.id ? "default" : "outline"
                }
                className="cursor-pointer px-3 py-1"
                onClick={() => handleCategoryChange(category.id)}
              >
                {category.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Description */}
      <div className="space-y-3">
        <Label htmlFor="description">Business Description</Label>
        <Textarea
          id="description"
          placeholder="Describe your business, services offered, and what makes you unique..."
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          rows={4}
        />
        <p className="text-xs text-muted-foreground">
          This helps customers understand your business better
        </p>
      </div>

      {/* Business Phone */}
      <div className="space-y-3">
        <Label htmlFor="businessPhone" className="flex items-center gap-2">
          <Phone className="h-4 w-4" />
          Business Phone
        </Label>
        <Input
          id="businessPhone"
          type="tel"
          placeholder="9876543210"
          value={formData.businessPhone}
          onChange={(e) => handlePhoneChange(e.target.value)}
          maxLength={10}
          className={phoneError ? "border-destructive" : ""}
        />
        {phoneError ? (
          <Alert variant="destructive" className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">{phoneError}</AlertDescription>
          </Alert>
        ) : (
          <p className="text-xs text-muted-foreground">
            10 digits starting with 6-9 (e.g., 9876543210)
          </p>
        )}
      </div>

      {/* Location */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Business Location <span className="text-destructive">*</span>
        </Label>
        <StateCityPicker
          state={formData.state}
          city={formData.city}
          onStateChange={handleStateChange}
          onCityChange={handleCityChange}
          required
        />
      </div>

      {/* Website */}
      <div className="space-y-3">
        <Label htmlFor="website" className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Website (Optional)
        </Label>
        <Input
          id="website"
          type="url"
          placeholder="https://yourbusiness.com"
          value={formData.website}
          onChange={(e) => handleChange("website", e.target.value)}
        />
      </div>

      {/* Tips */}
      <div className="rounded-md border bg-muted/30 p-4">
        <h4 className="mb-2 font-medium text-sm">Tips</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>• Use a clear business name that customers can easily find</li>
          <li>• Choose the most relevant category for your services</li>
          <li>• Add a detailed description to attract more customers</li>
          <li>
            • Upload a logo and cover image to make your profile stand out
          </li>
        </ul>
      </div>
    </div>
  );
}
