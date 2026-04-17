"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Search,
  SlidersHorizontal,
  Star,
  MapPin,
  IndianRupee,
  Clock,
  X,
  ArrowRight,
  List,
  Grid3x3,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { useCategories, useCustomerServices } from "@/lib/queries";
import type { CustomerService, ServiceFilters } from "@/types/customer";
import { getAllStates, getCitiesByState } from "@/lib/data/india-locations";
import { cn } from "@/lib/utils";
import { ServiceImage, DataTablePagination } from "@/components/common";

// Types
type ViewMode = "grid" | "list";
interface CategoryData {
  id: number;
  name: string;
  description: string;
  image: string | null;
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export default function CustomerServicesPage() {
  const router = useRouter();

  // Loading states - SIMPLIFIED (no full-page loader)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Filters
  const [filterState, setFilterState] = useState({
    state: "all",
    city: "all",
    category: "all",
    priceRange: [0, 10000] as [number, number],
    search: "",
  });

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [page, setPage] = useState(1);

  // Derived values - memoized for performance
  const availableCities = useMemo(() => {
    if (!filterState.state || filterState.state === "all") return [];
    return getCitiesByState(filterState.state);
  }, [filterState.state]);

  // Debounce inputs to prevent excessive API calls
  const debouncedSearch = useDebounce(filterState.search, 600);
  const debouncedPriceRange = useDebounce(filterState.priceRange, 600);

  // Filters object - stable reference
  const filters = useMemo<ServiceFilters>(
    () => ({
      state: filterState.state === "all" ? undefined : filterState.state,
      city: filterState.city === "all" ? undefined : filterState.city,
      categoryId:
        filterState.category === "all"
          ? undefined
          : parseInt(filterState.category),
      minPrice:
        debouncedPriceRange[0] === 0 ? undefined : debouncedPriceRange[0],
      maxPrice:
        debouncedPriceRange[1] === 10000 ? undefined : debouncedPriceRange[1],
      search: debouncedSearch.trim() || undefined,
    }),
    [filterState, debouncedSearch, debouncedPriceRange],
  );

  // Use cached query hooks instead of direct API calls
  const { data: categoriesData, isLoading: isLoadingCategories } =
    useCategories();
  const categories = categoriesData?.categories || [];

  const {
    data: servicesData,
    isLoading: isLoadingServices,
    isFetching: isRefetching,
  } = useCustomerServices(filters, page);
  const services = servicesData?.data || [];
  const pagination = servicesData?.pagination;

  // Mark first load as complete
  useEffect(() => {
    if (!isLoadingServices) {
      setHasLoadedOnce(true);
    }
  }, [isLoadingServices]);

  const isLoading = isLoadingServices;
  const showSkeleton = !hasLoadedOnce || isLoading;

  // Filter handlers - OPTIMIZED to single setState
  const updateFilter = useCallback(
    <K extends keyof typeof filterState>(
      key: K,
      value: (typeof filterState)[K],
    ) => {
      setFilterState((prev) => ({ ...prev, [key]: value })); // Single update
      setPage(1); // Reset to page 1 when filter changes
    },
    [],
  );

  const handleStateChange = useCallback((state: string) => {
    setFilterState((prev) => ({ ...prev, state, city: "all" }));
    setPage(1); // Reset to page 1 when state changes
  }, []);

  const clearFilters = useCallback(() => {
    setFilterState({
      state: "all",
      city: "all",
      category: "all",
      priceRange: [0, 10000],
      search: "",
    });
    setPage(1);
  }, []);

  const clearSingleFilter = useCallback((key: keyof ServiceFilters) => {
    setFilterState((prev) => {
      const updates: Partial<typeof filterState> = {};
      switch (key) {
        case "search":
          updates.search = "";
          break;
        case "state":
          updates.state = "all";
          updates.city = "all";
          break;
        case "city":
          updates.city = "all";
          break;
        case "categoryId":
          updates.category = "all";
          break;
        case "minPrice":
        case "maxPrice":
          updates.priceRange = [0, 10000];
          break;
      }
      return { ...prev, ...updates };
    });
    setPage(1); // Reset to page 1 when clearing filter
  }, []);

  // Reset to page 1 when filters change
  useMemo(() => {
    setPage(1);
  }, [filters]);

  // Computed values
  const hasActiveFilters = useMemo(() => {
    return !!(
      filters.state ||
      filters.city ||
      filters.categoryId ||
      filters.minPrice !== undefined ||
      filters.maxPrice !== undefined ||
      filters.search
    );
  }, [filters]);

  // ==============================================================================
  // RENDER - NO EARLY RETURN, ALWAYS FULL LAYOUT
  // ==============================================================================
  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header - ALWAYS VISIBLE */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Browse Services
          </h1>
          <p className="text-muted-foreground">
            Find and book home services from verified providers
          </p>
        </div>

        {/* Search Bar - ALWAYS VISIBLE */}
        <div className="mb-6">
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-7xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search services..."
                value={filterState.search}
                onChange={(e) => updateFilter("search", e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <Button
              onClick={() => updateFilter("search", filterState.search)}
              className="h-11 px-6"
            >
              Search
            </Button>
            <Button
              variant="outline"
              className="h-11 md:hidden"
              onClick={() => setIsMobileFilterOpen(true)}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Active Filters - ALWAYS VISIBLE */}
        {hasActiveFilters && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {filters.search && (
              <Badge variant="secondary" className="gap-1">
                "{filters.search}"
                <button
                  onClick={() => clearSingleFilter("search")}
                  className="hover:bg-background/50 rounded p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.categoryId && (
              <Badge variant="secondary" className="gap-1">
                {categories.find((c) => c.id === filters.categoryId)?.name ||
                  `Category ${filters.categoryId}`}
                <button
                  onClick={() => clearSingleFilter("categoryId")}
                  className="hover:bg-background/50 rounded p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.state && (
              <Badge variant="secondary" className="gap-1">
                {filters.state}
                <button
                  onClick={() => clearSingleFilter("state")}
                  className="hover:bg-background/50 rounded p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.city && (
              <Badge variant="secondary" className="gap-1">
                {filters.city}
                <button
                  onClick={() => clearSingleFilter("city")}
                  className="hover:bg-background/50 rounded p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {(filters.minPrice !== undefined ||
              filters.maxPrice !== undefined) && (
              <Badge variant="secondary" className="gap-1">
                ₹{filters.minPrice || 0} - ₹{filters.maxPrice || "10k+"}
                <button
                  onClick={() => clearSingleFilter("minPrice")}
                  className="hover:bg-background/50 rounded p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-7 text-xs"
            >
              Clear All
            </Button>
          </div>
        )}

        {/* Main Layout - ALWAYS VISIBLE */}
        <div className="flex gap-6">
          {/* Filters Sidebar - ALWAYS VISIBLE */}
          <aside className="hidden md:block w-64 shrink-0">
            <div className="sticky top-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">Filters</span>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-7 text-xs"
                  >
                    Clear
                  </Button>
                )}
              </div>

              {/* Location */}
              <div className="space-y-3 rounded-md border p-4">
                <span className="text-xs font-semibold uppercase text-muted-foreground">
                  Location
                </span>
                <div className="space-y-2">
                  <Select
                    value={filterState.state}
                    onValueChange={handleStateChange}
                  >
                    <SelectTrigger className="w-full h-9 text-sm">
                      <SelectValue placeholder="State" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All States</SelectItem>
                      {getAllStates()
                        .slice(0, 10)
                        .map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {filterState.state && filterState.state !== "all" && (
                    <Select
                      value={filterState.city}
                      onValueChange={(c) => updateFilter("city", c)}
                    >
                      <SelectTrigger className="w-full h-9 text-sm">
                        <SelectValue placeholder="City" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Cities</SelectItem>
                        {availableCities.slice(0, 20).map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              {/* Category */}
              <div className="space-y-3 rounded-md border p-4">
                <span className="text-xs font-semibold uppercase text-muted-foreground">
                  Category
                </span>
                {isLoadingCategories ? (
                  <div className="h-9 flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  <Select
                    value={filterState.category}
                    onValueChange={(c) => updateFilter("category", c)}
                  >
                    <SelectTrigger className="w-full h-9 text-sm">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Price */}
              <div className="space-y-3 rounded-md border p-4">
                <span className="text-xs font-semibold uppercase text-muted-foreground">
                  Price Range
                </span>
                <Slider
                  min={0}
                  max={10000}
                  step={100}
                  value={filterState.priceRange}
                  onValueChange={(v) =>
                    updateFilter("priceRange", v as [number, number])
                  }
                  className="py-3"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>₹{filterState.priceRange[0]}</span>
                  <span>₹{filterState.priceRange[1]}</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Services Section - ONLY THIS AREA SHOWS SKELETON */}
          <div className="flex-1 min-w-0">
            {/* Toolbar - ALWAYS VISIBLE */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b">
              <span className="text-sm text-muted-foreground">
                Showing <span className="font-medium">{services.length}</span>{" "}
                of <span className="font-medium">{pagination?.total || 0}</span>{" "}
                services
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-8 w-8 p-0"
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="h-8 w-8 p-0"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* ==============================================================================
              SERVICES CONTENT - SKELETON ONLY HERE, NEVER FULL PAGE LOADER
            ============================================================================== */}
            {showSkeleton ? (
              viewMode === "grid" ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i} className="p-2.5">
                      <CardContent className="p-4 space-y-3">
                        <div className="h-5 bg-muted rounded w-3/4 animate-pulse" />
                        <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
                        <div className="h-3 bg-muted rounded w-full animate-pulse" />
                        <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
                        <div className="flex justify-between items-center pt-2">
                          <div className="h-6 bg-muted rounded w-16 animate-pulse" />
                          <div className="h-8 bg-muted rounded w-20 animate-pulse" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="p-0">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="h-5 bg-muted rounded w-1/2 animate-pulse" />
                          <div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
                          <div className="h-3 bg-muted rounded w-full animate-pulse" />
                          <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
                          <div className="flex justify-between items-center">
                            <div className="h-4 bg-muted rounded w-24 animate-pulse" />
                            <div className="h-8 bg-muted rounded w-28 animate-pulse" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )
            ) : services.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="font-semibold mb-2">No services found</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Try adjusting your filters
                  </p>
                  <Button onClick={clearFilters}>Clear Filters</Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Grid View */}
                {viewMode === "grid" && (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {services.map((service) => (
                      <Card
                        key={service.id}
                        className="group hover:border-primary/50 p-0 hover:shadow-md transition-all cursor-pointer overflow-hidden"
                        onClick={() =>
                          router.push(`/customer/services/${service.id}`)
                        }
                      >
                        {/* Service Image */}
                        <img src={service.image} alt={service.name} />
                        {/* Verified Badge overlay */}
                        {service.provider?.isVerified && (
                          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full shadow-sm">
                            ✓ Verified
                          </div>
                        )}

                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                                {service.name}
                              </h3>
                              <p className="text-xs text-muted-foreground truncate">
                                {service.provider?.businessName || "Provider"}
                              </p>
                            </div>
                          </div>

                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {service.description}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium text-foreground">
                                {Number(service.rating || 0).toFixed(1)}
                              </span>
                              <span className="text-muted-foreground">
                                ({service.totalReviews || 0})
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">
                                {service.provider?.city || "N/A"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{service.estimateDuration || 30}m</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t">
                            <div>
                              <span className="text-lg font-bold flex items-center">
                                <IndianRupee className="h-4 w-4" />
                                {service.price}
                              </span>
                            </div>
                            <Button size="sm" className="h-8">
                              View
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* List View - CLEAN & MINIMAL REDESIGN */}
                {viewMode === "list" && (
                  <div className="space-y-2">
                    {services.map((service) => (
                      <Card
                        key={service.id}
                        className="group hover:border-primary/50 transition-colors cursor-pointer border-border/50 overflow-hidden"
                        onClick={() =>
                          router.push(`/customer/services/${service.id}`)
                        }
                      >
                        <CardContent className="p-0">
                          <div className="flex items-start">
                            {/* Thumbnail Image */}
                            <div className="relative h-24 w-24 sm:h-32 sm:w-32 shrink-0 bg-muted">
                              <ServiceImage
                                src={service.image || service.imageUrl}
                                alt={service.name}
                                className="w-full h-full"
                              />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 p-4 space-y-2">
                              {/* Title & Provider */}
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-base group-hover:text-primary transition-colors">
                                    {service.name}
                                  </h3>
                                  {service.provider?.isVerified && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs h-5 px-2 border-green-200 text-green-700"
                                    >
                                      Verified
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                  <Building2 className="h-3.5 w-3.5" />
                                  <span>
                                    {service.provider?.businessName ||
                                      "Service Provider"}
                                  </span>
                                </div>
                              </div>

                              {/* Description */}
                              <p className="text-sm text-muted-foreground line-clamp-1 pr-32">
                                {service.description}
                              </p>

                              {/* Meta - Clean inline */}
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                                  <span className="font-medium text-foreground">
                                    {Number(service.rating || 0).toFixed(1)}
                                  </span>
                                  <span className="text-muted-foreground">
                                    ({service.totalReviews || 0})
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5" />
                                  <span>{service.provider?.city || "N/A"}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  <span>
                                    {service.estimateDuration || 30}min
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Right - Price & CTA */}
                            <div className="shrink-0 p-4 text-right space-y-2">
                              <div>
                                <span className="text-xl font-semibold flex items-center justify-end">
                                  <IndianRupee className="h-4 w-4" />
                                  {service.price}
                                </span>
                              </div>
                              <Button size="sm" className="gap-1.5 h-9">
                                View
                                <ArrowRight className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Pagination - Always show */}
                {pagination && (
                  <div className="mt-6 pt-4 border-t">
                    <DataTablePagination
                      currentPage={pagination.page}
                      totalPages={pagination.totalPages}
                      totalItems={pagination.total}
                      pageSize={pagination.limit}
                      onPageChange={(newPage) => {
                        setPage(newPage);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Bottom Sheet */}
      {isMobileFilterOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 top-16 z-50 md:hidden bg-background rounded-t-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between p-4 border-b">
              <span className="font-semibold">Filters</span>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileFilterOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase text-muted-foreground">
                  Location
                </span>
                <Select
                  value={filterState.state}
                  onValueChange={handleStateChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {getAllStates()
                      .slice(0, 10)
                      .map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {filterState.state && filterState.state !== "all" && (
                  <Select
                    value={filterState.city}
                    onValueChange={(c) => updateFilter("city", c)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="City" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Cities</SelectItem>
                      {availableCities.slice(0, 20).map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase text-muted-foreground">
                  Category
                </span>
                {isLoadingCategories ? (
                  <div className="h-10 flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  <Select
                    value={filterState.category}
                    onValueChange={(c) => updateFilter("category", c)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase text-muted-foreground">
                  Price Range
                </span>
                <Slider
                  min={0}
                  max={10000}
                  step={100}
                  value={filterState.priceRange}
                  onValueChange={(v) =>
                    updateFilter("priceRange", v as [number, number])
                  }
                  className="py-3"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>₹{filterState.priceRange[0]}</span>
                  <span>₹{filterState.priceRange[1]}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t">
              <Button
                className="w-full"
                onClick={() => setIsMobileFilterOpen(false)}
              >
                Show Results ({pagination?.total || 0})
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
