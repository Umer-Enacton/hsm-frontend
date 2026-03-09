"use client";

import { useState } from "react";
import { Search, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export interface ReviewFiltersData {
  rating?: string;
  serviceId?: string;
  isVisible?: boolean;
  search?: string;
}

interface ReviewFiltersProps {
  filters: ReviewFiltersData;
  onFiltersChange: (filters: ReviewFiltersData) => void;
  services?: Array<{ id: number; name: string }>;
  reviewCount?: number;
}

const ratingOptions = [
  { value: "5", label: "5 Stars Only" },
  { value: "4", label: "4+ Stars" },
  { value: "3", label: "3+ Stars" },
  { value: "2", label: "2+ Stars" },
  { value: "1", label: "1+ Stars" },
];

const visibilityOptions = [
  { value: "all", label: "All Reviews" },
  { value: "visible", label: "Visible Only" },
  { value: "hidden", label: "Hidden Only" },
];

export function ReviewFilters({
  filters,
  onFiltersChange,
  services = [],
  reviewCount = 0,
}: ReviewFiltersProps) {
  const [open, setOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<ReviewFilters>(filters);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    setOpen(false);
  };

  const handleClearFilters = () => {
    const cleared: ReviewFilters = {};
    setLocalFilters(cleared);
    onFiltersChange(cleared);
    setOpen(false);
  };

  const updateFilter = <K extends keyof ReviewFilters>(
    key: K,
    value: ReviewFilters[K],
  ) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px] max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search reviews..."
          value={filters.search || ""}
          onChange={(e) => updateFilter("search", e.target.value)}
          onBlur={() =>
            onFiltersChange({ ...filters, search: localFilters.search })
          }
          className="pl-9"
        />
      </div>

      {/* Filter Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Reviews
            </DialogTitle>
            <DialogDescription>
              {reviewCount} review{reviewCount !== 1 ? "s" : ""} found
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Rating Filter */}
            <div className="space-y-2">
              <Label>Minimum Rating</Label>
              <Select
                value={localFilters.rating || "all"}
                onValueChange={(value) =>
                  updateFilter("rating", value === "all" ? undefined : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All ratings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <Separator className="my-1" />
                  {ratingOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Service Filter */}
            {services.length > 0 && (
              <div className="space-y-2">
                <Label>Service</Label>
                <Select
                  value={localFilters.serviceId || "all"}
                  onValueChange={(value) =>
                    updateFilter(
                      "serviceId",
                      value === "all" ? undefined : value,
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All services" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Services</SelectItem>
                    <Separator className="my-1" />
                    {services.map((service) => (
                      <SelectItem
                        key={service.id}
                        value={service.id.toString()}
                      >
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Visibility Filter */}
            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select
                value={
                  localFilters.isVisible === true
                    ? "visible"
                    : localFilters.isVisible === false
                      ? "hidden"
                      : "all"
                }
                onValueChange={(value) => {
                  if (value === "all") {
                    updateFilter("isVisible", undefined);
                  } else {
                    updateFilter("isVisible", value === "visible");
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All reviews" />
                </SelectTrigger>
                <SelectContent>
                  {visibilityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Active Filters Display */}
            {activeFilterCount > 0 && (
              <div className="pt-2">
                <Separator className="mb-3" />
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-muted-foreground">
                    Active:
                  </span>
                  {filters.rating && (
                    <Badge variant="secondary" className="gap-1">
                      {filters.rating}+ stars
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-foreground"
                        onClick={() => updateFilter("rating", undefined)}
                      />
                    </Badge>
                  )}
                  {filters.serviceId && (
                    <Badge variant="secondary" className="gap-1">
                      Service
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-foreground"
                        onClick={() => updateFilter("serviceId", undefined)}
                      />
                    </Badge>
                  )}
                  {filters.isVisible !== undefined && (
                    <Badge variant="secondary" className="gap-1">
                      {filters.isVisible ? "Visible" : "Hidden"}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-foreground"
                        onClick={() => updateFilter("isVisible", undefined)}
                      />
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleClearFilters}
              disabled={activeFilterCount === 0}
            >
              Clear All
            </Button>
            <Button
              onClick={handleApplyFilters}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Single Filter Buttons */}
      {activeFilterCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Clear all
        </Button>
      )}
    </div>
  );
}
