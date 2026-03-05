"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, Globe, Star, Edit } from "lucide-react";
import type { Business } from "@/types/provider";

interface BusinessProfileCardProps {
  business: Business;
  onEdit: () => void;
}

export function BusinessProfileCard({
  business,
  onEdit,
}: BusinessProfileCardProps) {
  return (
    <Card className="overflow-hidden">
      {/* Cover Image */}
      <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-background relative">
        {business.coverImage ? (
          <img
            src={business.coverImage}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Globe className="h-12 w-12 mx-auto text-primary/30" />
              <p className="text-xs text-muted-foreground mt-2">
                Add Cover Image
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <CardContent className="relative">
        {/* Logo */}
        <div className="-mt-12 mb-4">
          <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
            {business.logo ? (
              <AvatarImage src={business.logo} alt={business.name} />
            ) : (
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                {business.name}
              </AvatarFallback>
            )}
          </Avatar>
        </div>

        {/* Name & Badge */}
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{business.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                {business.category && (
                  <Badge variant="outline" className="text-xs">
                    {business.category}
                  </Badge>
                )}
                <Badge
                  variant={business.isVerified ? "default" : "secondary"}
                  className={business.isVerified ? "bg-green-600" : ""}
                >
                  {business.isVerified ? "✓ Verified" : "⏳ Pending"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Description */}
          {business.description && (
            <p className="text-muted-foreground text-sm line-clamp-3">
              {business.description}
            </p>
          )}

          {/* Rating (only if verified) */}
          {business.isVerified && (
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">
                {business.rating ? business.rating.toFixed(1) : "New"}
              </span>
              {(business.totalReviews || 0) > 0 && (
                <span className="text-muted-foreground text-sm">
                  ({business.totalReviews} review
                  {(business.totalReviews || 0) > 1 ? "s" : ""})
                </span>
              )}
            </div>
          )}

          {/* Contact Information */}
          <div className="space-y-2 text-sm pt-2 border-t">
            {/* Business Location */}
            {(business.city || business.state) && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>
                  {business.city}
                  {business.city && business.state && ", "}
                  {business.state}
                </span>
                <span className="text-xs text-muted-foreground">(Business)</span>
              </div>
            )}
            {/* Business Phone */}
            {business.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{business.phone}</span>
                <span className="text-xs text-muted-foreground">(Business)</span>
              </div>
            )}
            {/* Business Website */}
            {business.website && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <a
                  href={business.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline truncate"
                >
                  {business.website.replace(/^https?:\/\//, "")}
                </a>
              </div>
            )}
            {/* Provider Email (for reference) */}
            {business.providerEmail && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{business.providerEmail}</span>
                <span className="text-xs text-muted-foreground">(Provider)</span>
              </div>
            )}
            {/* Provider Phone (for reference) */}
            {business.providerPhone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{business.providerPhone}</span>
                <span className="text-xs text-muted-foreground">(Provider)</span>
              </div>
            )}
          </div>

          {/* Edit Button */}
          <Button onClick={onEdit} className="w-full mt-4" variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
