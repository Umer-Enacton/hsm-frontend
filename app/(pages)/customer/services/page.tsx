"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Search, SlidersHorizontal, Star, MapPin, IndianRupee, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { getServices, getServices as searchServices } from "@/lib/customer/api";
import type { CustomerService, ServiceFilters } from "@/types/customer";
import { getAllStates, getCitiesByState } from "@/lib/data/india-locations";

export default function CustomerServicesPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [services, setServices] = useState<CustomerService[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  // Filters
  const [filters, setFilters] = useState<ServiceFilters>({});
  const [selectedState, setSelectedState] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<string>("all");

  // Memoize cities based on selected state
  const availableCities = useMemo(() => {
    return selectedState ? getCitiesByState(selectedState) : [];
  }, [selectedState]);

  useEffect(() => {
    loadServices();
  }, [page, filters]);

  const loadServices = async () => {
    try {
      setIsLoading(true);
      const result = await searchServices(filters);
      setServices(result.data || []);
      setTotal(result.total || 0);
    } catch (error: any) {
      console.error("Error loading services:", error);
      toast.error("Failed to load services");
      setServices([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setFilters({
      ...filters,
      search: searchQuery || undefined,
    });
    setPage(1);
  };

  const handleStateChange = (state: string) => {
    setSelectedState(state);
    setSelectedCity("all");
    setFilters({
      ...filters,
      state: state === "all" ? undefined : state,
      city: undefined,
    });
    setPage(1);
  };

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setFilters({
      ...filters,
      city: city === "all" ? undefined : city,
    });
    setPage(1);
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setFilters({
      ...filters,
      categoryId: categoryId === "all" ? undefined : parseInt(categoryId),
    });
    setPage(1);
  };

  const handlePriceRangeChange = (range: string) => {
    setPriceRange(range);
    if (range === "all") {
      setFilters({
        ...filters,
        minPrice: undefined,
        maxPrice: undefined,
      });
    } else {
      const [min, max] = range.split("-").map(Number);
      setFilters({
        ...filters,
        minPrice: isNaN(min) ? undefined : min,
        maxPrice: isNaN(max) ? undefined : max,
      });
    }
    setPage(1);
  };

  const clearFilters = () => {
    setSelectedState("all");
    setSelectedCity("all");
    setSelectedCategory("all");
    setPriceRange("all");
    setSearchQuery("");
    setFilters({});
    setPage(1);
  };

  if (isLoading && page === 1) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Browse Services</h1>
        <p className="text-muted-foreground">Find and book home services from verified providers</p>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-2xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search for services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9"
          />
        </div>
        <Button onClick={handleSearch}>Search</Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5" />
            Filters
            {(filters.state || filters.city || filters.categoryId || filters.minPrice !== undefined || filters.search) && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto">
                Clear All
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {/* State Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">State</label>
              <Select value={selectedState} onValueChange={handleStateChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {getAllStates().map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* City Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">City</label>
              <Select
                value={selectedCity}
                onValueChange={handleCityChange}
                disabled={!selectedState}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedState ? "Select city" : "Select state first"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {availableCities.map((city: string) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {/* Will be populated from API */}
                  <SelectItem value="1">Cleaning</SelectItem>
                  <SelectItem value="2">Plumbing</SelectItem>
                  <SelectItem value="3">Electrical</SelectItem>
                  <SelectItem value="4">AC Services</SelectItem>
                  <SelectItem value="5">Painting</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price Range Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Price Range (₹)</label>
              <Select value={priceRange} onValueChange={handlePriceRangeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Price</SelectItem>
                  <SelectItem value="0-500">Under ₹500</SelectItem>
                  <SelectItem value="500-1000">₹500 - ₹1,000</SelectItem>
                  <SelectItem value="1000-2000">₹1,000 - ₹2,000</SelectItem>
                  <SelectItem value="2000-5000">₹2,000 - ₹5,000</SelectItem>
                  <SelectItem value="5000-999999">Above ₹5,000</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div>
        <p className="text-sm text-muted-foreground mb-4">
          {total} {total === 1 ? "service" : "services"} found
        </p>

        {services.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No services found</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Try adjusting your filters or search query
              </p>
              <Button onClick={clearFilters}>Clear Filters</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Card
                key={service.id}
                className="hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => router.push(`/customer/services/${service.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {service.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{service.provider?.businessName || "Unknown Provider"}</p>
                    </div>
                    {service.provider?.isVerified && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 shrink-0">
                        ✓ Verified
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {service.description}
                  </p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{service.provider?.city || "N/A"}, {service.provider?.state || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{service.estimateDuration} mins</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{service.provider?.rating?.toFixed(1) || "0.0"}</span>
                      <span className="text-xs text-muted-foreground">
                        ({service.provider?.totalReviews || 0})
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold flex items-center">
                        <IndianRupee className="h-4 w-4" />
                        {service.price}
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">View Details</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > services.length && (
          <div className="flex justify-center gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Page {page} of {Math.ceil(total / 20)}
              </span>
            </div>
            <Button
              variant="outline"
              onClick={() => setPage((p) => p + 1)}
              disabled={page * 20 >= total}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
