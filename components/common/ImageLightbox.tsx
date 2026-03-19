"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, ZoomIn, ZoomOut, RotateCw, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  alt?: string;
}

export function ImageLightbox({
  isOpen,
  onClose,
  imageUrl,
  alt = "Image",
}: ImageLightboxProps) {
  const [transform, setTransform] = useState({
    scale: 1,
    rotate: 0,
    x: 0,
    y: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Reset when opening new image
  useEffect(() => {
    if (isOpen) {
      setTransform({ scale: 1, rotate: 0, x: 0, y: 0 });
    }
  }, [isOpen, imageUrl]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Handle mouse wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newScale = Math.min(Math.max(transform.scale + delta, 0.5), 5);

      if (newScale <= 1) {
        setTransform((prev) => ({ ...prev, scale: newScale, x: 0, y: 0 }));
      } else {
        setTransform((prev) => ({ ...prev, scale: newScale }));
      }
    },
    [transform.scale],
  );

  // Handle mouse down for dragging
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (transform.scale > 1) {
        setIsDragging(true);
        setDragStart({
          x: e.clientX - transform.x,
          y: e.clientY - transform.y,
        });
      }
    },
    [transform.scale, transform.x, transform.y],
  );

  // Handle mouse move for dragging
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging && transform.scale > 1) {
        e.preventDefault();
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        setTransform((prev) => ({ ...prev, x: newX, y: newY }));
      }
    },
    [isDragging, dragStart.x, dragStart.y, transform.scale],
  );

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Global mouse up to catch drag release outside container
  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  // Zoom controls
  const handleZoomIn = () => {
    setTransform((prev) => ({
      ...prev,
      scale: Math.min(prev.scale + 0.25, 5),
    }));
  };

  const handleZoomOut = () => {
    const newScale = Math.max(transform.scale - 0.25, 0.5);
    if (newScale <= 1) {
      setTransform({ scale: 1, rotate: transform.rotate, x: 0, y: 0 });
    } else {
      setTransform((prev) => ({ ...prev, scale: newScale }));
    }
  };

  const handleRotate = () => {
    setTransform((prev) => ({ ...prev, rotate: prev.rotate + 90 }));
  };

  const handleReset = () => {
    setTransform({ scale: 1, rotate: 0, x: 0, y: 0 });
  };

  const isTransformed =
    transform.scale !== 1 ||
    transform.rotate !== 0 ||
    transform.x !== 0 ||
    transform.y !== 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="!p-0 !bg-black/95 !border-0 overflow-hidden rounded-lg [&>button:last-child]:hidden"
        style={{
          width: "55vw",
          height: "70vh",
          maxWidth: "98vw",
          maxHeight: "95vh",
        }}
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-50 text-white/70 hover:text-white bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors"
          title="Close (ESC)"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Controls */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            disabled={transform.scale <= 0.5}
            className="text-white hover:bg-white/20 h-8 w-8"
            title="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>

          <span className="text-white text-sm min-w-[3rem] text-center font-medium">
            {Math.round(transform.scale * 100)}%
          </span>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            disabled={transform.scale >= 5}
            className="text-white hover:bg-white/20 h-8 w-8"
            title="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          <div className="w-px h-5 bg-white/30 mx-0.5" />

          <Button
            variant="ghost"
            size="icon"
            onClick={handleRotate}
            className="text-white hover:bg-white/20 h-8 w-8"
            title="Rotate"
          >
            <RotateCw className="h-4 w-4" />
          </Button>

          {isTransformed && (
            <>
              <div className="w-px h-5 bg-white/30 mx-0.5" />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-white hover:bg-white/20 h-8 px-2 text-sm"
                title="Reset"
              >
                <Maximize2 className="h-3.5 w-3.5 mr-1" />
                Reset
              </Button>
            </>
          )}
        </div>

        {/* Help hint */}
        {transform.scale === 1 && !isTransformed && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 text-white/60 text-xs bg-black/50 px-3 py-1.5 rounded-full pointer-events-none">
            🖱️ Scroll to zoom • Drag to pan
          </div>
        )}

        {/* Image container - fills entire dialog */}
        <div
          ref={containerRef}
          className="w-full h-full flex items-center justify-center overflow-hidden p-4"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{
            cursor: isDragging
              ? "grabbing"
              : transform.scale > 1
                ? "grab"
                : "default",
          }}
        >
          {imageUrl && (
            <img
              ref={imageRef}
              src={imageUrl}
              alt={alt}
              className="max-w-full max-h-full object-contain transition-transform duration-75 ease-out select-none pointer-events-none"
              style={{
                transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale}) rotate(${transform.rotate}deg)`,
                transformOrigin: "center center",
              }}
              draggable={false}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
