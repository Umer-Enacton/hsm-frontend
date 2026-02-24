"use client";

import { useState, useEffect } from "react";
import { Loader2, Star, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";

// Mock data - will be replaced with API calls
const mockReviews = [
  {
    id: 1,
    bookingId: 123,
    service: { id: 1, name: "AC Service" },
    provider: { id: 1, businessName: "Cool Air Services" },
    rating: 5,
    comments: "Excellent service! Very professional and on time.",
    createdAt: "2026-02-20T10:30:00Z",
  },
  {
    id: 2,
    bookingId: 124,
    service: { id: 2, name: "Plumbing Repair" },
    provider: { id: 2, businessName: "QuickFix Plumbing" },
    rating: 4,
    comments: "Good work, but arrived a bit late.",
    createdAt: "2026-02-18T14:15:00Z",
  },
];

export default function CustomerReviewsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [reviews, setReviews] = useState(mockReviews);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setReviews(mockReviews);
      setIsLoading(false);
    }, 500);
  }, []);

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

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Reviews</h1>
        <p className="text-muted-foreground">View and manage your service reviews</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Reviews
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reviews.length}</div>
            <p className="text-xs text-muted-foreground">Reviews submitted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Rating
            </CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reviews.length > 0
                ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                : "0.0"}
            </div>
            <div className="flex items-center gap-1">
              {reviews.length > 0 &&
                renderStars(Math.round(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              5-Star Reviews
            </CardTitle>
            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reviews.filter((r) => r.rating === 5).length}
            </div>
            <p className="text-xs text-muted-foreground">Perfect ratings</p>
          </CardContent>
        </Card>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
            <p className="text-sm text-muted-foreground text-center">
              Your completed bookings will appear here. Leave a review after a service is completed.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{review.service.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{review.provider.businessName}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {renderStars(review.rating)}
                    <span className="ml-2 text-sm font-medium">{review.rating}.0</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {review.comments && (
                  <p className="text-sm text-muted-foreground mb-3">"{review.comments}"</p>
                )}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Reviewed on {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    Booking #{review.bookingId}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
