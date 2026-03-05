"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { categoryValidators, uploadCategoryImage } from "@/lib/category-api";
import { ImageUpload } from "@/components/common";
import type { Category, CategoryFormData, CategoryFormErrors } from "@/types/category";

interface EditCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  onUpdate: (id: number, data: CategoryFormData) => Promise<void>;
  isLoading?: boolean;
}

export function EditCategoryDialog({
  open,
  onOpenChange,
  category,
  onUpdate,
  isLoading = false,
}: EditCategoryDialogProps) {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    description: "",
    image: null,
  });
  const [errors, setErrors] = useState<CategoryFormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [useDirectUrl, setUseDirectUrl] = useState(false);

  // Initialize form when category changes
  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description,
        image: category.image || null,
      });
      setErrors({});
      setTouched({});
      setPendingImageFile(null);
      setUseDirectUrl(false);
    }
  }, [category]);

  const validateField = (name: string, value: string) => {
    const validator =
      name === "name"
        ? categoryValidators.name
        : categoryValidators.description;
    const result = validator(value);

    setErrors((prev) => ({
      ...prev,
      [name]: result.valid ? undefined : result.error,
    }));

    return result.valid;
  };

  const handleFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Validate if field has been touched
    if (touched[name]) {
      validateField(name, value);
    }
  };

  const handleFieldBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, formData[name as keyof CategoryFormData] as string);
  };

  const handleImageSelect = async (file: File | null) => {
    console.log("🔍 [EditCategory] handleImageSelect called", file?.name || "null");
    if (!file) {
      setPendingImageFile(null);
      setFormData((prev) => ({ ...prev, image: null }));
      return;
    }

    // Validate image
    const validation = categoryValidators.image(file);
    if (!validation.valid) {
      setErrors((prev) => ({ ...prev, image: validation.error }));
      return;
    }

    setErrors((prev) => ({ ...prev, image: undefined }));
    // Store the file locally - don't upload yet
    console.log("✅ [EditCategory] File stored locally in pendingImageFile state - NO API CALL");
    setPendingImageFile(file);
    // The ImageUpload component will show the preview via FileReader
  };

  const handleImageRemove = () => {
    setPendingImageFile(null);
    setFormData((prev) => ({ ...prev, image: null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!category) return;

    console.log("🚀 [EditCategory] handleSubmit - Submit button clicked");

    // Mark all fields as touched
    setTouched({ name: true, description: true });

    // Validate all fields
    const isNameValid = validateField("name", formData.name);
    const isDescriptionValid = validateField("description", formData.description);

    if (!isNameValid || !isDescriptionValid) {
      return;
    }

    setIsUploadingImage(true);

    try {
      // Step 1: Upload image if there's a pending file
      let imageUrl = formData.image;
      if (pendingImageFile) {
        console.log("⬆️ [EditCategory] Pending file found - Uploading to Cloudinary NOW:", pendingImageFile.name);
        try {
          const result = await uploadCategoryImage(pendingImageFile);
          imageUrl = result.url;
          console.log("✅ [EditCategory] Upload successful, URL:", imageUrl);
        } catch (error: any) {
          console.error("❌ [EditCategory] Upload failed:", error);
          setErrors((prev) => ({
            ...prev,
            image: error.message || "Failed to upload image",
          }));
          setIsUploadingImage(false);
          return;
        }
      } else {
        console.log("ℹ️ [EditCategory] No pending file - skipping upload");
      }

      // Step 2: Update category with the image URL
      console.log("📤 [EditCategory] Submitting form data with image URL");
      await onUpdate(category.id, { ...formData, image: imageUrl });
      onOpenChange(false);
    } catch (error) {
      // Error is handled by parent
      console.error("Failed to update category:", error);
    } finally {
      setIsUploadingImage(false);
      setPendingImageFile(null);
    }
  };

  const nameCharCount = formData.name.length;
  const descriptionCharCount = formData.description.length;

  const isFormValid =
    formData.name.trim().length >= 2 &&
    formData.name.trim().length <= 100 &&
    formData.description.trim().length >= 10 &&
    formData.description.trim().length <= 500 &&
    !isUploadingImage;

  if (!category) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
          <DialogDescription>
            Update category information
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Upload/URL Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Category Image</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setUseDirectUrl(!useDirectUrl)}
                className="text-xs h-7"
              >
                {useDirectUrl ? "Use File Upload" : "Use Direct URL"}
              </Button>
            </div>

            {useDirectUrl ? (
              // Direct URL input
              <div className="space-y-2">
                <Input
                  placeholder="https://res.cloudinary.com/..."
                  value={formData.image || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, image: e.target.value }))}
                  disabled={isLoading}
                />
                {formData.image && (
                  <div className="relative w-full aspect-video max-w-xs overflow-hidden rounded-lg border">
                    <Image
                      src={formData.image}
                      alt="Preview"
                      fill
                      className="object-contain"
                      sizes="300px"
                    />
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData((prev) => ({ ...prev, image: null }))}
                >
                  Clear Image
                </Button>
              </div>
            ) : (
              // File upload
              <>
                <ImageUpload
                  currentImage={formData.image}
                  onImageSelect={handleImageSelect}
                  onImageRemove={handleImageRemove}
                  disabled={isLoading}
                  isLoading={isUploadingImage}
                  isPending={pendingImageFile !== null}
                />
                {touched.image && errors.image && (
                  <span className="text-destructive text-sm">{errors.image}</span>
                )}
                {errors.image && !touched.image && (
                  <p className="text-xs text-muted-foreground">
                    Upload failed. Try using a direct image URL instead.
                  </p>
                )}
              </>
            )}
          </div>

          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleFieldChange}
              onBlur={handleFieldBlur}
              placeholder="e.g., Plumbing, Electrical, Cleaning"
              disabled={isLoading}
              className={
                touched.name && errors.name
                  ? "border-destructive focus-visible:ring-destructive"
                  : ""
              }
            />
            <div className="flex items-center justify-between text-xs">
              {touched.name && errors.name ? (
                <span className="text-destructive">{errors.name}</span>
              ) : (
                <span className="text-muted-foreground">
                  2-100 characters
                </span>
              )}
              <span
                className={
                  nameCharCount > 100
                    ? "text-destructive"
                    : "text-muted-foreground"
                }
              >
                {nameCharCount}/100
              </span>
            </div>
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleFieldChange}
              onBlur={handleFieldBlur}
              placeholder="Describe what services fall under this category..."
              rows={4}
              disabled={isLoading}
              className={
                touched.description && errors.description
                  ? "border-destructive focus-visible:ring-destructive"
                  : "resize-none"
              }
            />
            <div className="flex items-center justify-between text-xs">
              {touched.description && errors.description ? (
                <span className="text-destructive">{errors.description}</span>
              ) : (
                <span className="text-muted-foreground">
                  10-500 characters
                </span>
              )}
              <span
                className={
                  descriptionCharCount > 500
                    ? "text-destructive"
                    : "text-muted-foreground"
                }
              >
                {descriptionCharCount}/500
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading || isUploadingImage}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!isFormValid || isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Category"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default EditCategoryDialog;
