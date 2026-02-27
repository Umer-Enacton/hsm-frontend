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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  getServiceById,
  getAvailableSlots,
  getAddresses,
  createBooking,
  getServiceFeedback,
} from "@/lib/customer/api";
import type { ServiceDetails, Slot, Address } from "@/types/customer";
import Link from "next/link";
import { api, API_ENDPOINTS } from "@/lib/api";
import { cn } from "@/lib/utils";

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

  // Loading states
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isLoadingService, setIsLoadingService] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);

  // Data
  const [service, setService] = useState<ServiceDetails | null>(null);
  const [allSlots, setAllSlots] = useState<Slot[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);

  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [isBooking, setIsBooking] = useState(false);

  // Carousel state
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const autoScrollPausedRef = useRef(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [reviewsPerView, setReviewsPerView] = useState(3);

  // Update reviews per view based on screen size
  useEffect(() => {
    const updateReviewsPerView = () => {
      if (window.innerWidth >= 1024) {
        setReviewsPerView(3);
      } else if (window.innerWidth >= 640) {
        setReviewsPerView(2);
      } else {
        setReviewsPerView(1);
      }
    };

    updateReviewsPerView();
    window.addEventListener("resize", updateReviewsPerView);
    return () => window.removeEventListener("resize", updateReviewsPerView);
  }, []);

  // Auto-scroll carousel
  useEffect(() => {
    if (feedbacks.length <= reviewsPerView) return;

    const interval = setInterval(() => {
      if (!autoScrollPausedRef.current) {
        setCurrentReviewIndex((prev) => {
          const maxIndex = feedbacks.length - reviewsPerView;
          return prev >= maxIndex ? 0 : prev + 1;
        });
      }
    }, 4000); // Auto-scroll every 4 seconds

    return () => clearInterval(interval);
  }, [feedbacks.length, reviewsPerView]);

  // Carousel handlers
  const handleNextReview = () => {
    const maxIndex = feedbacks.length - reviewsPerView;
    setCurrentReviewIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const handlePreviousReview = () => {
    setCurrentReviewIndex((prev) =>
      prev <= 0 ? feedbacks.length - reviewsPerView : prev - 1,
    );
  };

  const handleMouseEnter = () => {
    autoScrollPausedRef.current = true;
  };

  const handleMouseLeave = () => {
    autoScrollPausedRef.current = false;
  };

  // Fetch initial data on mount
  useEffect(() => {
    loadServiceDetails();
    loadAddresses();
  }, [id]);

  const loadServiceDetails = async () => {
    try {
      setIsLoadingService(true);
      const serviceData = await getServiceById(parseInt(id));
      setService(serviceData);
      setHasLoadedOnce(true);

      // Load slots for this business
      if (serviceData?.provider?.id) {
        await loadSlots(serviceData.provider.id);
      }

      // Load feedback for this service
      await loadFeedback(parseInt(id));
    } catch (error: any) {
      console.error("Error loading service:", error);
      toast.error("Failed to load service details");
      router.push("/customer/services");
    } finally {
      setIsLoadingService(false);
    }
  };

  const loadFeedback = async (serviceId: number) => {
    try {
      setIsLoadingFeedback(true);
      const feedbackResponse: any = await api.get(
        API_ENDPOINTS.FEEDBACK_BY_SERVICE(serviceId),
      );
      const feedbackData = Array.isArray(feedbackResponse)
        ? feedbackResponse
        : feedbackResponse?.feedback || feedbackResponse?.data || [];

      setFeedbacks(feedbackData.slice(0, 10)); // Show last 10 reviews
    } catch (error) {
      console.error("Error loading feedback:", error);
      setFeedbacks([]);
    } finally {
      setIsLoadingFeedback(false);
    }
  };

  const loadAddresses = async () => {
    try {
      setIsLoadingAddresses(true);
      const addressData = await getAddresses();
      const addressesArray = Array.isArray(addressData) ? addressData : [];
      setAddresses(addressesArray);
      if (addressesArray.length > 0 && !selectedAddress) {
        setSelectedAddress(addressesArray[0]);
      }
    } catch (error) {
      console.error("Error loading addresses:", error);
      setAddresses([]);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const loadSlots = async (businessId: number) => {
    try {
      setIsLoadingSlots(true);
      const slotData = await getAvailableSlots(businessId);
      setAllSlots(Array.isArray(slotData) ? slotData : []);
    } catch (error) {
      console.error("Error loading slots:", error);
      toast.error("Failed to load available slots");
      setAllSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  // Get next 3 days only (Today, Tomorrow, Overmorrow)
  const getNext3Days = () => {
    const days = [];
    const today = new Date();

    for (let i = 0; i < 3; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const dateStr = date.toISOString().split("T")[0];

      days.push({
        value: dateStr,
        label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : "Overmorrow",
        displayDate: date.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
      });
    }

    return days;
  };

  // Smart slot filtering - exclude past slots for today
  const getAvailableSlotsForDate = (dateStr: string) => {
    const today = new Date().toISOString().split("T")[0];

    // If not today, show all slots
    if (dateStr !== today) {
      return allSlots;
    }

    // If today, filter out past slots and slots less than 30 min away
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const bufferMinutes = 30; // 30 minute buffer for provider arrival

    return allSlots.filter((slot) => {
      const slotTime = slot.startTime; // "HH:mm:ss"
      const [hours, minutes] = slotTime.split(":").map(Number);
      const slotMinutes = hours * 60 + minutes;

      // Only show slots at least 30 minutes in future
      return slotMinutes > currentMinutes + bufferMinutes;
    });
  };

  // Handlers
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slot: Slot) => {
    setSelectedSlot(slot);
  };

  const handleBookNow = async () => {
    if (!service || !selectedDate || !selectedSlot || !selectedAddress) {
      toast.error("Please complete all selections");
      return;
    }

    try {
      setIsBooking(true);

      const result = await createBooking({
        serviceId: service.id,
        slotId: selectedSlot.id,
        addressId: selectedAddress.id,
        bookingDate: new Date(selectedDate).toISOString(),
      });

      toast.success(result.message || "Booking created successfully!");

      setTimeout(() => {
        router.push("/customer/bookings");
      }, 1500);
    } catch (error: any) {
      console.error("Error creating booking:", error);
      toast.error(error.message || "Failed to create booking");
    } finally {
      setIsBooking(false);
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

  const showSkeleton = !hasLoadedOnce || isLoadingService;

  // Set default date
  useEffect(() => {
    const days = getNext3Days();
    if (!selectedDate && days.length > 0) {
      setSelectedDate(days[0].value);
    }
  }, [allSlots]);

  // Check if all selections are complete
  const canBook = service && selectedDate && selectedSlot && selectedAddress;

  // Error state
  if (hasLoadedOnce && !service) {
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
          // Skeleton Loading - Two Column
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="w-full aspect-video bg-muted rounded-2xl animate-pulse" />
              <div className="h-48 bg-muted rounded-2xl animate-pulse" />
              <div className="h-64 bg-muted rounded-2xl animate-pulse" />
            </div>
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded w-3/4 animate-pulse" />
              <div className="h-4 bg-muted rounded w-full animate-pulse" />
              <div className="h-32 bg-muted rounded-2xl animate-pulse mt-6" />
            </div>
          </div>
        ) : (
          service && (
            <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
              {/* LEFT COLUMN - Service Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Hero Banner Section - Image with Info Overlay */}
                <section>
                  <div className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background border">
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
                              {service.provider.isVerified && (
                                <Badge className="bg-green-500 text-white border-green-400 gap-1.5">
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  Verified
                                </Badge>
                              )}
                            </div>
                            <p className="text-lg text-white/90">
                              by {service.provider.businessName}
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
                              {service.provider.city}, {service.provider.state}
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
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
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
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
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
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
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
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <MapPin className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Service Area</p>
                            <p className="text-sm text-muted-foreground">
                              {service.provider.city}, {service.provider.state}
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
                                            <img
                                              src={customerAvatar}
                                              alt={customerName}
                                              className="h-10 w-10 rounded-full object-cover border-2 border-primary/20"
                                            />
                                          ) : (
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border-2 border-primary/20">
                                              <UserIcon className="h-5 w-5 text-primary" />
                                            </div>
                                          )}

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
                        <div className="grid grid-cols-3 gap-3">
                          {getNext3Days().map((day) => (
                            <button
                              key={day.value}
                              onClick={() => handleDateChange(day.value)}
                              className={`p-3 rounded-lg border-2 text-center transition-all ${
                                selectedDate === day.value
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border hover:border-primary/50 hover:bg-muted/50"
                              }`}
                            >
                              <div className="text-sm font-medium">
                                {day.displayDate}
                              </div>
                            </button>
                          ))}
                        </div>
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
                              ? formatDate(selectedDate)
                              : "Select a date first"}
                          </p>
                        </div>

                        {(() => {
                          const availableSlots = selectedDate
                            ? getAvailableSlotsForDate(selectedDate)
                            : [];

                          if (!selectedDate) {
                            return (
                              <div className="text-center py-8 bg-muted/50 rounded-lg">
                                <CalendarIcon className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                                <p className="text-sm text-muted-foreground">
                                  Select a date to see available times
                                </p>
                              </div>
                            );
                          }

                          if (availableSlots.length === 0 && !isLoadingSlots) {
                            return (
                              <div className="text-center py-8 bg-muted/50 rounded-lg">
                                <X className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                                <p className="text-sm text-muted-foreground">
                                  No time slots available for this date
                                </p>
                              </div>
                            );
                          }

                          return (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                              {availableSlots.slice(0, 12).map((slot) => (
                                <button
                                  key={slot.id}
                                  onClick={() => handleSlotSelect(slot)}
                                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                                    selectedSlot?.id === slot.id
                                      ? "border-primary bg-primary text-primary-foreground"
                                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                                  }`}
                                >
                                  {formatTime(slot.startTime)}
                                </button>
                              ))}
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
                                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
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
                          disabled={!canBook || isBooking}
                          className="w-full gap-2"
                        >
                          {isBooking ? (
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
                              {service.provider.businessName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {service.provider.city}, {service.provider.state}
                            </p>
                          </div>
                          {service.provider.isVerified && (
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
