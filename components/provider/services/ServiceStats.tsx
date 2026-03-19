/**
 * Service Statistics Cards Component
 * Displays summary statistics for provider services
 */

import { Card, CardContent } from "@/components/ui/card";
import {
  Briefcase,
  CheckCircle,
  XCircle,
  IndianRupee,
  Calendar,
} from "lucide-react";
import type { ServiceStats } from "@/lib/provider/services";

interface ServiceStatsProps {
  stats: ServiceStats | null;
}

export function ServiceStats({ stats }: ServiceStatsProps) {
  if (!stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 animate-pulse bg-muted rounded-lg" />
        ))}
      </div>
    );
  }

  // Convert revenue from paise to rupees
  const totalRevenueInRupees = (stats.totalRevenue || 0) / 100;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Services"
          value={stats.total}
          icon={Briefcase}
        />
        <StatsCard
          title="Active"
          value={stats.active}
          icon={CheckCircle}
          valueClassName="text-green-600"
        />
        <StatsCard
          title="Inactive"
          value={stats.inactive}
          icon={XCircle}
          valueClassName="text-gray-600"
        />
        <StatsCard
          title="Avg Price"
          value={`₹${stats.averagePrice || 0}`}
          icon={IndianRupee}
        />
      </div>

      {/* Additional stats from backend */}
      {(stats.totalBookings !== undefined ||
        stats.totalRevenue !== undefined) && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40 border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Bookings
                  </p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                    {stats.totalBookings || 0}
                  </p>
                </div>
                <div className="rounded-full bg-green-100 p-3">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40 border-purple-200 dark:border-purple-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Earnings (95%)
                  </p>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                    ₹
                    {totalRevenueInRupees.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div className="rounded-full bg-purple-100 p-3">
                  <IndianRupee className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Per-service breakdown */}
      {/* {stats.services && stats.services.length > 0 && (
        <Card className="p-0">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Earnings by Service</h3>
            <div className="space-y-3">
              {stats.services
                .filter((s) => s.totalBookings > 0)
                .sort((a, b) => b.revenue - a.revenue)
                .map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{service.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {service.totalBookings} booking
                        {service.totalBookings !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        ₹
                        {(service.revenue / 100).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              {stats.services.filter((s) => s.totalBookings > 0).length ===
                0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No bookings yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )} */}
    </div>
  );
}

function StatsCard({
  title,
  value,
  icon: Icon,
  valueClassName = "",
}: {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  valueClassName?: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold mt-1 ${valueClassName}`}>
              {value}
            </p>
          </div>
          <div className="rounded-full bg-primary/10 p-3">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
