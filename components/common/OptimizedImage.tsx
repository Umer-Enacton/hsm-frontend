"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src?: string | null;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallback?: string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  unoptimized?: boolean;
}

/**
 * Optimized Image component with:
 * - Next.js Image optimization (WebP, lazy loading, responsive sizing)
 * - Automatic fallback for failed images
 * - Cloudinary URL detection
 * - Placeholder support
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  fallback = "/images/placeholder-service.png",
  priority = false,
  fill = false,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  unoptimized = false,
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState<string | null>(src || null);
  const [hasError, setHasError] = useState(!src);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallback);
    }
  };

  // If no source or has error, show fallback
  if (!imgSrc || hasError) {
    if (fill) {
      return (
        <div
          className={cn("bg-muted flex items-center justify-center", className)}
          style={{
            backgroundImage: `url(${fallback})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      );
    }
    return (
      <Image
        src={fallback}
        alt={alt}
        width={width || 100}
        height={height || 100}
        className={className}
        priority={priority}
        sizes={sizes}
        unoptimized={unoptimized}
      />
    );
  }

  // For Cloudinary images, we can add optimization parameters
  const optimizedSrc = getOptimizedCloudinaryUrl(imgSrc);

  const imageProps = {
    src: optimizedSrc,
    alt,
    className,
    priority,
    sizes,
    unoptimized,
    onError: handleError,
  };

  if (fill) {
    return <Image {...imageProps} fill sizes={sizes} />;
  }

  return <Image {...imageProps} width={width || 100} height={height || 100} />;
}

/**
 * Add Cloudinary optimization parameters to image URLs
 * This enables automatic WebP conversion, quality reduction, and responsive sizing
 */
function getOptimizedCloudinaryUrl(url: string): string {
  if (!url || !url.includes("cloudinary.com")) {
    return url;
  }

  try {
    const urlObj = new URL(url);

    // Add optimization parameters
    urlObj.searchParams.set("q", "80"); // Quality: 80%
    urlObj.searchParams.set("f_auto", ""); // Auto format (WebP, AVIF)
    urlObj.searchParams.set("c_auto", "g_face"); // Auto crop with face detection

    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * Square avatar variant for profile pictures
 */
export function AvatarImage({
  src,
  alt,
  className,
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={40}
      height={40}
      className={cn("rounded-full object-cover", className)}
      fallback="/images/placeholder-avatar.png"
    />
  );
}

/**
 * Service card image variant
 */
export function ServiceImage({
  src,
  alt,
  className,
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={300}
      height={200}
      className={cn("w-full h-full object-cover", className)}
      fallback="/images/placeholder-service.png"
      fill
    />
  );
}

/**
 * Business logo variant
 */
export function BusinessLogo({
  src,
  alt,
  className,
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={100}
      height={100}
      className={cn("object-contain", className)}
      fallback="/images/placeholder-logo.png"
    />
  );
}
