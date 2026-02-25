"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Star, MapPin, Clock, ChevronLeft, CheckCircle, Building2, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { getServiceById, getAvailableSlots, getAddresses, createBooking } from "@/lib/customer/api";
import type { ServiceDetails, Slot, Address } from "@/types/customer";
import Link from "next/link";

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

  // Data
  const [service, setService] = useState<ServiceDetails | null>(null);
  const [allSlots, setAllSlots] = useState<Slot[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [isBooking, setIsBooking] = useState(false);

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
    } catch (error: any) {
      console.error("Error loading service:", error);
      toast.error("Failed to load service details");
      router.push("/customer/services");
    } finally {
      setIsLoadingService(false);
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

      const dateStr = date.toISOString().split('T')[0];

      days.push({
        value: dateStr,
        label: i === 0 ? 'Today' :
               i === 1 ? 'Tomorrow' :
               'Overmorrow',
        displayDate: date.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        })
      });
    }

    return days;
  };

  // Smart slot filtering - exclude past slots for today
  const getAvailableSlotsForDate = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];

    // If not today, show all slots
    if (dateStr !== today) {
      return allSlots;
    }

    // If today, filter out past slots and slots less than 30 min away
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const bufferMinutes = 30; // 30 minute buffer for provider arrival

    return allSlots.filter(slot => {
      const slotTime = slot.startTime; // "HH:mm:ss"
      const [hours, minutes] = slotTime.split(':').map(Number);
      const slotMinutes = hours * 60 + minutes;

      // Only show slots at least 30 minutes in future
      return slotMinutes > currentMinutes + bufferMinutes;
    });
  };

  // Handlers
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null); // Reset slot when date changes
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

      // Redirect to bookings list after successful booking
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
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${period}`;
  };

  const showSkeleton = !hasLoadedOnce || isLoadingService;

  // Set default date
  useEffect(() => {
    const days = getNext3Days();
    if (!selectedDate && days.length > 0) {
      setSelectedDate(days[0].value);
    }
  }, [allSlots]);

  // Error state
  if (hasLoadedOnce && !service) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Service Not Found</h2>
          <p className="text-muted-foreground mb-6">The service you're looking for doesn't exist or has been removed.</p>
          <Link href="/customer/services">
            <Button>Browse Services</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header - Always Visible */}
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
          // Skeleton Loading
          <div className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="w-full aspect-video bg-muted rounded-2xl animate-pulse" />
              <div className="space-y-4">
                <div className="h-8 bg-muted rounded w-3/4 animate-pulse" />
                <div className="h-4 bg-muted rounded w-full animate-pulse" />
                <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
                <div className="h-12 bg-muted rounded w-1/3 animate-pulse mt-6" />
              </div>
            </div>
            <div className="h-64 bg-muted rounded-2xl animate-pulse" />
            <div className="h-64 bg-muted rounded-2xl animate-pulse" />
          </div>
        ) : service && (
          <div className="space-y-8">
            {/* ==================== HERO SECTION ==================== */}
            <section className="grid lg:grid-cols-2 gap-6 lg:gap-8">
              {/* Left - Service Image */}
              <div className="relative w-full aspect-video lg:aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background border">
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
              </div>

              {/* Right - Service Info */}
              <div className="flex flex-col justify-center space-y-5">
                {/* Title */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
                      {service.name}
                    </h1>
                    {service.provider.isVerified && (
                      <Badge className="bg-green-100 text-green-700 border-0 gap-1.5">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-lg text-muted-foreground">
                    by {service.provider.businessName}
                  </p>
                </div>

                {/* Short Description */}
                <p className="text-muted-foreground line-clamp-3 leading-relaxed">
                  {service.description}
                </p>

                {/* Price */}
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">₹{service.price}</span>
                  <span className="text-muted-foreground">per service</span>
                </div>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-6 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-5 w-5" />
                    <span className="font-medium">{service.estimateDuration} minutes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-lg">{Number(service.rating || 0).toFixed(1)}</span>
                    <span className="text-muted-foreground">
                      ({service.totalReviews || 0} reviews)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-5 w-5" />
                    <span>{service.provider.city}, {service.provider.state}</span>
                  </div>
                </div>
              </div>
            </section>

            <Separator className="my-8" />

            {/* ==================== SERVICE DETAILS SECTION ==================== */}
            <section>
              <Card>
                <CardContent className="p-6 lg:p-8">
                  <h2 className="text-2xl font-bold mb-6">Service Details</h2>

                  <div className="space-y-6">
                    {/* Full Description */}
                    <div>
                      <h3 className="font-semibold text-lg mb-3">Description</h3>
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                        {service.description}
                      </p>
                    </div>

                    <Separator />

                    {/* Additional Info Grid */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Duration</p>
                        <p className="font-semibold flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {service.estimateDuration} minutes
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Provider</p>
                        <p className="font-semibold">{service.provider.businessName}</p>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Location</p>
                        <p className="font-semibold flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {service.provider.city}, {service.provider.state}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* ==================== AVAILABILITY SECTION ==================== */}
            <section>
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">Check Availability</h2>
                <p className="text-muted-foreground">Select a date to view available time slots</p>
              </div>

              {/* Date Selection - Only 3 Days */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="grid grid-cols-3 gap-4">
                    {getNext3Days().map((day) => (
                      <button
                        key={day.value}
                        onClick={() => handleDateChange(day.value)}
                        className={`p-4 rounded-xl border-2 text-center transition-all ${
                          selectedDate === day.value
                            ? "border-primary bg-primary text-primary-foreground shadow-md scale-105"
                            : "border-border hover:border-primary/50 hover:bg-accent"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="text-xs font-medium opacity-80">{day.label}</div>
                          <div className="text-sm font-bold">{day.displayDate}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Time Slots Grid */}
              {selectedDate && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-lg">
                        Available Time Slots for{" "}
                        {new Date(selectedDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </h3>
                      {isLoadingSlots && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                    </div>

                    {(() => {
                      const availableSlots = getAvailableSlotsForDate(selectedDate);

                      if (availableSlots.length === 0 && !isLoadingSlots) {
                        return (
                          <div className="text-center py-12 px-6 bg-muted/50 rounded-xl">
                            <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                            <p className="text-muted-foreground font-medium">No availability for this date</p>
                            <p className="text-sm text-muted-foreground mt-1">Please try another date</p>
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                          {availableSlots.map((slot) => (
                            <button
                              key={slot.id}
                              onClick={() => handleSlotSelect(slot)}
                              className={`px-4 py-3 rounded-lg border-2 text-sm font-semibold transition-all ${
                                selectedSlot?.id === slot.id
                                  ? "border-primary bg-primary text-primary-foreground shadow-md"
                                  : "border-border hover:border-primary/50 hover:bg-accent"
                              }`}
                            >
                              {formatTime(slot.startTime)}
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}
            </section>

            {/* ==================== ADDRESS SELECTION SECTION ==================== */}
            {selectedDate && selectedSlot && (
              <section>
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Select Service Address</h3>

                    {addresses.length === 0 && !isLoadingAddresses ? (
                      <div className="text-center py-8">
                        <MapPin className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-muted-foreground mb-4">No addresses saved</p>
                        <Link href="/customer/profile?tab=addresses">
                          <Button>Add New Address</Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid gap-3 md:grid-cols-2">
                          {addresses.map((address) => (
                            <button
                              key={address.id}
                              onClick={() => setSelectedAddress(address)}
                              className={`p-4 rounded-lg border-2 text-left transition-all ${
                                selectedAddress?.id === address.id
                                  ? "border-primary bg-primary/5 shadow-md"
                                  : "border-border hover:border-primary/50 hover:bg-muted/50"
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium capitalize">{address.addressType}</p>
                                  <p className="text-sm text-muted-foreground mt-1">{address.street}</p>
                                  <p className="text-sm text-muted-foreground">{address.city}, {address.state} {address.zipCode}</p>
                                </div>
                                {selectedAddress?.id === address.id && (
                                  <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </section>
            )}

            {/* ==================== BOOKING SUMMARY & CTA SECTION ==================== */}
            {selectedDate && selectedSlot && selectedAddress && service && (
              <section>
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Booking Summary</h3>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Service</span>
                        <span className="font-medium">{service.name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Provider</span>
                        <span className="font-medium">{service.provider.businessName}</span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Date</span>
                        <span className="font-medium">
                          {new Date(selectedDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Time</span>
                        <span className="font-medium">{formatTime(selectedSlot.startTime)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Duration</span>
                        <span className="font-medium">{service.estimateDuration} minutes</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Address</span>
                        <span className="font-medium text-right max-w-[200px] truncate">
                          {selectedAddress.street}, {selectedAddress.city}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-lg font-semibold">Total Amount</span>
                        <span className="text-2xl font-bold text-primary">₹{service.price}</span>
                      </div>
                    </div>

                    <Button
                      size="lg"
                      className="w-full"
                      onClick={handleBookNow}
                      disabled={isBooking}
                    >
                      {isBooking ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Book Now"
                      )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground mt-3">
                      By confirming, you agree to our terms of service and cancellation policy
                    </p>
                  </CardContent>
                </Card>
              </section>
            )}

            {/* ==================== BUSINESS INFO SECTION ==================== */}
            <section>
              <Card>
                <CardContent className="p-6 lg:p-8">
                  <h2 className="text-2xl font-bold mb-6">About the Provider</h2>

                  <div className="flex flex-col sm:flex-row gap-6">
                    {/* Provider Logo */}
                    <div className="shrink-0">
                      {service.provider.logo ? (
                        <div className="w-24 h-24 rounded-xl overflow-hidden border-2">
                          <Image
                            src={service.provider.logo}
                            alt={service.provider.businessName}
                            width={96}
                            height={96}
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border-2">
                          <Building2 className="h-12 w-12 text-primary/40" />
                        </div>
                      )}
                    </div>

                    {/* Provider Info */}
                    <div className="flex-1 space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-xl font-bold">{service.provider.businessName}</h3>
                          {service.provider.isVerified && (
                            <Badge variant="outline" className="gap-1.5 border-green-200 text-green-700">
                              <CheckCircle className="h-3.5 w-3.5" />
                              Verified
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1.5">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-semibold">{Number(service.rating || 0).toFixed(1)}</span>
                            <span className="text-muted-foreground">
                              ({service.totalReviews || 0} reviews)
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{service.provider.city}, {service.provider.state}</span>
                          </div>
                        </div>
                      </div>

                      {service.provider.description && (
                        <div className="pt-2">
                          <p className="text-muted-foreground leading-relaxed">
                            {service.provider.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
