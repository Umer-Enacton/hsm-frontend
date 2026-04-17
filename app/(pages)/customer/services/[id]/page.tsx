"use client";

import { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Loader2,
  Star,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Building2,
  Calendar as CalendarIcon,
  Phone,
  X,
  MessageSquare,
  IndianRupee,
  Users,
  Award,
  ShoppingCart,
  User as UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { getAvailableSlots } from "@/lib/customer/api";
import {
  useCustomerService,
  useAddresses,
  useBusinessSlots,
  useServiceFeedback,
} from "@/lib/queries";
import { QUERY_KEYS } from "@/lib/queries/query-keys";
import type { ServiceDetails, Slot, Address } from "@/types/customer";
import type {
  PaymentOrderRequest,
  PaymentOrderResponse,
} from "@/types/payment";
import { ServiceDetailSkeleton } from "@/components/customer/skeletons/ServiceDetailSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { api, API_ENDPOINTS } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateAfterBookingAction } from "@/lib/queries/query-invalidation";
import { useRazorpayScript } from "@/components/customer/payment/RazorpayCheckout";
import { useTheme } from "next-themes";
import { Calendar } from "@/components/ui/calendar";

interface Feedback {
  id: number;
  rating: number;
  comments: string;
  createdAt: string;
  customer?: {
    name: string;
    avatar?: string;
  };
  userId?: number;
  user?: {
    name?: string;
    avatar?: string;
    profile_image?: string;
  };
}

export default function ServiceDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const scriptLoaded = useRazorpayScript();

  // Use cached hooks for data fetching
  const {
    data: service,
    isLoading: isLoadingService,
    error: serviceError,
  } = useCustomerService(parseInt(id));

  const { data: addresses = [], isLoading: isLoadingAddresses } =
    useAddresses();

  const { data: feedbacks = [], isLoading: isLoadingFeedback } =
    useServiceFeedback(parseInt(id), 10);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(),
  );
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  // Local state for slots (like RescheduleButton)
  const [allSlots, setAllSlots] = useState<Slot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Carousel state
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const autoScrollPausedRef = useRef(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [reviewsPerView, setReviewsPerView] = useState(3);

  // Initial fetch when service loads
  useEffect(() => {
    if (service?.provider?.id && selectedDate) {
      fetchSlotsForDate(selectedDate);
    }
  }, [service?.provider?.id]);

  // Handlers
  const handleDateChange = (date: Date | undefined) => {
    if (!date) return;
    
    // Create date in local timezone to avoid UTC issues
    const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    console.log(`📅 Date selected: ${localDate.toDateString()}`);
    
    setSelectedDate(localDate);
    setSelectedSlot(null);
    
    // Fetch slots immediately for selected date
    fetchSlotsForDate(localDate);
  };

  const fetchSlotsForDate = async (date: Date) => {
    if (!service?.provider?.id) return;
    
    try {
      setIsLoadingSlots(true);
      // Use local date string to avoid timezone issues
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      console.log(`🔄 Fetching slots for: ${dateStr} (input: ${date.toISOString()})`);
      
      const params = new URLSearchParams();
      params.append("date", dateStr);
      params.append("serviceId", service.id.toString());
      
      const response = await api.get<{ slots: Slot[] }>(
        `${API_ENDPOINTS.SLOTS_PUBLIC(service.provider.id)}?${params.toString()}`
      );
      
      const slotsArray = response.slots || [];
      setAllSlots(slotsArray.map(slot => ({
        ...slot,
        isAvailable: slot.isAvailable ?? true,
        status: slot.status ?? "available"
      })));
      console.log(`✅ Loaded ${slotsArray.length} slots for ${dateStr}`);
    } catch (error) {
      console.error("Error loading slots:", error);
      setAllSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleMouseEnter = () => {
    autoScrollPausedRef.current = true;
  };

  const handleMouseLeave = () => {
    autoScrollPausedRef.current = false;
  };

  const handlePreviousReview = () => {
    setCurrentReviewIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNextReview = () => {
    setCurrentReviewIndex((prev) => Math.min(feedbacks.length - reviewsPerView, prev + 1));
  };

  const handleSlotSelect = (slot: Slot) => {
    setSelectedSlot(slot);
  };

  const handleBookNow = async () => {
    if (!service || !selectedDate || !selectedSlot || !selectedAddress) {
      toast.error("Please complete all selections");
      return;
    }

    // Check availability and create payment order BEFORE showing modal
    setIsCheckingAvailability(true);

    try {
      const bookingData: PaymentOrderRequest = {
        serviceId: service.id,
        slotId: selectedSlot.id,
        addressId: selectedAddress.id,
        bookingDate: new Date(selectedDate).toISOString(),
      };

      console.log(
        "🔍 Checking slot availability and creating payment order...",
      );

      // Try to create payment order (this checks slot availability)
      const response = await api.post<PaymentOrderResponse>(
        API_ENDPOINTS.PAYMENT.CREATE_ORDER,
        bookingData,
      );

      console.log(
        "✅ Slot available! Payment order created:",
        response.paymentIntentId,
      );

      // Invalidate slots cache - will refresh when user navigates away or on next visit
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.SLOTS],
      });

      // Verify Razorpay is loaded
      if (
        !scriptLoaded ||
        typeof window === "undefined" ||
        !(window as any).Razorpay
      ) {
        toast.error(
          "Payment gateway is loading. Please wait a moment and try again.",
        );
        setIsCheckingAvailability(false);
        return;
      }

      const isDark = theme === "dark";

      const options = {
        key: response.keyId,
        amount: response.amount,
        currency: response.currency,
        name: "Home Service Management",
        description: `Payment for ${service.name}`,
        order_id: response.razorpayOrderId,
        prefill: {
          name: "",
          email: "",
          contact: "",
        },
        notes: {
          payment_intent_id: response.paymentIntentId.toString(),
          service_name: service.name,
        },
        timeout: 90, // Enforce 90-second expiration directly in Razorpay SDK
        theme: {
          color: isDark ? "#334155" : "#000000",
        },
        modal: {
          ondismiss: async () => {
            console.log(
              "ℹ️ Razorpay modal closed by user - cancelling payment intent",
            );
            setIsCheckingAvailability(false);
            try {
              await api.post(API_ENDPOINTS.PAYMENT.CANCEL_INTENT, {
                paymentIntentId: response.paymentIntentId,
              });
              // Invalidate slots cache - lock released
              queryClient.invalidateQueries({
                queryKey: [QUERY_KEYS.SLOTS],
              });
            } catch (err) {
              console.warn("⚠️ Failed to cancel payment intent:", err);
            }
          },
          escape: true,
          backdropclose: false,
        },
      };

      const rzp = new (window as any).Razorpay(options);

      rzp.on("payment.success", async function (rzpResponse: any) {
        console.log("✅ Razorpay payment.success event");
        try {
          const razorpayPaymentId =
            rzpResponse.payload?.payment?.id ||
            rzpResponse.payload?.payment?.razorpay_payment_id ||
            rzpResponse.razorpay_payment_id;

          const razorpayOrderId = response.razorpayOrderId;

          const razorpaySignature =
            rzpResponse.payload?.payment?.razorpay_signature ||
            rzpResponse.razorpay_signature ||
            rzpResponse.signature ||
            "";

          // Verify Payment backend
          await api.post(API_ENDPOINTS.PAYMENT.VERIFY, {
            razorpayOrderId,
            razorpayPaymentId,
            signature: razorpaySignature,
            paymentIntentId: response.paymentIntentId,
          });

          invalidateAfterBookingAction(queryClient);

          toast.success("Payment successful! Your booking is confirmed.");
          setIsCheckingAvailability(false);
          router.push("/customer/bookings");
        } catch (err: any) {
          console.error("❌ Error verifying payment:", err);
          toast.error(err.message || "Payment verification failed");
          setIsCheckingAvailability(false);
        }
      });

      rzp.on("payment.failed", async function (error: any) {
        console.error("❌ Razorpay payment.failed event:", error);

        let errorCode, errorDescription;
        if (error.payload && error.payload.error) {
          errorCode = error.payload.error.code;
          errorDescription = error.payload.error.description;
        } else if (error.error) {
          errorCode = error.error.code;
          errorDescription =
            error.error.description || error.error.metadata?.reason;
        } else {
          errorDescription =
            error.description || error.reason || "Payment failed";
        }

        try {
          await api.post(API_ENDPOINTS.PAYMENT.FAILED, {
            paymentIntentId: response.paymentIntentId,
            errorCode,
            errorDescription,
          });
        } catch (recordError) {
          console.error("Error recording failed payment:", recordError);
        }

        toast.error(errorDescription || "Payment failed. Please try again.");
        setIsCheckingAvailability(false);
      });

      rzp.open();
    } catch (err: any) {
      setIsCheckingAvailability(false);
      console.error("❌ Slot availability check failed:", err);

      // Extract error details from enhanced error object
      const errorCode = err.code || err.cause?.code || err.statusCode;
      const errorMessage = err.message || err.cause?.message || "";
      const isRetryable = err.retryable || err.cause?.retryable;

      console.log("📊 Error details:", {
        errorCode,
        errorMessage,
        isRetryable,
        statusCode: err.statusCode,
      });

      // Handle specific error cases with human-friendly messages
      if (
        errorCode === "SLOT_LOCKED" ||
        isRetryable === true ||
        err.statusCode === 409
      ) {
        toast.error(
          "Another customer is currently booking this slot. Please wait a moment or choose a different slot.",
        );
      } else if (errorCode === "SLOT_ALREADY_BOOKED") {
        toast.error(
          "This slot has already been booked. Please select a different time.",
        );
      } else if (errorCode === "RAZORPAY_ERROR") {
        toast.error(
          "Payment gateway is temporarily unavailable. Please try again.",
        );
      } else {
        toast.error(
          errorMessage || "Failed to initiate booking. Please try again.",
        );
      }
    }
  };

  // Helper functions
  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, "0");
    return `${displayHours}:${displayMinutes} ${period}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  const showSkeleton = isLoadingService;

  // Handle error
  if (serviceError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">
            Failed to load service details
          </p>
          <Button onClick={() => router.push("/customer/services")}>
            Back to Services
          </Button>
        </div>
      </div>
    );
  }

  // Set default date to today if not set
  useEffect(() => {
    if (!selectedDate) {
      const today = new Date();
      setSelectedDate(today);
      fetchSlotsForDate(today);
    }
  }, []);

  // Check if all selections are complete
  const canBook = service && selectedDate && selectedSlot && selectedAddress;

  // Error state
  if (!isLoadingService && !service) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Service Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The service you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/customer/services">
            <Button>Browse Services</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <Link href="/customer/services">
              <Button variant="ghost" size="sm" className="gap-2">
                <ChevronLeft className="h-4 w-4" />
                Back to Services
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {showSkeleton ? (
          <ServiceDetailSkeleton />
        ) : (
          service && (
            <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
              {/* LEFT COLUMN - Service Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Hero Banner Section - Image with Info Overlay */}
                <section>
                  <div className="relative w-full aspect-[21/9] rounded-md overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background border">
                    {service.image ? (
                      <Image
                        src={service.image}
                        alt={service.name}
                        fill
                        className="object-cover"
                        priority
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="h-24 w-24 text-primary/20" />
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                    {/* Info Overlay on Image */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                      <div className="space-y-4">
                        {/* Title Row */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 flex-wrap mb-2">
                              <h1 className="text-3xl sm:text-4xl font-bold text-white">
                                {service.name}
                              </h1>
                              {service.provider?.isVerified && (
                                <Badge className="bg-green-500 text-white border-green-400 gap-1.5">
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  Verified
                                </Badge>
                              )}
                            </div>
                            <p className="text-lg text-white/90">
                              by {service.provider?.businessName}
                            </p>
                          </div>

                          {/* Price */}
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-white">
                              <IndianRupee className="h-6 w-6" />
                              <span className="text-3xl font-bold">
                                {service.price}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Meta Info Row */}
                        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-white/90 text-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{service.estimateDuration} minutes</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-semibold">
                              {Number(service.rating || 0).toFixed(1)}
                            </span>
                            <span className="text-white/80">
                              ({service.totalReviews || 0} reviews)
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>
                              {service.provider?.city},{" "}
                              {service.provider?.state}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* About Service Section */}
                <section>
                  <Card className="gap-0">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-primary" />
                        <CardTitle>About This Service</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <p className="text-muted-foreground leading-relaxed">
                          {service.description ||
                            "No description available for this service."}
                        </p>
                      </div>

                      {/* Service Features Grid */}
                      <div className="grid sm:grid-cols-2 gap-4 mt-3 pt-6 border-t">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                            <Clock className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Duration</p>
                            <p className="text-sm text-muted-foreground">
                              {service.estimateDuration} minutes
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                            <Star className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Rating</p>
                            <p className="text-sm text-muted-foreground">
                              {Number(service.rating || 0).toFixed(1)} / 5.0
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Total Reviews</p>
                            <p className="text-sm text-muted-foreground">
                              {service.totalReviews || 0} reviews
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                            <MapPin className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Service Area</p>
                            <p className="text-sm text-muted-foreground">
                              {service.provider?.city},{" "}
                              {service.provider?.state}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </section>

                {/* Customer Reviews Section - Auto-Scrolling Carousel */}
                <section>
                  <Card className="gap-0">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-5 w-5" />
                          <CardTitle>Customer Reviews</CardTitle>
                        </div>
                        <Badge variant="outline">
                          {feedbacks.length} reviews
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      {isLoadingFeedback ? (
                        <div className="text-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-3" />
                          <p className="text-sm text-muted-foreground">
                            Loading reviews...
                          </p>
                        </div>
                      ) : feedbacks.length === 0 ? (
                        <div className="text-center py-12">
                          <Star className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                          <p className="text-muted-foreground">
                            No reviews yet
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Be the first to review this service
                          </p>
                        </div>
                      ) : (
                        <div className="relative">
                          {/* Reviews Carousel */}
                          <div
                            className="overflow-hidden"
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                          >
                            <div
                              ref={carouselRef}
                              className="flex gap-4 transition-transform duration-500 ease-in-out"
                              style={{
                                transform: `translateX(-${currentReviewIndex * (100 / reviewsPerView)}%)`,
                              }}
                            >
                              {feedbacks.map((feedback: any) => {
                                const customerName =
                                  feedback.customer?.name ||
                                  feedback.user?.name ||
                                  "Customer";

                                const customerAvatar =
                                  feedback.customer?.avatar ||
                                  feedback.user?.avatar ||
                                  feedback.user?.profile_image ||
                                  null;

                                return (
                                  <div
                                    key={feedback.id}
                                    className="flex-shrink-0 w-full px-2"
                                    style={{
                                      width: `${100 / reviewsPerView}%`,
                                    }}
                                  >
                                    <Card className="p-5 h-full border border-border/50 hover:border-primary/50 transition-colors relative">
                                      {/* Quote Icon */}
                                      <div className="absolute top-4 right-4 text-primary/10">
                                        <svg
                                          className="w-8 h-8"
                                          fill="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                                        </svg>
                                      </div>

                                      {/* Rating Stars */}
                                      <div className="flex items-center gap-0.5 mb-3">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <Star
                                            key={star}
                                            className={cn(
                                              "h-4 w-4",
                                              star <= feedback.rating
                                                ? "fill-yellow-400 text-yellow-400"
                                                : "text-gray-300 dark:text-gray-600",
                                            )}
                                          />
                                        ))}
                                        <span className="ml-2 text-sm font-medium text-muted-foreground">
                                          {feedback.rating}/5
                                        </span>
                                      </div>

                                      {/* Review Text */}
                                      {feedback.comments && (
                                        <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-4">
                                          "{feedback.comments}"
                                        </p>
                                      )}

                                      {/* Customer Info with Avatar */}
                                      <div className="pt-3 border-t">
                                        <div className="flex items-center gap-3">
                                          {/* Avatar */}
                                          {customerAvatar ? (
                                            <Image
                                              src={customerAvatar}
                                              alt={customerName}
                                              width={40}
                                              height={40}
                                              className="h-10 w-10 rounded-full object-cover border-2 border-primary/20"
                                              onError={(e) => {
                                                e.currentTarget.style.display =
                                                  "none";
                                                const fallback = e.currentTarget
                                                  .nextElementSibling as HTMLElement;
                                                if (fallback)
                                                  fallback.style.display =
                                                    "flex";
                                              }}
                                              unoptimized={
                                                !customerAvatar.includes(
                                                  "cloudinary",
                                                )
                                              }
                                            />
                                          ) : null}
                                          <div
                                            className={cn(
                                              "h-10 w-10 rounded-full bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center border-2 border-primary/20",
                                              !customerAvatar
                                                ? "flex"
                                                : "hidden",
                                            )}
                                          >
                                            <UserIcon className="h-5 w-5 text-primary" />
                                          </div>

                                          {/* Name & Date */}
                                          <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm text-foreground truncate">
                                              {customerName}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                              {new Date(
                                                feedback.createdAt,
                                              ).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                              })}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    </Card>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Navigation Arrows */}
                          {feedbacks.length > reviewsPerView && (
                            <>
                              <button
                                onClick={handlePreviousReview}
                                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background border shadow-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={currentReviewIndex === 0}
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </button>
                              <button
                                onClick={handleNextReview}
                                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background border shadow-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={
                                  currentReviewIndex >=
                                  feedbacks.length - reviewsPerView
                                }
                              >
                                <ChevronRight className="h-4 w-4" />
                              </button>
                            </>
                          )}

                          {/* Dot Indicators */}
                          {feedbacks.length > reviewsPerView && (
                            <div className="flex items-center justify-center gap-2 mt-6">
                              {Array.from({
                                length: Math.ceil(
                                  feedbacks.length / reviewsPerView,
                                ),
                              }).map((_, idx) => (
                                <button
                                  key={idx}
                                  onClick={() =>
                                    setCurrentReviewIndex(idx * reviewsPerView)
                                  }
                                  className={`h-2 rounded-full transition-all ${
                                    Math.floor(
                                      currentReviewIndex / reviewsPerView,
                                    ) === idx
                                      ? "bg-primary w-8"
                                      : "bg-muted w-2 hover:bg-muted-foreground/30"
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </section>
              </div>

              {/* RIGHT COLUMN - Sticky Booking Card */}
              <div className="lg:col-span-1">
                <div className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
                  <Card className="">
                    <CardHeader>
                      <CardTitle className="text-xl">
                        Book This Service
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Select your preferred date, time, and address
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-0">
                      {/* Date Selection */}
                      <div className="p-1 pb-4 pt-6">
                        <h3 className="text-sm font-semibold mb-4">
                          Select Date
                        </h3>
                        <Popover
                          open={calendarOpen}
                          onOpenChange={setCalendarOpen}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !selectedDate && "text-muted-foreground",
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {selectedDate
                                ? selectedDate.toLocaleDateString("en-IN", {
                                    weekday: "short",
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={selectedDate}
                              onSelect={(date) => {
                                handleDateChange(date);
                                setCalendarOpen(false);
                              }}
                              disabled={(date) => {
                                // Disable dates before today
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                if (date < today) return true;
                                
                                // For today's date, also check if all slots have passed
                                if (date.toDateString() === today.toDateString()) {
                                  const now = new Date();
                                  const currentHour = now.getHours();
                                  const currentMinutes = now.getMinutes();
                                  // If current time is after 5:30 PM (17:00), disable today
                                  if (currentHour >= 17) return true;
                                }
                                return false;
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <Separator />

                      {/* Time Selection */}
                      <div className="p-1 pb-4 pt-6">
                        <h3 className="text-sm font-semibold mb-4">
                          Select Time
                        </h3>
                        <div className="mb-3">
                          <p className="text-xs text-muted-foreground">
                            {selectedDate
                              ? formatDate(selectedDate.toISOString())
                              : "Select a date first"}
                          </p>
                        </div>

                        {/* Slot Availability Legend */}
                        {selectedDate && (
                          <div className="mb-3 p-2 bg-muted/30 rounded-md">
                            <div className="flex items-center gap-4 text-xs flex-wrap">
                              <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded bg-green-100 border-2 border-green-500"></div>
                                <span className="text-muted-foreground">
                                  Available
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded bg-black"></div>
                                <span className="text-muted-foreground">
                                  Selected
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded bg-gray-200 border-2 border-gray-300"></div>
                                <span className="text-muted-foreground">
                                  Booked
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {(() => {
                          // Use allSlots directly - it's already filtered by date
                          const availableSlots = allSlots;

                          if (!selectedDate) {
                            return (
                              <div className="text-center py-8 bg-muted/50 rounded-md">
                                <CalendarIcon className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                                <p className="text-sm text-muted-foreground">
                                  Select a date to see available times
                                </p>
                              </div>
                            );
                          }

                          if (isLoadingSlots) {
                            return (
                              <div className="grid grid-cols-3 gap-2">
                                {Array.from({ length: 12 }).map((_, i) => (
                                  <Skeleton
                                    key={i}
                                    className="h-9 rounded-md"
                                  />
                                ))}
                              </div>
                            );
                          }

                          if (availableSlots.length === 0) {
                            return (
                              <div className="text-center py-8 bg-muted/50 rounded-md">
                                <X className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                                <p className="text-sm text-muted-foreground">
                                  No time slots available for this date
                                </p>
                              </div>
                            );
                          }

                          return (
                            <div className="grid grid-cols-3 sm:grid-cols-3 gap-2">
                              {availableSlots.map((slot) => {
                                const isBooked = slot.isAvailable === false;
                                const isPast = slot.status === "past";
                                const isDisabled = isBooked || isPast;
                                const isSelected = selectedSlot?.id === slot.id;

                                return (
                                  <button
                                    key={slot.id}
                                    onClick={() =>
                                      !isDisabled && handleSlotSelect(slot)
                                    }
                                    disabled={isDisabled}
                                    className={`px-3 py-2 rounded-md border text-sm font-medium transition-all ${
                                      isSelected
                                        ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white"
                                        : isBooked
                                          ? "bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 border-gray-300 dark:border-gray-700 cursor-not-allowed opacity-60"
                                          : isPast
                                            ? "bg-red-100 dark:bg-red-950 text-red-400 dark:text-red-600 border-red-500 dark:border-red-700 cursor-not-allowed opacity-50"
                                            : "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 border-green-500 dark:border-green-700 hover:bg-green-200 dark:hover:bg-green-900 hover:border-green-600 dark:hover:border-green-600"
                                    }`}
                                    title={
                                      isBooked
                                        ? "This slot is already booked"
                                        : isPast
                                          ? "This slot has passed"
                                          : "Available for booking"
                                    }
                                  >
                                    {formatTime(slot.startTime)}
                                  </button>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>

                      <Separator />

                      {/* Address Selection */}
                      <div className="p-1 pb-4 pt-6">
                        <h3 className="text-sm font-semibold mb-4">
                          Select Address
                        </h3>

                        {addresses.length === 0 && !isLoadingAddresses ? (
                          <div className="text-center py-8">
                            <MapPin className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                            <p className="text-muted-foreground mb-4">
                              No addresses saved
                            </p>
                            <Link href="/customer/profile?tab=addresses">
                              <Button size="sm">Add Address</Button>
                            </Link>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {addresses.map((address) => (
                              <button
                                key={address.id}
                                onClick={() => setSelectedAddress(address)}
                                className={`w-full p-4 rounded-md border-2 text-left transition-all ${
                                  selectedAddress?.id === address.id
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                                }`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm capitalize mb-1">
                                      {address.addressType}
                                    </p>
                                    <p className="text-sm text-muted-foreground line-clamp-1">
                                      {address.street}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {address.city}, {address.state}
                                    </p>
                                  </div>
                                  {selectedAddress?.id === address.id && (
                                    <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <Separator />

                      {/* Book Now Button */}
                      <div className="p-6 pt-6">
                        <Button
                          size="lg"
                          onClick={handleBookNow}
                          disabled={
                            !canBook || isBooking || isCheckingAvailability
                          }
                          className="w-full gap-2"
                        >
                          {isCheckingAvailability ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Checking availability...
                            </>
                          ) : isBooking ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <span className="flex items-center gap-1">
                                <IndianRupee className="h-4 w-4" />
                                {service.price}
                              </span>
                              <span className="ml-1">Book Now</span>
                            </>
                          )}
                        </Button>
                        {!canBook && (
                          <p className="text-xs text-center text-muted-foreground mt-2">
                            Please complete all selections above
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Provider Info Card (Desktop Only) */}
                  {/* {service && (
                    <Card className="mt-4 hidden lg:block">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                            <Building2 className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {service.provider?.businessName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {service.provider?.city}, {service.provider?.state}
                            </p>
                          </div>
                          {service.provider?.isVerified && (
                            <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )} */}
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
