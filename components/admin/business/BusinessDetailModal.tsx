/**
 * Business Detail Modal Component
 * Shows comprehensive business information in a modal
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MapPin,
  Globe,
  Phone,
  Mail,
  Star,
  CheckCircle,
  Clock,
  X,
  Trash2,
  Calendar,
  TrendingUp,
} from "lucide-react";
import type { Business } from "@/types/provider";

interface BusinessDetailModalProps {
  business: Business;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerify: (businessId: number) => void;
  onUnverify: (businessId: number) => void;
  onDelete: (businessId: number) => void;
}

export function BusinessDetailModal({
  business,
  open,
  onOpenChange,
  onVerify,
  onUnverify,
  onDelete,
}: BusinessDetailModalProps) {
  const handleDelete = () => {
    if (confirm(
      `Are you sure you want to delete "${business.name}"? This will delete all services, bookings, and associated data. This action cannot be undone.`
    )) {
      onDelete(business.id);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Business Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header with Logo and Basic Info */}
          <div className="flex gap-4">
            <Avatar className="h-20 w-20 border-2">
              {business.logo ? (
                <AvatarImage src={business.logo} alt={business.name} />
              ) : (
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {business.name?.charAt(0) || "B"}
                </AvatarFallback>
              )}
            </Avatar>

            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{business.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge>{business.category}</Badge>
                    {business.isVerified ? (
                      <Badge className="bg-green-100 text-green-700 border-green-300">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {business.description && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {business.description}
                </p>
              )}

              {/* Rating */}
              {business.rating && (
                <div className="flex items-center gap-2 mt-2">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{business.rating.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">
                    ({business.totalReviews || 0} reviews)
                  </span>
                </div>
              )}

              {/* Location & Contact */}
              <div className="flex flex-wrap gap-4 mt-3 text-sm">
                {business.city && business.state && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{business.city}, {business.state}</span>
                  </div>
                )}
                {business.phone && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{business.phone}</span>
                  </div>
                )}
                {business.website && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Globe className="h-4 w-4" />
                    <a
                      href={business.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {business.website.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabs for more information */}
          <Tabs defaultValue="provider" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="provider">Provider</TabsTrigger>
              <TabsTrigger value="stats">Statistics</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
            </TabsList>

            {/* Provider Info Tab */}
            <TabsContent value="provider" className="mt-4">
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <h4 className="font-semibold mb-3">Provider Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Name:</span>
                        <span className="font-medium">{business.providerName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{business.providerEmail}</span>
                      </div>
                      {business.providerPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{business.providerPhone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg border p-4">
                    <h4 className="font-semibold mb-3">Business Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Status:</span>
                        {business.isVerified ? (
                          <Badge className="bg-green-100 text-green-700">Active</Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Category:</span>
                        <span className="font-medium">{business.category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Business Phone:</span>
                        <span className="font-medium">{business.phone || "Not set"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Location:</span>
                        <span className="font-medium">
                          {business.city && business.state
                            ? `${business.city}, ${business.state}`
                            : "Not set"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Statistics Tab */}
            <TabsContent value="stats" className="mt-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <Calendar className="h-8 w-8 text-primary mb-2" />
                  <p className="text-2xl font-bold">{business.totalBookings || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Bookings</p>
                </div>
                <div className="rounded-lg border p-4">
                  <TrendingUp className="h-8 w-8 text-green-600 mb-2" />
                  <p className="text-2xl font-bold">{business.rating?.toFixed(1) || "New"}</p>
                  <p className="text-sm text-muted-foreground">Rating</p>
                </div>
                <div className="rounded-lg border p-4">
                  <Star className="h-8 w-8 text-yellow-500 mb-2" />
                  <p className="text-2xl font-bold">{business.totalReviews || 0}</p>
                  <p className="text-sm text-muted-foreground">Reviews</p>
                </div>
              </div>
            </TabsContent>

            {/* Actions Tab */}
            <TabsContent value="actions" className="mt-4">
              <div className="space-y-3">
                {business.isVerified ? (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      onUnverify(business.id);
                      onOpenChange(false);
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Unverify Business
                  </Button>
                ) : (
                  <Button
                    className="w-full justify-start"
                    onClick={() => {
                      onVerify(business.id);
                      onOpenChange(false);
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Verify Business
                  </Button>
                )}

                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Business
                </Button>

                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">
                    <strong>⚠️ Warning:</strong> Deleting this business will permanently remove all services, bookings, and data associated with it. This action cannot be undone.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Footer Actions */}
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
