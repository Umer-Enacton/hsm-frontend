"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Calendar, MapPin, Clock, Phone, User, Star, X, ChevronLeft, ImageIcon, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getBookingById, cancelBooking } from "@/lib/customer/api";
import { getServiceById } from "@/lib/customer/api";
import { getAddresses } from "@/lib/customer/api";
import { getAvailableSlots } from "@/lib/customer/api";
import { api, API_ENDPOINTS } from "@/lib/api";
import type { CustomerBooking } from "@/types/customer";
import type { ServiceDetails } from "@/types/customer";
import type { Slot } from "@/types/customer";
import type { Address } from "@/types/customer";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function BookingDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [booking, setBooking] = useState<CustomerBooking | null>(null);
  const [service, setService] = useState<ServiceDetails | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [address, setAddress] = useState<Address | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Review modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comments, setComments] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  useEffect(() => {
    loadBookingDetails();
  }, [id]);

  // Check if review already submitted
  useEffect(() => {
    if (booking?.status === "completed") {
      const reviewed = sessionStorage.getItem(`review-${booking.id}`);
      setHasReviewed(!!reviewed);
      // Only auto-open modal if not yet reviewed
      if (!reviewed) {
        setReviewModalOpen(true);
      }
    }
  }, [booking]);

  const loadBookingDetails = async () => {
    try {
      setIsLoading(true);
      setIsLoadingDetails(true);

      const bookingData = await getBookingById(parseInt(id));
      setBooking(bookingData);

      // Fetch related data in parallel
      try {
        const [serviceData, slots, addressesResult] = await Promise.all([
          getServiceById(bookingData.serviceId),
          getAvailableSlots(bookingData.businessProfileId),
          getAddresses()
        ]);

        setService(serviceData);

        // Find matching slot
        const slotData = slots.find(s => s.id === bookingData.slotId);
        if (slotData) setSlot(slotData);

        // Find matching address
        const addresses = Array.isArray(addressesResult) ? addressesResult : [];
        const addressData = addresses.find(a => a.id === bookingData.addressId);
        if (addressData) setAddress(addressData);

      } catch (error) {
        console.error("Error loading booking related data:", error);
        toast.error("Some details could not be loaded");
      }
    } catch (error: any) {
      console.error("Error loading booking:", error);
      toast.error("Failed to load booking details");
      router.push("/customer/bookings");
    } finally {
      setIsLoading(false);
      setIsLoadingDetails(false);
    }
  };

  const handleCancel = async () => {
    if (!booking) return;

    if (!confirm("Are you sure you want to cancel this booking?")) return;

    try {
      setCancelling(true);
      await cancelBooking(booking.id, "Customer cancelled");
      toast.success("Booking cancelled successfully");
      await loadBookingDetails();
    } catch (error: any) {
      console.error("Error cancelling booking:", error);
      toast.error(error.message || "Failed to cancel booking");
    } finally {
      setCancelling(false);
    }
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    if (!booking) return;

    try {
      setSubmittingReview(true);

      await api.post<{ message: string }>(
        API_ENDPOINTS.ADD_FEEDBACK,
        {
          bookingId: booking.id,
          serviceId: booking.serviceId,
          rating,
          comments: comments.trim() || undefined,
        }
      );

      toast.success("Review submitted successfully!");
      sessionStorage.setItem(`review-${booking.id}`, "true");
      setHasReviewed(true);
      setReviewModalOpen(false);

      // Reset form
      setRating(0);
      setHoveredRating(0);
      setComments("");
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast.error(error.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStatusBadge = (status?: string) => {
    const variants: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
      confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      completed: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    };

    const icons: Record<string, React.ReactNode> = {
      pending: <Clock className="h-4 w-4" />,
      confirmed: <CheckCircle className="h-4 w-4" />,
      completed: <CheckCircle className="h-4 w-4" />,
      cancelled: <XCircle className="h-4 w-4" />,
    };

    if (!status) {
      return {
        className: variants.pending,
        icon: icons.pending,
        label: "Unknown",
      };
    }

    return {
      className: variants[status] || variants.pending,
      icon: icons[status] || icons.pending,
      label: status.charAt(0).toUpperCase() + status.slice(1),
    };
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${period}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTimelineItems = () => {
    if (!booking) return [];

    const items = [
      {
        label: "Booking Created",
        description: "Your booking was successfully created",
        completed: true,
        icon: Calendar,
      },
      {
        label: "Provider Confirmed",
        description: booking.status === "pending" ? "Waiting for provider confirmation" : "Provider has confirmed your booking",
        completed: booking.status !== "pending",
        icon: CheckCircle,
      },
      {
        label: "Service Completed",
        description: booking.status === "completed" ? "Service has been completed" : "Service not yet completed",
        completed: booking.status === "completed",
        icon: CheckCircle,
      },
    ];

    return items;
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold mb-4">Booking not found</p>
          <Link href="/customer/bookings">
            <Button>View All Bookings</Button>
          </Link>
        </div>
      </div>
    );
  }

  const statusBadge = getStatusBadge(booking.status);
  const timelineItems = getTimelineItems();

  return (
    <div className="space-y-6">
      {/* Review Modal */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Rate Your Experience</DialogTitle>
            <DialogDescription>
              How was your experience with {service?.name || "this service"}?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Star Rating */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      "h-8 w-8 cursor-pointer transition-all duration-200",
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400 scale-110"
                        : "text-gray-300 hover:text-yellow-400"
                    )}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {rating === 0 ? "Select a rating" :
                 rating === 1 ? "Poor" :
                 rating === 2 ? "Fair" :
                 rating === 3 ? "Good" :
                 rating === 4 ? "Very Good" : "Excellent"}
              </p>
            </div>

            {/* Comments */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Comments (Optional)</label>
              <Textarea
                placeholder="Share your experience with this service..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
                className="resize-none"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {comments.length}/500
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setReviewModalOpen(false);
                  sessionStorage.setItem(`review-${booking.id}`, "true");
                }}
                className="flex-1"
              >
                Skip
              </Button>
              <Button
                onClick={handleSubmitReview}
                disabled={rating === 0 || submittingReview}
                className="flex-1"
              >
                {submittingReview ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Review"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Back Button */}
      <Link href="/customer/bookings">
        <Button variant="ghost" className="gap-2 hover:bg-transparent px-0">
          <ChevronLeft className="h-4 w-4" />
          Back to My Bookings
        </Button>
      </Link>

      {/* Hero Section with Image */}
      <Card className="overflow-hidden border-2">
        <div className="flex flex-col md:flex-row">
          {/* Service Image */}
          <div className="relative w-full md:w-80 h-64 md:h-auto flex-shrink-0 bg-muted">
            {service?.image ? (
              <img
                src={service.image}
                alt={service.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                <ImageIcon className="h-16 w-16 text-primary/20" />
              </div>
            )}
            <div className="absolute top-4 right-4">
              <Badge className={cn(statusBadge.className, "text-sm px-3 py-1")}>
                <span className="flex items-center gap-1.5">
                  {statusBadge.icon}
                  {statusBadge.label}
                </span>
              </Badge>
            </div>
          </div>

          {/* Hero Content */}
          <div className="flex-1 p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <span>Booking #{booking.id}</span>
                  <Separator orientation="vertical" className="h-4" />
                  <span className="text-primary">{statusBadge.label}</span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">
                  {service?.name || "Service Details"}
                </h1>
                <p className="text-lg text-muted-foreground">
                  {service?.provider?.businessName || "Provider Business"}
                </p>
              </div>
            </div>

            {/* Quick Info */}
            <div className="grid sm:grid-cols-3 gap-6">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Date</p>
                <p className="text-lg font-semibold">{formatDate(booking.bookingDate)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Time</p>
                <p className="text-lg font-semibold">
                  {slot ? formatTime(slot.startTime) : "Loading..."}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Duration</p>
                <p className="text-lg font-semibold">{service?.estimateDuration || 0} mins</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Service Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                Booking Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Separator />
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Service</p>
                  <p className="font-semibold text-lg">{service?.name || "Loading..."}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Provider</p>
                  <p className="font-semibold text-lg">{service?.provider?.businessName || "Loading..."}</p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground mb-1">Service Address</p>
                {address ? (
                  <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
                    <div className="rounded-full bg-primary/10 p-2.5">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{address.street}</p>
                      <p className="text-sm text-muted-foreground">
                        {address.city}, {address.state} {address.zipCode}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Loading address...</p>
                )}
              </div>

              <Separator />

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-3xl font-bold">₹{booking.totalPrice}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Payment Status</p>
                  <p className="text-sm font-medium text-green-600">Paid at Booking</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-muted-foreground" />
                Booking Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {timelineItems.map((item, index) => (
                  <div key={index} className="flex gap-4 pb-8 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "rounded-full p-3 transition-all duration-300",
                        item.completed
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}>
                        <item.icon className="h-5 w-5" />
                      </div>
                      {index < timelineItems.length - 1 && (
                        <div className={cn(
                          "w-0.5 flex-1 my-2 transition-colors duration-300",
                          item.completed ? "bg-primary" : "bg-muted"
                        )} style={{ minHeight: "32px" }} />
                      )}
                    </div>
                    <div className="flex-1 pt-2">
                      <p className={cn(
                        "font-semibold mb-1",
                        item.completed ? "" : "text-muted-foreground"
                      )}>
                        {item.label}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Provider Info */}
          <Card>
            <CardHeader>
              <CardTitle>Provider</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {service?.provider ? (
                <>
                  <div>
                    <p className="font-semibold text-lg">{service.provider.businessName}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{Number(service.rating || 0).toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">({service.totalReviews || 0} reviews)</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span>{service.provider.city}, {service.provider.state}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <span>{service.provider.phone}</span>
                    </div>
                  </div>

                  <Link href={`/customer/services/${service.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      View Provider
                    </Button>
                  </Link>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Loading provider info...</p>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {booking.status === "pending" && (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleCancel}
                  disabled={cancelling}
                >
                  {cancelling ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Cancel Booking
                    </>
                  )}
                </Button>
              )}

              {booking.status === "completed" && (
                hasReviewed ? (
                  <Button variant="outline" className="w-full" disabled>
                    <Star className="h-4 w-4 mr-2 fill-yellow-400 text-yellow-400" />
                    Review Submitted
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => setReviewModalOpen(true)}
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Leave a Review
                  </Button>
                )
              )}

              <Link href="/customer/bookings">
                <Button variant="outline" className="w-full">
                  Back to List
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Help */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Contact our support team for any issues with your booking
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
