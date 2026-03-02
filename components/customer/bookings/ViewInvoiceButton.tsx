"use client";

import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InvoicePreviewModal } from "./InvoicePreviewModal";

interface ViewInvoiceButtonProps {
  bookingId: number;
  variant?: "dropdown" | "button";
  size?: "default" | "sm" | "icon";
  className?: string;
}

export function ViewInvoiceButton({
  bookingId,
  variant = "button",
  size = "sm",
  className = "",
}: ViewInvoiceButtonProps) {
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const handleView = () => {
    setShowPreviewModal(true);
  };

  if (variant === "dropdown") {
    return (
      <>
        <button
          onClick={handleView}
          className={className || "flex w-full items-center gap-2 px-2 py-1.5 text-sm"}
        >
          <FileText className="h-4 w-4 mr-2" />
          View Invoice
        </button>

        <InvoicePreviewModal
          bookingId={bookingId}
          open={showPreviewModal}
          onOpenChange={setShowPreviewModal}
        />
      </>
    );
  }

  return (
    <>
      <Button
        size={size}
        variant="outline"
        onClick={handleView}
        className={className}
      >
        <FileText className="h-3.5 w-3.5 mr-2" />
        View Invoice
      </Button>

      <InvoicePreviewModal
        bookingId={bookingId}
        open={showPreviewModal}
        onOpenChange={setShowPreviewModal}
      />
    </>
  );
}
