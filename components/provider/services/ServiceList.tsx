/**
 * Service List Component
 * Grid or List layout for displaying service cards
 */

import { Loader2, Package } from "lucide-react";
import { ServiceCard } from "./ServiceCard";
import type { Service } from "@/types/provider";

type ViewMode = "grid" | "list";

interface ServiceListProps {
  services: Service[];
  isLoading: boolean;
  viewMode: ViewMode;
  onEdit: (service: Service) => void;
  onDelete: (serviceId: number) => void;
  onToggleStatus: (serviceId: number, isActive: boolean) => void;
}

export function ServiceList({
  services,
  isLoading,
  viewMode,
  onEdit,
  onDelete,
  onToggleStatus,
}: ServiceListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading services...</p>
        </div>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="rounded-full bg-muted p-6 mb-4">
          <Package className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No services found</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          {"You haven't created any services yet. Click 'Add Service' to get started."}
        </p>
      </div>
    );
  }

  // Grid view - multi-column layout
  if (viewMode === "grid") {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleStatus={onToggleStatus}
          />
        ))}
      </div>
    );
  }

  // List view - single column layout
  return (
    <div className="space-y-3">
      {services.map((service) => (
        <ServiceCard
          key={service.id}
          service={service}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleStatus={onToggleStatus}
        />
      ))}
    </div>
  );
}
