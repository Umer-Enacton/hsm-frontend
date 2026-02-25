/**
 * Service Card Component
 * Displays service as a vertical card (suitable for grid view)
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
  Star,
  MessageSquare,
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
  onViewReviews?: (service: Service) => void;
}

export function ServiceCard({
  service,
  onEdit,
  onDelete,
  onToggleStatus,
  onViewReviews,
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
      <CardContent className="p-4 space-y-3">
        {/* Header: Name + Status Badge */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-base line-clamp-1 flex-1" title={service.name}>
            {service.name}
          </h3>
          {getStatusBadge()}
        </div>

        {/* Description */}
        {service.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
            {service.description}
          </p>
        )}

        {/* Details: Price, Duration, Rating */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <IndianRupee className="h-3.5 w-3.5" />
              <span className="font-medium">{service.price}</span>
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatDuration(service.duration || service.EstimateDuration)}</span>
            </span>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1.5 py-2 border-t">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            <span className="font-medium text-sm">{Number(service.rating || 0).toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">
              ({service.totalReviews || 0})
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            variant={service.isActive ? "outline" : "default"}
            size="sm"
            onClick={handleToggleStatus}
            className="flex-1"
          >
            {service.isActive ? (
              <>
                <PowerOff className="h-3.5 w-3.5 mr-1" />
                Deactivate
              </>
            ) : (
              <>
                <Power className="h-3.5 w-3.5 mr-1" />
                Activate
              </>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="px-2">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(service)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onViewReviews && onViewReviews(service)}>
                <MessageSquare className="h-4 w-4 mr-2" />
                View Reviews ({service.totalReviews || 0})
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
      </CardContent>
    </Card>
  );
}
