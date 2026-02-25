"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Calendar, CheckCircle, XCircle, Clock, MapPin, ChevronRight, AlertCircle, Package, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { getCustomerBookings } from "@/lib/customer/api";
import { getServiceById } from "@/lib/customer/api";
import { getAddresses } from "@/lib/customer/api";
import { getAvailableSlots } from "@/lib/customer/api";
import type { CustomerBooking } from "@/types/customer";
import type { ServiceDetails } from "@/types/customer";
import type { Slot } from "@/types/customer";
import type { Address } from "@/types/customer";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function CustomerBookingsPage() {
  const router = useRouter();
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [bookings, setBookings] = useState<CustomerBooking[]>([]);
  const [serviceCache, setServiceCache] = useState<Record<number, ServiceDetails>>({});
  const [addressCache, setAddressCache] = useState<Record<number, Address>>({});
  const [slotCache, setSlotCache] = useState<Record<number, Slot>>({});
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "confirmed" | "completed" | "cancelled">("all");

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setIsLoading(true);
      console.log("📡 Fetching customer bookings...");

      const data = await getCustomerBookings();
      console.log("📦 Bookings response:", data);

      const bookingsArray = Array.isArray(data?.bookings) ? data.bookings : [];
      setBookings(bookingsArray);

      // Fetch details for each booking
      if (bookingsArray.length > 0) {
        await loadBookingDetails(bookingsArray);
      }

      setHasLoadedOnce(true);
    } catch (error: any) {
      console.error("Error loading bookings:", error);
      toast.error(error.message || "Failed to load bookings");
      setBookings([]);
      setHasLoadedOnce(true);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBookingDetails = async (bookingsList: CustomerBooking[]) => {
    try {
      setIsLoadingDetails(true);

      // Get unique IDs
      const serviceIds = [...new Set(bookingsList.map(b => b.serviceId))];
      const businessProfileIds = [...new Set(bookingsList.map(b => b.businessProfileId))];

      // Fetch service details
      const servicesPromises = serviceIds.map(async (serviceId) => {
        if (!serviceCache[serviceId]) {
          try {
            const service = await getServiceById(serviceId);
            return { id: serviceId, service };
          } catch (error) {
            console.error(`Error loading service ${serviceId}:`, error);
            return { id: serviceId, service: null };
          }
        }
        return { id: serviceId, service: serviceCache[serviceId] };
      });

      // Fetch all addresses
      const addressesResult = await getAddresses();
      const addressesArray = Array.isArray(addressesResult) ? addressesResult : [];

      // Create address cache
      const newAddressCache: Record<number, Address> = {};
      addressesArray.forEach((addr: Address) => {
        newAddressCache[addr.id] = addr;
      });
      setAddressCache(newAddressCache);

      // Fetch slots for each business
      const slotsPromises = businessProfileIds.map(async (businessId) => {
        try {
          const slots = await getAvailableSlots(businessId);
          return { businessId, slots };
        } catch (error) {
          console.error(`Error loading slots for business ${businessId}:`, error);
          return { businessId, slots: [] };
        }
      });

      // Wait for all parallel requests
      const [serviceResults, slotsResults] = await Promise.all([
        Promise.all(servicesPromises),
        Promise.all(slotsPromises)
      ]);

      // Update service cache
      const newServiceCache = { ...serviceCache };
      serviceResults.forEach(({ id, service }) => {
        if (service) {
          newServiceCache[id] = service;
        }
      });
      setServiceCache(newServiceCache);

      // Create slot cache
      const newSlotCache: Record<number, Slot> = { ...slotCache };
      slotsResults.forEach(({ slots }) => {
        slots.forEach((slot: Slot) => {
          newSlotCache[slot.id] = slot;
        });
      });
      setSlotCache(newSlotCache);

    } catch (error) {
      console.error("Error loading booking details:", error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const getFilteredBookings = () => {
    if (activeTab === "all") return bookings;
    return bookings.filter((b) => b.status === activeTab);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400",
      confirmed: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400",
      completed: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400",
      cancelled: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400",
    };

    const icons: Record<string, React.ReactNode> = {
      pending: <Clock className="h-3 w-3" />,
      confirmed: <CheckCircle className="h-3 w-3" />,
      completed: <CheckCircle className="h-3 w-3" />,
      cancelled: <XCircle className="h-3 w-3" />,
    };

    return (
      <Badge className={variants[status] || variants.pending} variant="outline">
        <span className="mr-1">{icons[status] || icons.pending}</span>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
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
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getBookingStatus = () => {
    if (isLoading) return "loading";
    if (bookings.length === 0) return "empty";
    return "has-data";
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">My Bookings</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage your service bookings</p>
            </div>
            <Link href="/customer/services">
              <Button variant="default" size="sm">
                Browse Services
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container max-w-5xl mx-auto px-4 py-6">
        {/* Status Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-5 h-10">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Loading State - Skeleton Cards */}
        {getBookingStatus() === "loading" && !hasLoadedOnce && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-muted animate-pulse flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-muted rounded w-1/2 animate-pulse" />
                      <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                    </div>
                    <div className="h-6 bg-muted rounded w-20 animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {getBookingStatus() === "empty" && hasLoadedOnce && (
          <Card className="border-dashed">
            <CardContent className="p-16 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-muted/30 mb-4">
                <Calendar className="h-7 w-7 text-muted-foreground/40" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No bookings found</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                {activeTab === "all"
                  ? "You haven't made any bookings yet. Browse our services to get started."
                  : `You don't have any ${activeTab} bookings.`
                }
              </p>
              <Link href="/customer/services">
                <Button>Browse Services</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Bookings List */}
        {getBookingStatus() === "has-data" && (
          <div className="space-y-3">
            {getFilteredBookings().map((booking) => {
              const service = serviceCache[booking.serviceId];
              const provider = service?.provider;
              const address = addressCache[booking.addressId];
              const slot = slotCache[booking.slotId];
              const isDetailsLoading = isLoadingDetails || !service || !address || !slot;

              return (
                <Card
                  key={booking.id}
                  className={cn(
                    "hover:border-primary/50 transition-colors cursor-pointer border-border/50",
                    "group"
                  )}
                  onClick={() => !isDetailsLoading && router.push(`/customer/bookings/${booking.id}`)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0",
                        booking.status === "pending" && "bg-yellow-100 dark:bg-yellow-900/20",
                        booking.status === "confirmed" && "bg-blue-100 dark:bg-blue-900/20",
                        booking.status === "completed" && "bg-green-100 dark:bg-green-900/20",
                        booking.status === "cancelled" && "bg-red-100 dark:bg-red-900/20"
                      )}>
                        <Package className={cn(
                          "h-6 w-6",
                          booking.status === "pending" && "text-yellow-600 dark:text-yellow-400",
                          booking.status === "confirmed" && "text-blue-600 dark:text-blue-400",
                          booking.status === "completed" && "text-green-600 dark:text-green-400",
                          booking.status === "cancelled" && "text-red-600 dark:text-red-400"
                        )} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {isDetailsLoading ? (
                          <div className="space-y-2">
                            <div className="h-5 bg-muted rounded w-1/2 animate-pulse" />
                            <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                            <div className="flex gap-4 mt-3">
                              <div className="h-4 bg-muted rounded w-20 animate-pulse" />
                              <div className="h-4 bg-muted rounded w-24 animate-pulse" />
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                                  {service.name}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <p className="text-sm text-muted-foreground truncate">
                                    {provider?.businessName || "Provider"}
                                  </p>
                                  <span className="text-muted-foreground">•</span>
                                  <div className="flex items-center gap-1">
                                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                                    <span className="text-sm font-medium">{Number(service.rating || 0).toFixed(1)}</span>
                                    <span className="text-xs text-muted-foreground">({service.totalReviews || 0} reviews)</span>
                                  </div>
                                </div>
                              </div>
                              {getStatusBadge(booking.status)}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>{formatDate(booking.bookingDate)}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" />
                                <span>{formatTime(slot.startTime)}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5" />
                                <span className="truncate max-w-[200px]">{address.city}</span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Price */}
                      {!isDetailsLoading && (
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-muted-foreground">Total</p>
                          <p className="text-xl font-bold">₹{booking.totalPrice}</p>
                        </div>
                      )}

                      {/* Chevron */}
                      <div className="flex items-center flex-shrink-0">
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* No Results for Filter */}
        {getBookingStatus() === "has-data" && getFilteredBookings().length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No {activeTab} bookings</h3>
              <p className="text-muted-foreground mb-6">
                Try selecting a different status tab.
              </p>
              <Button
                variant="outline"
                onClick={() => setActiveTab("all")}
              >
                View All Bookings
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
