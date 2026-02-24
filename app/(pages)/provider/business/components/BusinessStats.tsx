"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Calendar, DollarSign, Star } from "lucide-react";

interface BusinessStatsProps {
  business: any;
}

export function BusinessStats({ business }: BusinessStatsProps) {
  // Mock stats for now - in production, fetch from API
  const stats = {
    servicesCount: 0,
    totalBookings: 0,
    totalRevenue: 0,
    averageRating: business.rating || 0,
    totalReviews: business.totalReviews || 0,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Statistics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Services */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Package className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Services</p>
              <p className="text-xs text-muted-foreground">Active offerings</p>
            </div>
          </div>
          <div className="text-2xl font-bold">{stats.servicesCount}</div>
        </div>

        {/* Bookings */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Bookings</p>
              <p className="text-xs text-muted-foreground">All time</p>
            </div>
          </div>
          <div className="text-2xl font-bold">{stats.totalBookings}</div>
        </div>

        {/* Revenue */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Revenue</p>
              <p className="text-xs text-muted-foreground">Total earnings</p>
            </div>
          </div>
          <div className="text-lg font-bold">
            PKR {stats.totalRevenue.toLocaleString()}
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Star className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Rating</p>
              <p className="text-xs text-muted-foreground">
                {stats.totalReviews} review{stats.totalReviews !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className="text-2xl font-bold">
              {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "-"}
            </div>
            <div className="flex text-yellow-400 text-sm">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i <= Math.floor(stats.averageRating)
                      ? "fill-yellow-400"
                      : "fill-transparent"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950 p-3">
          <p className="text-xs text-blue-900 dark:text-blue-100">
            💡 Stats will update once you start receiving bookings and reviews.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
