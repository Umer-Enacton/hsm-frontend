"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DownloadInvoiceButtonProps {
  bookingId: number;
  variant?: "dropdown" | "button";
  size?: "default" | "sm" | "icon";
  className?: string;
}

export function DownloadInvoiceButton({
  bookingId,
  variant = "button",
  size = "sm",
  className = "",
}: DownloadInvoiceButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      // TODO: Implement actual invoice download
      // Future: await api.get(API_ENDPOINTS.BOOKING_INVOICE(bookingId), { responseType: 'blob' })

      // For now, show info message
      setTimeout(() => {
        setIsDownloading(false);
        // Using toast directly since we can't import it here easily
        alert("Invoice download feature coming soon! This will download a PDF invoice for booking #" + bookingId);
      }, 500);
    } catch (error) {
      setIsDownloading(false);
      console.error("Error downloading invoice:", error);
    }
  };

  if (variant === "dropdown") {
    return (
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className={className || "flex w-full items-center gap-2 px-2 py-1.5 text-sm"}
      >
        {isDownloading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Download className="h-4 w-4 mr-2" />
        )}
        Download Invoice
      </button>
    );
  }

  return (
    <Button
      size={size}
      variant="outline"
      onClick={handleDownload}
      disabled={isDownloading}
      className={className}
    >
      {isDownloading ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Downloading...
        </>
      ) : (
        <>
          <Download className="h-3.5 w-3.5" />
          Download Invoice
        </>
      )}
    </Button>
  );
}
