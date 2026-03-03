/**
 * Service Card Component
 * Premium card design with medium image, clean & minimal aesthetic
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
  Image as ImageIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { Service } from "@/types/provider";
import { cn } from "@/lib/utils";

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
        <Badge className="bg-white/90 backdrop-blur-sm text-green-700 hover:bg-white border-green-200 shadow-sm">
          <CheckCircle className="h-3 w-3 mr-1" />
          Active
        </Badge>
      );
    }
    return (
      <Badge className="bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white border-gray-200 shadow-sm">
        <XCircle className="h-3 w-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  const formatDuration = (minutes: number | undefined) => {
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
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-gray-200 p-0 gap-0">
      {/* Image Section with Overlay */}
      <div className="relative h-40 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        {service.image ? (
          <img
            src={service.image}
            alt={service.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="h-12 w-12 text-gray-300" />
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Floating Status Badge */}
        <div className="absolute top-3 right-3">{getStatusBadge()}</div>

        {/* Service Name Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white font-semibold text-lg line-clamp-2 drop-shadow-lg">
            {service.name}
          </h3>
        </div>
      </div>

      {/* Content Section */}
      <CardContent className="p-5 space-y-4">
        {/* Description */}
        {service.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem] leading-relaxed">
            {service.description}
          </p>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Price */}
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
              <IndianRupee className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Price</p>
              <p className="font-semibold text-gray-900">{service.price}</p>
            </div>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
              <Clock className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className="font-medium text-gray-900 text-sm">
                {formatDuration(service.duration || service.EstimateDuration)}
              </p>
            </div>
          </div>
        </div>

        {/* Rating Section */}
        <div className="flex items-center gap-2 py-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-full">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="font-semibold text-sm text-gray-900">
              {Number(service.rating || 0).toFixed(1)}
            </span>
            <span className="text-xs text-gray-600">
              ({service.totalReviews || 0} reviews)
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant={service.isActive ? "outline" : "default"}
            size="sm"
            onClick={handleToggleStatus}
            className={cn(
              "flex-1",
              service.isActive
                ? "border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                : "bg-gray-900 text-white hover:bg-gray-800",
            )}
          >
            {service.isActive ? (
              <>
                <PowerOff className="h-4 w-4 mr-1.5" />
                Deactivate
              </>
            ) : (
              <>
                <Power className="h-4 w-4 mr-1.5" />
                Activate
              </>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="px-3 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => onEdit(service)}
                className="cursor-pointer"
              >
                <Edit className="h-4 w-4 mr-2 text-gray-600" />
                <span>Edit Service</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onViewReviews && onViewReviews(service)}
                className="cursor-pointer"
              >
                <MessageSquare className="h-4 w-4 mr-2 text-gray-600" />
                <span>View Reviews</span>
                {service.totalReviews > 0 && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {service.totalReviews}
                  </Badge>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(service.id)}
                className="text-red-600 cursor-pointer"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
