"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getApiBaseUrl } from "@/lib/api";

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

      // Get API URL at runtime
      const apiUrl = getApiBaseUrl();

      // Get token from storage
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");

      const response = await fetch(`${apiUrl}/invoice/booking/${bookingId}`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: "Failed to download invoice",
        }));
        throw new Error(errorData.message || "Failed to download invoice");
      }

      // Get filename from Content-Disposition header if available
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `invoice-${bookingId}.pdf`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      // Get PDF blob
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Invoice downloaded successfully!");
    } catch (error: any) {
      console.error("Error downloading invoice:", error);
      toast.error(error.message || "Failed to download invoice");
    } finally {
      setIsDownloading(false);
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
