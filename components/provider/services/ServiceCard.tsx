/**
 * Service Card Component
 * Individual service card for list view
 */

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  XCircle,
  IndianRupee,
  Clock,
  MoreHorizontal,
  Edit,
  Trash2,
  Power,
  PowerOff,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { Service } from "@/types/provider";

interface ServiceCardProps {
  service: Service;
  onEdit: (service: Service) => void;
  onDelete: (serviceId: number) => void;
  onToggleStatus: (serviceId: number, isActive: boolean) => void;
}

export function ServiceCard({
  service,
  onEdit,
  onDelete,
  onToggleStatus,
}: ServiceCardProps) {
  const getStatusBadge = () => {
    if (service.isActive) {
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-300">
          <CheckCircle className="h-3 w-3 mr-1" />
          Active
        </Badge>
      );
    }
    return (
      <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300">
        <XCircle className="h-3 w-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  const formatDuration = (minutes: number | undefined) => {
    // Handle undefined or invalid values
    if (!minutes || isNaN(minutes) || minutes <= 0) {
      return "Duration not set";
    }

    if (minutes < 60) {
      return `${minutes} min${minutes > 1 ? "s" : ""}`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      const remainingMins = minutes % 60;
      if (remainingMins === 0) {
        return `${hours} hour${hours > 1 ? "s" : ""}`;
      }
      return `${hours}h ${remainingMins}m`;
    } else {
      const days = Math.floor(minutes / 1440);
      return `${days} day${days > 1 ? "s" : ""}`;
    }
  };

  const handleToggleStatus = () => {
    onToggleStatus(service.id, !service.isActive);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Service Image */}
          <div className="h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
            {service.image ? (
              <img
                src={service.image}
                alt={service.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <BriefcaseIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Service Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3 className="font-semibold text-base truncate">
                  {service.name}
                </h3>
                <div className="flex items-center gap-3 mt-1 text-sm">
                  <span className="flex items-center text-muted-foreground">
                    <IndianRupee className="h-3 w-3 mr-1" />
                    {service.price}
                  </span>
                  <span className="flex items-center text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDuration(service.duration || service.EstimateDuration)}
                  </span>
                </div>
              </div>
              {getStatusBadge()}
            </div>

            {/* Description */}
            {service.description && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {service.description}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleStatus}
              title={service.isActive ? "Deactivate" : "Activate"}
            >
              {service.isActive ? (
                <PowerOff className="h-4 w-4" />
              ) : (
                <Power className="h-4 w-4" />
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(service)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleToggleStatus}>
                  {service.isActive ? (
                    <>
                      <PowerOff className="h-4 w-4 mr-2" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <Power className="h-4 w-4 mr-2" />
                      Activate
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(service.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}
