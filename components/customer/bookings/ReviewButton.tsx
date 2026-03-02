"use client";

import { useState, useEffect } from "react";
import { Star, X, Loader2, MessageSquare, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { api, API_ENDPOINTS } from "@/lib/api";
import { toast } from "sonner";

interface ReviewButtonProps {
  serviceId: number;
  bookingId: number;
  serviceName?: string;
  onReviewSubmitted?: () => void;
  variant?: "dropdown" | "button";
  size?: "default" | "sm" | "icon";
  className?: string;
  existingReview?: boolean;
}

const RATING_LABELS: Record<number, string> = {
  1: "Poor",
  2: "Average",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

export function ReviewButton({
  serviceId,
  bookingId,
  serviceName,
  onReviewSubmitted,
  variant = "button",
  size = "sm",
  className = "",
  existingReview = false,
}: ReviewButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use existingReview prop directly - no separate state needed
  const hasReviewed = existingReview;

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    try {
      setIsSubmitting(true);

      const result: any = await api.post(API_ENDPOINTS.ADD_FEEDBACK, {
        bookingId,
        rating,
        comments: comments.trim() || undefined,
      });

      // Show success toast
      toast.success("Thank you for your review!");

      setShowModal(false);
      setRating(0);
      setComments("");

      // Call callback to refresh bookings (this will update existingReview prop from backend)
      await onReviewSubmitted?.();
    } catch (error: any) {
      // Check if error is about duplicate review
      if (error.message?.includes("already exists") || error.message?.includes("Feedback already")) {
        toast.error("You have already reviewed this booking");
      } else {
        toast.error(error.message || "Failed to submit review");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDisplayRating = () => {
    return hoveredRating > 0 ? hoveredRating : rating;
  };

  const ratingLabel = RATING_LABELS[getDisplayRating()];

  if (variant === "dropdown") {
    return (
      <>
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Rate Your Experience</DialogTitle>
              <DialogDescription>
                {serviceName && `How was your experience with "${serviceName}"?`}
                {!serviceName && "Share your feedback about this service."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Star Rating */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  Tap to rate
                </p>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= (hoveredRating || rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300 dark:text-gray-600"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-sm font-semibold mt-3 text-primary">
                    {RATING_LABELS[rating]}
                  </p>
                )}
              </div>

              {/* Comments */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Your Review (Optional)
                </label>
                <Textarea
                  placeholder="Tell us about your experience..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowModal(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || rating === 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Submit Review
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <button
          onClick={() => setShowModal(true)}
          disabled={isSubmitting || hasReviewed}
          className={className}
        >
          {hasReviewed ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
              Reviewed
            </>
          ) : (
            <>
              <MessageSquare className="h-4 w-4 mr-2" />
              Leave Review
            </>
          )}
        </button>
      </>
    );
  }

  return (
    <>
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rate Your Experience</DialogTitle>
            <DialogDescription>
              {serviceName && `How was your experience with "${serviceName}"?`}
              {!serviceName && "Share your feedback about this service."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Star Rating */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Tap to rate
              </p>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= (hoveredRating || rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300 dark:text-gray-600"
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-sm font-semibold mt-3 text-primary">
                  {RATING_LABELS[rating]}
                </p>
              )}
            </div>

            {/* Comments */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Your Review (Optional)
              </label>
              <Textarea
                placeholder="Tell us about your experience..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowModal(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || rating === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Submit Review
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button
        size={size}
        variant={hasReviewed ? "secondary" : "outline"}
        onClick={() => setShowModal(true)}
        disabled={isSubmitting || hasReviewed}
        className={className}
      >
        {hasReviewed ? (
          <>
            <CheckCircle className="h-3.5 w-3.5 mr-2 text-green-600" />
            Reviewed
          </>
        ) : (
          <>
            <MessageSquare className="h-3.5 w-3.5" />
            Leave Review
          </>
        )}
      </Button>
    </>
  );
}
