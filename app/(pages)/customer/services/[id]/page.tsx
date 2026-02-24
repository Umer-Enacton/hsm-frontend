"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Star, MapPin, Clock, Phone, Calendar, ChevronLeft, Check, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { getServiceById, getAvailableSlots } from "@/lib/customer/api";
import type { ServiceDetails, Slot, Address } from "@/types/customer";
import { getAddresses } from "@/lib/customer/api";
import Link from "next/link";

export default function ServiceDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  // Unwrap the params Promise
  const { id } = use(params);

  const [isLoading, setIsLoading] = useState(true);
  const [service, setService] = useState<ServiceDetails | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    loadServiceDetails();
    loadAddresses();
  }, [id]);

  const loadServiceDetails = async () => {
    try {
      setIsLoading(true);
      const serviceData = await getServiceById(parseInt(id));
      setService(serviceData);
    } catch (error: any) {
      console.error("Error loading service:", error);
      toast.error("Failed to load service details");
      router.push("/customer/services");
    } finally {
      setIsLoading(false);
    }
  };

  const loadAddresses = async () => {
    try {
      const addressData = await getAddresses();
      const addressesArray = Array.isArray(addressData) ? addressData : [];
      setAddresses(addressesArray);
      if (addressesArray.length > 0) {
        setSelectedAddress(addressesArray[0]);
      }
    } catch (error) {
      console.error("Error loading addresses:", error);
      setAddresses([]);
    }
  };

  const loadSlots = async (date: string) => {
    if (!service) return;
    try {
      const slotData = await getAvailableSlots(service.provider.id, date);
      setSlots(Array.isArray(slotData) ? slotData : []);
    } catch (error) {
      console.error("Error loading slots:", error);
      toast.error("Failed to load available slots");
      setSlots([]);
    }
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    loadSlots(date);
  };

  const handleBookNow = () => {
    if (!selectedDate) {
      toast.error("Please select a date");
      return;
    }
    if (!selectedSlot) {
      toast.error("Please select a time slot");
      return;
    }
    if (!selectedAddress) {
      toast.error("Please select an address");
      return;
    }

    // Navigate to booking page with pre-filled data
    router.push(
      `/customer/bookings/new/${id}?date=${selectedDate}&slot=${selectedSlot.id}&address=${selectedAddress.id}`
    );
  };

  const getTodayDate = () => {
    return new Date().toISOString().split("T")[0];
  };

  const getNext7Days = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push({
        value: date.toISOString().split("T")[0],
        label: date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      });
    }
    return days;
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, "0");
    return `${displayHours}:${displayMinutes} ${period}`;
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading service details...</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold mb-4">Service not found</p>
          <Link href="/customer/services">
            <Button>Browse Services</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/customer/services">
        <Button variant="ghost" className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          Back to Services
        </Button>
      </Link>

      {/* Service Header */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Service Image */}
        <div className="md:w-1/3">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {service.image ? (
                <img
                  src={service.image}
                  alt={service.name}
                  className="w-full h-64 object-cover"
                />
              ) : (
                <div className="w-full h-64 bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground">No image available</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Service Info */}
        <div className="md:w-2/3 space-y-4">
          <div>
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-3xl font-bold">{service.name}</h1>
              {service.provider.isVerified && (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20">
                  ✓ Verified Provider
                </Badge>
              )}
            </div>
            <p className="text-xl text-muted-foreground">{service.provider.businessName}</p>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-1">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="text-lg font-semibold">{service.provider.rating.toFixed(1)}</span>
              <span className="text-muted-foreground">
                ({service.provider.totalReviews} reviews)
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{service.provider.city}, {service.provider.state}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{service.estimateDuration} mins</span>
            </div>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Starting from</p>
                  <p className="text-3xl font-bold">₹{service.price}</p>
                </div>
                <Button size="lg" onClick={() => document.getElementById("booking-section")?.scrollIntoView({ behavior: "smooth" })}>
                  Book Now
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Provider Contact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{service.provider.phone}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs for Details, Reviews, Booking */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="booking">Book Now</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>About this Service</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{service.description}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Duration</h3>
                  <p className="text-muted-foreground">{service.estimateDuration} minutes</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Service Type</h3>
                  <p className="text-muted-foreground">Home Visit</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews">
          <Card>
            <CardHeader>
              <CardTitle>Customer Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              {service.reviews.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No reviews yet</p>
              ) : (
                <div className="space-y-4">
                  {service.reviews.map((review) => (
                    <div key={review.id} className="border-b pb-4 last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{review.customerName}</span>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {review.comments && (
                        <p className="text-sm text-muted-foreground">{review.comments}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="booking" id="booking-section">
          <Card>
            <CardHeader>
              <CardTitle>Select Date & Time</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Date Selection */}
              <div>
                <h3 className="font-semibold mb-3">Select Date</h3>
                <div className="flex flex-wrap gap-2">
                  {getNext7Days().map((day) => (
                    <button
                      key={day.value}
                      onClick={() => handleDateChange(day.value)}
                      className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                        selectedDate === day.value
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-xs font-medium">{day.label.split(",")[0]}</div>
                        <div className="text-sm font-bold">{day.label.split(",")[1]}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Slot Selection */}
              {selectedDate && (
                <div>
                  <h3 className="font-semibold mb-3">Select Time Slot</h3>
                  {slots.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No slots available for this date</p>
                  ) : (
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                      {slots.map((slot) => (
                        <button
                          key={slot.id}
                          onClick={() => setSelectedSlot(slot)}
                          className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                            selectedSlot?.id === slot.id
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          {formatTime(slot.startTime)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Address Selection */}
              <div>
                <h3 className="font-semibold mb-3">Select Service Address</h3>
                {addresses.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-3">No addresses saved</p>
                    <Link href="/customer/addresses/new">
                      <Button size="sm">Add Address</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {addresses.map((address) => (
                      <button
                        key={address.id}
                        onClick={() => setSelectedAddress(address)}
                        className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
                          selectedAddress?.id === address.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{address.addressType}</p>
                            <p className="text-sm text-muted-foreground">
                              {address.street}, {address.city}
                            </p>
                          </div>
                          {selectedAddress?.id === address.id && (
                            <Check className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Book Button */}
              <Button
                size="lg"
                className="w-full"
                onClick={handleBookNow}
                disabled={!selectedDate || !selectedSlot || !selectedAddress || isBooking}
              >
                {isBooking ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Confirm Booking"
                )}
              </Button>

              {/* Booking Summary */}
              {selectedDate && selectedSlot && selectedAddress && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <h4 className="font-semibold mb-2">Booking Summary</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-muted-foreground">Service:</span> {service.name}</p>
                      <p><span className="text-muted-foreground">Date:</span> {new Date(selectedDate).toLocaleDateString()}</p>
                      <p><span className="text-muted-foreground">Time:</span> {formatTime(selectedSlot.startTime)}</p>
                      <p><span className="text-muted-foreground">Address:</span> {selectedAddress.street}, {selectedAddress.city}</p>
                      <p className="text-lg font-bold mt-2"><span className="text-muted-foreground">Total:</span> ₹{service.price}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
