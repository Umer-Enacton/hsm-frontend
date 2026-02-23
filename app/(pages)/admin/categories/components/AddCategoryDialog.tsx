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
import type { CategoryFormData, CategoryFormErrors } from "@/types/category";

interface AddCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (data: CategoryFormData) => Promise<void>;
  isLoading?: boolean;
}

export function AddCategoryDialog({
  open,
  onOpenChange,
  onAdd,
  isLoading = false,
}: AddCategoryDialogProps) {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    description: "",
    image: null,
  });
  const [errors, setErrors] = useState<CategoryFormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [useDirectUrl, setUseDirectUrl] = useState(false);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setFormData({ name: "", description: "", image: null });
      setErrors({});
      setTouched({});
      setImageFile(null);
      setUseDirectUrl(false);
    }
  }, [open]);

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
    if (!file) {
      setImageFile(null);
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
    setImageFile(file);

    // Upload image immediately
    setIsUploadingImage(true);
    try {
      const result = await uploadCategoryImage(file);
      setFormData((prev) => ({ ...prev, image: result.url }));
    } catch (error: any) {
      // If upload endpoint fails, show a helpful message
      setErrors((prev) => ({
        ...prev,
        image: "Upload endpoint not available. Please use a direct image URL instead.",
      }));
      setImageFile(null);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleImageRemove = () => {
    setImageFile(null);
    setFormData((prev) => ({ ...prev, image: null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({ name: true, description: true });

    // Validate all fields
    const isNameValid = validateField("name", formData.name);
    const isDescriptionValid = validateField("description", formData.description);

    if (!isNameValid || !isDescriptionValid) {
      return;
    }

    // Don't submit if image is still uploading
    if (isUploadingImage) {
      return;
    }

    try {
      await onAdd(formData);
      onOpenChange(false);
    } catch (error) {
      // Error is handled by parent
      console.error("Failed to add category:", error);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Category</DialogTitle>
          <DialogDescription>
            Create a new service category for your platform
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
                  Adding...
                </>
              ) : (
                "Add Category"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AddCategoryDialog;
