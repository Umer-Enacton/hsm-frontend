"use client";

import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RebookButtonProps {
  serviceId: number;
  variant?: "dropdown" | "button";
  size?: "default" | "sm" | "icon";
  className?: string;
}

export function RebookButton({
  serviceId,
  variant = "button",
  size = "sm",
  className = "",
}: RebookButtonProps) {
  const router = useRouter();

  const handleRebook = () => {
    router.push(`/customer/services/${serviceId}`);
  };

  if (variant === "dropdown") {
    return (
      <button
        onClick={handleRebook}
        className={className || "flex w-full items-center gap-2 px-2 py-1.5 text-sm"}
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Rebook Service
      </button>
    );
  }

  return (
    <Button
      size={size}
      variant="outline"
      onClick={handleRebook}
      className={className}
    >
      <RefreshCw className="h-3.5 w-3.5" />
      Rebook Service
    </Button>
  );
}
