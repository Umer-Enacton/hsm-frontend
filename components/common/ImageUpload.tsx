"use client";

import React, { useCallback, useState } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  currentImage?: string | null;
  onImageSelect: (file: File | null) => void;
  onImageRemove?: () => void;
  className?: string;
  disabled?: boolean;
  isLoading?: boolean;
  isPending?: boolean; // Shows that the image is selected but not yet uploaded
  accept?: string;
  maxSize?: number; // in bytes (default: 5MB)
}

export function ImageUpload({
  currentImage,
  onImageSelect,
  onImageRemove,
  className,
  disabled = false,
  isLoading = false,
  isPending = false,
  accept = "image/jpeg,image/jpg,image/png,image/gif,image/webp",
  maxSize = 5 * 1024 * 1024, // 5MB
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [error, setError] = useState<string | null>(null);

  // Update preview when currentImage changes
  React.useEffect(() => {
    setPreview(currentImage || null);
    setError(null);
  }, [currentImage]);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }

      // Validate file size
      if (file.size > maxSize) {
        setError(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
        return;
      }

      setError(null);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Pass file to parent
      onImageSelect(file);
    },
    [maxSize, onImageSelect]
  );

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    onImageSelect(null);
    onImageRemove?.();
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Upload Area / Preview */}
      {preview ? (
        // Image Preview
        <div className="relative group">
          <div className="relative overflow-hidden rounded-lg border-2 border-muted bg-muted/30 aspect-video flex items-center justify-center">
            <img
              src={preview}
              alt="Preview"
              className="object-cover w-full h-full"
            />
            {isLoading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}
          </div>
          {!disabled && !isLoading && (
            <div className="absolute top-2 right-2 flex gap-2">
              {isPending && (
                <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                  <span className="h-2 w-2 bg-white rounded-full animate-pulse"></span>
                  Pending
                </div>
              )}
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={handleRemove}
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      ) : (
        // Upload Area
        <div className="relative">
          <input
            type="file"
            id="image-upload"
            accept={accept}
            onChange={handleFileSelect}
            disabled={disabled || isLoading}
            className="sr-only"
          />
          <label
            htmlFor="image-upload"
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 p-8 transition-colors cursor-pointer hover:border-muted-foreground/50 hover:bg-muted/50",
              (disabled || isLoading) && "cursor-not-allowed opacity-50"
            )}
          >
            {isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted-foreground/10">
                  {currentImage ? (
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  ) : (
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    {currentImage ? "Change image" : "Upload an image"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG, GIF, or WEBP (max {Math.round(maxSize / 1024 / 1024)}MB)
                  </p>
                </div>
              </>
            )}
          </label>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <span className="h-4 w-4">×</span>
          {error}
        </p>
      )}

      {/* Help Text */}
      {!error && !preview && (
        <p className="text-xs text-muted-foreground">
          This image will be displayed in the category card and list view.
        </p>
      )}
    </div>
  );
}

export default ImageUpload;
