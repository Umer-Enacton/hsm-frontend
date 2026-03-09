"use client";

import { useState, useEffect, useMemo } from "react";
import { Loader2, Star, TrendingUp, MessageSquare, Eye, EyeOff, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { api, API_ENDPOINTS } from "@/lib/api";
import { toast } from "sonner";
import { ReviewCard, ReviewData } from "./ReviewCard";
import { ReviewFilters, ReviewFiltersData } from "./ReviewFilters";
import { cn } from "@/lib/utils";

interface ProviderReviewsManagerProps {
  businessId: number;
}

interface Service {
  id: number;
  name: string;
}

interface Stats {
  totalReviews: number;
  averageRating: number;
  visibleReviews: number;
  hiddenReviews: number;
  totalReplies: number;
}

export function ProviderReviewsManager({ businessId }: ProviderReviewsManagerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [filters, setFilters] = useState<ReviewFiltersData>({});
  const [stats, setStats] = useState<Stats>({
    totalReviews: 0,
    averageRating: 0,
    visibleReviews: 0,
    hiddenReviews: 0,
    totalReplies: 0,
  });

  useEffect(() => {
    loadData();
  }, [businessId]);

  useEffect(() => {
    if (services.length > 0) {
      loadReviews();
    }
  }, [filters, services]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([loadServices(), loadReviews()]);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load reviews");
    } finally {
      setIsLoading(false);
    }
  };

  const loadServices = async () => {
    try {
      const response = await api.get<{ services: Service[] }>(
        API_ENDPOINTS.SERVICES_BY_BUSINESS(businessId)
      );
      setServices(response.services || []);
    } catch (error) {
      console.error("Error loading services:", error);
    }
  };

  const loadReviews = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.rating) params.append("rating", filters.rating);
      if (filters.serviceId) params.append("serviceId", filters.serviceId);
      if (filters.isVisible !== undefined) params.append("isVisible", filters.isVisible.toString());
      if (filters.search) params.append("search", filters.search);

      const queryString = params.toString();
      const url = API_ENDPOINTS.FEEDBACK_BUSINESS(businessId) + (queryString ? `?${queryString}` : "");

      const response = await api.get<{ feedback: ReviewData[] }>(url);
      const reviewsData = response.feedback || [];
      setReviews(reviewsData);
      calculateStats(reviewsData);
    } catch (error) {
      console.error("Error loading reviews:", error);
      toast.error("Failed to load reviews");
    }
  };

  const calculateStats = (reviewsData: ReviewData[]) => {
    const totalReviews = reviewsData.length;
    const visibleReviews = reviewsData.filter((r) => r.isVisible).length;
    const hiddenReviews = totalReviews - visibleReviews;
    const totalReplies = reviewsData.filter((r) => r.providerReply).length;
    const averageRating =
      totalReviews > 0
        ? reviewsData.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

    setStats({
      totalReviews,
      averageRating,
      visibleReviews,
      hiddenReviews,
      totalReplies,
    });
  };

  const getServiceName = (serviceId: number) => {
    const service = services.find((s) => s.id === serviceId);
    return service?.name || `Service ${serviceId}`;
  };

  const renderStars = (rating: number, size: "sm" | "md" = "md") => {
    const sizeClass = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={cn(
          sizeClass,
          i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        )}
      />
    ));
  };

  const ratingDistribution = useMemo(() => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const rating = Math.round(r.rating);
      if (rating >= 1 && rating <= 5) {
        distribution[rating as keyof typeof distribution]++;
      }
    });
    return distribution;
  }, [reviews]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Average Rating */}
        <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border-yellow-200 dark:border-yellow-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
              <Star className="h-4 w-4" />
              Average Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">
                {stats.averageRating.toFixed(1)}
              </span>
              <span className="text-sm text-muted-foreground mb-1">/ 5</span>
            </div>
            <div className="flex mt-2">{renderStars(Math.round(stats.averageRating), "sm")}</div>
          </CardContent>
        </Card>

        {/* Total Reviews */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Total Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                {stats.totalReviews}
              </span>
              <div className="flex gap-1">
                <Badge variant="secondary" className="text-xs">
                  <Eye className="h-3 w-3 mr-1" />
                  {stats.visibleReviews}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  <EyeOff className="h-3 w-3 mr-1" />
                  {stats.hiddenReviews}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Replies */}
        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border-emerald-200 dark:border-emerald-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Your Replies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">
                {stats.totalReplies}
              </span>
              <span className="text-sm text-muted-foreground">
                {stats.totalReviews > 0
                  ? `${Math.round((stats.totalReplies / stats.totalReviews) * 100)}% response rate`
                  : "No reviews yet"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Response Rate Goal */}
        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-400 flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Response goal</span>
                <span className="font-medium">
                  {stats.totalReviews > 0
                    ? `${Math.round((stats.totalReplies / stats.totalReviews) * 100)}%`
                    : "0%"}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-500",
                    Math.round((stats.totalReplies / stats.totalReviews) * 100) >= 80
                      ? "bg-gradient-to-r from-emerald-500 to-green-500"
                      : Math.round((stats.totalReplies / stats.totalReviews) * 100) >= 50
                      ? "bg-gradient-to-r from-blue-500 to-indigo-500"
                      : "bg-gradient-to-r from-amber-500 to-orange-500"
                  )}
                  style={{
                    width: `${
                      stats.totalReviews > 0
                        ? (stats.totalReplies / stats.totalReviews) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rating Distribution */}
      {stats.totalReviews > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = ratingDistribution[rating as keyof typeof ratingDistribution];
                const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                return (
                  <div key={rating} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-16">
                      <span className="text-sm font-medium">{rating}</span>
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    </div>
                    <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <ReviewFilters
        filters={filters}
        onFiltersChange={setFilters}
        services={services}
        reviewCount={reviews.length}
      />

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">
                {Object.values(filters).some(Boolean)
                  ? "No reviews match your filters"
                  : "No reviews yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              serviceName={getServiceName(review.serviceId)}
              onUpdate={loadReviews}
            />
          ))
        )}
      </div>
    </div>
  );
}
