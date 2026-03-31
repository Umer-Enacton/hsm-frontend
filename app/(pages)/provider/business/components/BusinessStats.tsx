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
        <div className="flex items-center justify-between p-3 rounded-md bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Services</p>
              <p className="text-xs text-blue-700/70 dark:text-blue-400/70">Active offerings</p>
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.servicesCount}</div>
        </div>

        {/* Bookings */}
        <div className="flex items-center justify-between p-3 rounded-md bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
              <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-orange-900 dark:text-orange-100">Bookings</p>
              <p className="text-xs text-orange-700/70 dark:text-orange-400/70">All time</p>
            </div>
          </div>
          <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{stats.totalBookings}</div>
        </div>

        {/* Revenue */}
        <div className="flex items-center justify-between p-3 rounded-md bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">Revenue</p>
              <p className="text-xs text-emerald-700/70 dark:text-emerald-400/70">Total earnings</p>
            </div>
          </div>
          <div className="text-lg font-bold text-emerald-900 dark:text-emerald-100">
            PKR {stats.totalRevenue.toLocaleString()}
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center justify-between p-3 rounded-md bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-100 dark:border-yellow-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
              <Star className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">Rating</p>
              <p className="text-xs text-yellow-700/70 dark:text-yellow-400/70">
                {stats.totalReviews} review{stats.totalReviews !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
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
        <div className="rounded-md border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950 p-3">
          <p className="text-xs text-blue-900 dark:text-blue-100">
            💡 Stats will update once you start receiving bookings and reviews.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

