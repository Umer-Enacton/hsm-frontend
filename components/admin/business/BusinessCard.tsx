/**
 * Business Card Component
 * Individual business card for list view
 */

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MapPin,
  Star,
  Phone,
  Mail,
  Eye,
  CheckCircle,
  X,
  Trash2,
  MoreHorizontal,
  Clock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { Business } from "@/types/provider";

interface BusinessCardProps {
  business: Business;
  onViewDetails: (business: Business) => void;
  onVerify: (businessId: number) => void;
  onUnverify: (businessId: number) => void;
  onDelete: (businessId: number) => void;
}

export function BusinessCard({
  business,
  onViewDetails,
  onVerify,
  onUnverify,
  onDelete,
}: BusinessCardProps) {
  const getStatusBadge = () => {
    if (business.isVerified) {
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-300">
          <CheckCircle className="h-3 w-3 mr-1" />
          Verified
        </Badge>
      );
    }
    return (
      <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-300">
        <Clock className="h-3 w-3 mr-1" />
        Pending
      </Badge>
    );
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Business Logo */}
          <Avatar className="h-16 w-16 border">
            {business.logo ? (
              <AvatarImage src={business.logo} alt={business.name} />
            ) : (
              <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                {business.name?.charAt(0) || "B"}
              </AvatarFallback>
            )}
          </Avatar>

          {/* Business Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3 className="font-semibold text-base truncate">
                  {business.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {business.category}
                </p>
              </div>
              {getStatusBadge()}
            </div>

            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              {business.city && business.state && (
                <>
                  <MapPin className="h-3 w-3" />
                  <span>
                    {business.city}, {business.state}
                  </span>
                </>
              )}
            </div>

            {/* Provider Info */}
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <span>by {business.providerName}</span>
              <span>•</span>
              <span className="truncate">{business.providerEmail}</span>
            </div>

            {/* Rating */}
            {business.rating && (
              <div className="flex items-center gap-1 mt-2">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">
                  {business.rating.toFixed(1)}
                </span>
                {business.totalReviews && business.totalReviews > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({business.totalReviews} reviews)
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(business)}
            >
              <Eye className="h-4 w-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {business.isVerified ? (
                  <DropdownMenuItem onClick={() => onUnverify(business.id)}>
                    <X className="h-4 w-4 mr-2" />
                    Unverify
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => onVerify(business.id)}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Verify
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onViewDetails(business)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(business.id)}
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
