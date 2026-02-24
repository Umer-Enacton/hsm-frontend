"use client";

import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Calendar, MapPin, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { getServiceById, getAvailableSlots, createBooking, getAddresses } from "@/lib/customer/api";
import type { ServiceDetails, Slot, Address } from "@/types/customer";

export default function NewBookingPage({
  params,
}: {
  params: Promise<{ serviceId: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Unwrap the params Promise
  const { serviceId } = use(params);

  const [isLoading, setIsLoading] = useState(true);
  const [service, setService] = useState<ServiceDetails | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);

  // Pre-selected from URL params
  const [selectedDate, setSelectedDate] = useState<string>(searchParams.get("date") || "");
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    loadServiceAndAddresses();
  }, [serviceId]);

  useEffect(() => {
    if (selectedDate && service) {
      loadSlots(selectedDate);
    }
  }, [selectedDate, service]);

  const loadServiceAndAddresses = async () => {
    try {
      setIsLoading(true);
      const serviceData = await getServiceById(parseInt(serviceId));
      setService(serviceData);

      const addressData = await getAddresses();
      setAddresses(Array.isArray(addressData) ? addressData : []);

      // Pre-select from URL
      const slotId = searchParams.get("slot");
      const addressId = searchParams.get("address");

      if (slotId && serviceData.slots) {
        const slot = serviceData.slots.find((s: Slot) => s.id === parseInt(slotId));
        if (slot) setSelectedSlot(slot);
      }

      if (addressId && addressData) {
        const address = addressData.find((a) => a.id === parseInt(addressId));
        if (address) setSelectedAddress(address);
      }
    } catch (error: any) {
      console.error("Error loading service:", error);
      toast.error("Failed to load service details");
      router.push("/customer/services");
    } finally {
      setIsLoading(false);
    }
  };

  const loadSlots = async (date: string) => {
    if (!service) return;
    try {
      const slotData = await getAvailableSlots(service.provider.id, date);
      setSlots(slotData);
    } catch (error) {
      console.error("Error loading slots:", error);
    }
  };

  const handleBookNow = async () => {
    if (!service || !selectedSlot || !selectedAddress) {
      toast.error("Please complete all selections");
      return;
    }

    try {
      setIsBooking(true);
      const result = await createBooking({
        serviceId: parseInt(serviceId),
        slotId: selectedSlot.id,
        addressId: selectedAddress.id,
        bookingDate: selectedDate ? new Date(selectedDate).toISOString() : undefined,
      });

      toast.success(result.message || "Booking created successfully!");
      router.push(`/customer/bookings/${result.booking.id}`);
    } catch (error: any) {
      console.error("Error creating booking:", error);
      toast.error(error.message || "Failed to create booking");
    } finally {
      setIsBooking(false);
    }
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
          <p className="text-sm text-muted-foreground">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return null;
  }

  const canProceed = selectedDate && selectedSlot && selectedAddress;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          ←
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Book Service</h1>
          <p className="text-muted-foreground">{service.name}</p>
        </div>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`rounded-full w-8 h-8 flex items-center justify-center ${selectedDate ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {selectedDate ? <Check className="h-4 w-4" /> : "1"}
              </div>
              <div>
                <p className={`text-sm font-medium ${selectedDate ? "text-foreground" : "text-muted-foreground"}`}>
                  Select Date
                </p>
              </div>
            </div>
            <div className="h-0.5 w-12 bg-muted" />
            <div className="flex items-center gap-2">
              <div className={`rounded-full w-8 h-8 flex items-center justify-center ${selectedSlot ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {selectedSlot ? <Check className="h-4 w-4" /> : "2"}
              </div>
              <div>
                <p className={`text-sm font-medium ${selectedSlot ? "text-foreground" : "text-muted-foreground"}`}>
                  Select Time
                </p>
              </div>
            </div>
            <div className="h-0.5 w-12 bg-muted" />
            <div className="flex items-center gap-2">
              <div className={`rounded-full w-8 h-8 flex items-center justify-center ${selectedAddress ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {selectedAddress ? <Check className="h-4 w-4" /> : "3"}
              </div>
              <div>
                <p className={`text-sm font-medium ${selectedAddress ? "text-foreground" : "text-muted-foreground"}`}>
                  Select Address
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Select Date */}
      <Card>
        <CardHeader>
          <CardTitle>1. Select Date</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {getNext7Days().map((day) => (
              <button
                key={day.value}
                onClick={() => {
                  setSelectedDate(day.value);
                  setSelectedSlot(null);
                }}
                className={`px-4 py-3 rounded-lg border-2 transition-all ${
                  selectedDate === day.value
                    ? "border-primary bg-primary text-primary-foreground shadow-md"
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
        </CardContent>
      </Card>

      {/* Step 2: Select Time Slot */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle>2. Select Time Slot</CardTitle>
          </CardHeader>
          <CardContent>
            {slots.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No slots available for this date</p>
              </div>
            ) : (
              <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                {slots.map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => setSelectedSlot(slot)}
                    className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      selectedSlot?.id === slot.id
                        ? "border-primary bg-primary text-primary-foreground shadow-md"
                        : "border-border hover:border-primary/50 hover:bg-primary/5"
                    }`}
                  >
                    {formatTime(slot.startTime)}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Select Address */}
      {selectedDate && selectedSlot && (
        <Card>
          <CardHeader>
            <CardTitle>3. Select Service Address</CardTitle>
          </CardHeader>
          <CardContent>
            {addresses.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No addresses saved</p>
                <Button onClick={() => router.push("/customer/addresses/new")}>
                  Add New Address
                </Button>
              </div>
            ) : (
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
                      <div className="flex-1">
                        <p className="font-medium capitalize">{address.addressType}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {address.street}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {address.city}, {address.state} {address.zipCode}
                        </p>
                      </div>
                      {selectedAddress?.id === address.id && (
                        <Check className="h-5 w-5 text-primary shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Booking Summary */}
      {canProceed && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle>Booking Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Service:</span>
                <span className="font-medium">{service.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Provider:</span>
                <span className="font-medium">{service.provider.businessName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span className="font-medium">{new Date(selectedDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Time:</span>
                <span className="font-medium">{formatTime(selectedSlot.startTime)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Address:</span>
                <span className="font-medium text-right">
                  {selectedAddress.street}, {selectedAddress.city}
                </span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-2xl font-bold">₹{service.price}</span>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full mt-4"
              onClick={handleBookNow}
              disabled={isBooking}
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

            <p className="text-xs text-center text-muted-foreground mt-2">
              By confirming, you agree to our terms of service and cancellation policy
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
