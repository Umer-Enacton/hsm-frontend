"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api, API_ENDPOINTS } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ReviewReplyDialogProps {
  reviewId: number;
  existingReply?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReplyAdded?: () => void;
}

export function ReviewReplyDialog({
  reviewId,
  existingReply = "",
  open,
  onOpenChange,
  onReplyAdded,
}: ReviewReplyDialogProps) {
  const safeReply = existingReply || "";
  const [reply, setReply] = useState(safeReply);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [charCount, setCharCount] = useState(safeReply.length);
  const maxLength = 1000;

  const handleSubmit = async () => {
    const replyText = reply || "";
    if (!replyText.trim()) {
      toast.error("Please enter a reply");
      return;
    }

    if (replyText.length > maxLength) {
      toast.error(`Reply must be ${maxLength} characters or less`);
      return;
    }

    try {
      setIsSubmitting(true);
      await api.put<{ message: string; feedback: unknown }>(
        API_ENDPOINTS.ADD_PROVIDER_REPLY(reviewId),
        { reply: replyText.trim() }
      );
      toast.success(existingReply ? "Reply updated successfully" : "Reply added successfully");
      setReply("");
      onReplyAdded?.();
    } catch (error) {
      console.error("Error adding reply:", error);
      toast.error("Failed to submit reply");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isSubmitting) {
      setReply(existingReply || "");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-blue-600" />
            {existingReply ? "Edit Your Reply" : "Reply to Review"}
          </DialogTitle>
          <DialogDescription>
            {existingReply
              ? "Update your response to this customer review"
              : "Respond to this customer review. Your reply will be visible to all customers."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="reply" className="text-sm font-medium">
              Your Reply
            </label>
            <Textarea
              id="reply"
              placeholder="Thank you for your feedback! We're glad you had a great experience..."
              value={reply || ""}
              onChange={(e) => {
                setReply(e.target.value);
                setCharCount(e.target.value.length);
              }}
              maxLength={maxLength}
              rows={5}
              className="resize-none"
              autoFocus
            />
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Be professional and courteous in your response
              </span>
              <span className={cn(
                "tabular-nums",
                charCount > maxLength * 0.9 ? "text-amber-600" : "text-muted-foreground"
              )}>
                {charCount}/{maxLength}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !(reply || "").trim()}
            className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {existingReply ? "Update Reply" : "Submit Reply"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
