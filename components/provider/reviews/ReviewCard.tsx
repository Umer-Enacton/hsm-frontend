"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Star,
  Calendar,
  User,
  MessageSquare,
  Eye,
  EyeOff,
  Trash2,
  Reply,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ReviewReplyDialog } from "./ReviewReplyDialog";
import { api, API_ENDPOINTS } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface ReviewData {
  id: number;
  bookingId: number;
  rating: number;
  comments?: string;
  createdAt: string;
  customerId: number;
  customer: {
    name: string;
    avatar?: string;
  };
  serviceId: number;
  isVisible: boolean;
  providerReply?: string;
  repliedAt?: string;
}

interface ReviewCardProps {
  review: ReviewData;
  serviceName?: string;
}

export function ReviewCard({ review, serviceName }: ReviewCardProps) {
  const queryClient = useQueryClient();
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFullComment, setShowFullComment] = useState(false);

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
        className={cn(
          "h-4 w-4 transition-colors",
          i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300",
        )}
      />
    ));
  };

  const handleToggleVisibility = async () => {
    try {
      setIsToggling(true);
      await api.put<{ message: string; feedback: ReviewData }>(
        API_ENDPOINTS.TOGGLE_REVIEW_VISIBILITY(review.id),
        {},
      );
      toast.success(
        review.isVisible
          ? "Review hidden from customers"
          : "Review is now visible",
      );
      queryClient.invalidateQueries({ queryKey: ["provider", "reviews"] });
    } catch (error) {
      console.error("Error toggling visibility:", error);
      toast.error("Failed to update review visibility");
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await api.delete<{ message: string }>(
        API_ENDPOINTS.DELETE_REVIEW(review.id),
      );
      toast.success("Review deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["provider", "reviews"] });
    } catch (error) {
      console.error("Error deleting review:", error);
      toast.error("Failed to delete review");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReplySubmit = () => {
    setShowReplyDialog(false);
    queryClient.invalidateQueries({ queryKey: ["provider", "reviews"] });
  };

  const comments = review.comments || "";
  const shouldTruncate = comments.length > 200;
  const displayComments =
    showFullComment || !shouldTruncate
      ? comments
      : comments.slice(0, 200) + "...";

  return (
    <>
      <Card
        className={cn(
          "p-5 transition-all duration-300 hover:shadow-lg",
          !review.isVisible &&
            "border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20",
        )}
      >
        {/* Hidden badge */}
        {!review.isVisible && (
          <div className="mb-3">
            <Badge
              variant="outline"
              className="bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700"
            >
              <EyeOff className="h-3 w-3 mr-1" />
              Hidden from customers
            </Badge>
          </div>
        )}

        {/* Header: Rating + Actions */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex">{renderStars(review.rating)}</div>
              <Badge variant="outline" className="text-xs font-semibold">
                {review.rating}/5
              </Badge>
              {serviceName && (
                <Badge variant="secondary" className="text-xs">
                  {serviceName}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                <span className="font-medium">{review.customer.name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>{formatDate(review.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleVisibility}
              disabled={isToggling}
              className={cn(
                "gap-1.5",
                review.isVisible
                  ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                  : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50",
              )}
              title={
                review.isVisible ? "Hide from customers" : "Show to customers"
              }
            >
              {isToggling ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : review.isVisible ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReplyDialog(true)}
              className="gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              title={review.providerReply ? "Edit reply" : "Add reply"}
            >
              <Reply className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50"
              title="Delete review"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Customer Comments */}
        {comments && (
          <div className="mt-4 p-3 bg-muted/50 rounded-md">
            <div className="flex items-start gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {displayComments}
                </p>
                {shouldTruncate && (
                  <button
                    onClick={() => setShowFullComment(!showFullComment)}
                    className="text-xs text-blue-600 hover:text-blue-700 mt-1 font-medium"
                  >
                    {showFullComment ? (
                      <span className="flex items-center gap-0.5">
                        Show less <ChevronUp className="h-3 w-3" />
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5">
                        Show more <ChevronDown className="h-3 w-3" />
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Provider Reply */}
        {review.providerReply && (
          <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-md border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <Reply className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                    Your Reply
                  </span>
                  {review.repliedAt && (
                    <span className="text-xs text-muted-foreground">
                      {formatDate(review.repliedAt)}
                    </span>
                  )}
                </div>
                <p className="text-sm leading-relaxed text-blue-900 dark:text-blue-100 whitespace-pre-wrap break-words">
                  {review.providerReply}
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Reply Dialog */}
      <ReviewReplyDialog
        reviewId={review.id}
        existingReply={review.providerReply}
        open={showReplyDialog}
        onOpenChange={setShowReplyDialog}
        onReplyAdded={handleReplySubmit}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this review?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The review will be permanently
              removed from your records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete Review"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
