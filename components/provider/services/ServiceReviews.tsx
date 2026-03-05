"use client";

import { useState, useEffect } from "react";
import { Loader2, Star, Calendar, User, MessageSquare, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { api, API_ENDPOINTS } from "@/lib/api";
import { toast } from "sonner";

interface ServiceReview {
  id: number;
  bookingId: number;
  rating: number;
  comments?: string;
  createdAt: string;
  customerName: string;
}

interface ServiceReviewsProps {
  serviceId: number;
  serviceName: string;
  serviceRating: number;
  totalReviews: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ServiceReviews({
  serviceId,
  serviceName,
  serviceRating,
  totalReviews,
  open,
  onOpenChange,
}: ServiceReviewsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [reviews, setReviews] = useState<ServiceReview[]>([]);

  useEffect(() => {
    if (open && serviceId) {
      loadReviews();
    }
  }, [open, serviceId]);

  const loadReviews = async () => {
    try {
      setIsLoading(true);
      const response = await api.get<{ feedback: ServiceReview[] }>(
        API_ENDPOINTS.FEEDBACK_BY_SERVICE(serviceId)
      );
      setReviews(response.feedback || []);
    } catch (error) {
      console.error("Error loading reviews:", error);
      toast.error("Failed to load reviews");
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-400" />
              Customer Reviews
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription className="flex items-center gap-4 mt-2">
            <span className="font-semibold text-lg">{serviceName}</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">
                {Number(serviceRating || 0).toFixed(1)}
              </span>
              <div className="flex flex-col items-start">
                <div className="flex">{renderStars(Math.round(serviceRating || 0))}</div>
                <span className="text-xs text-muted-foreground">
                  {totalReviews || 0} review{totalReviews !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No reviews yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Reviews will appear here when customers leave feedback
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review, index) => (
                <div key={review.id}>
                  {index > 0 && <Separator className="mb-6" />}
                  <div className="space-y-3">
                    {/* Header: Rating + Date */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="flex">{renderStars(review.rating)}</div>
                          <Badge variant="outline" className="text-xs">
                            {review.rating}/5
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            <span className="font-medium">{review.customerName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{formatDate(review.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Comments */}
                    {review.comments && (
                      <div className="pl-1">
                        <p className="text-sm leading-relaxed">{review.comments}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
