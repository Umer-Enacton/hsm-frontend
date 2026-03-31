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

type CardVariant = "blue" | "emerald" | "red" | "purple" | "yellow" | "orange";

const variantStyles: Record<CardVariant, { card: string; icon: string; iconBg: string; title: string; value: string }> = {
  blue: {
    card: "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800",
    icon: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    title: "text-blue-700 dark:text-blue-400",
    value: "text-blue-900 dark:text-blue-100",
  },
  emerald: {
    card: "bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border-emerald-200 dark:border-emerald-800",
    icon: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
    title: "text-emerald-700 dark:text-emerald-400",
    value: "text-emerald-900 dark:text-emerald-100",
  },
  red: {
    card: "bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border-red-200 dark:border-red-800",
    icon: "text-red-600 dark:text-red-400",
    iconBg: "bg-red-100 dark:bg-red-900/30",
    title: "text-red-700 dark:text-red-400",
    value: "text-red-900 dark:text-red-100",
  },
  purple: {
    card: "bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 border-purple-200 dark:border-purple-800",
    icon: "text-purple-600 dark:text-purple-400",
    iconBg: "bg-purple-100 dark:bg-purple-900/30",
    title: "text-purple-700 dark:text-purple-400",
    value: "text-purple-900 dark:text-purple-100",
  },
  yellow: {
    card: "bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border-yellow-200 dark:border-yellow-800",
    icon: "text-yellow-600 dark:text-yellow-400",
    iconBg: "bg-yellow-100 dark:bg-yellow-900/30",
    title: "text-yellow-700 dark:text-yellow-400",
    value: "text-yellow-900 dark:text-yellow-100",
  },
  orange: {
    card: "bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200 dark:border-orange-800",
    icon: "text-orange-600 dark:text-orange-400",
    iconBg: "bg-orange-100 dark:bg-orange-900/30",
    title: "text-orange-700 dark:text-orange-400",
    value: "text-orange-900 dark:text-orange-100",
  },
};

export function ServiceStats({ stats }: ServiceStatsProps) {
  if (!stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 animate-pulse bg-muted rounded-md" />
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
          variant="blue"
        />
        <StatsCard
          title="Active"
          value={stats.active}
          icon={CheckCircle}
          variant="emerald"
        />
        <StatsCard
          title="Inactive"
          value={stats.inactive}
          icon={XCircle}
          variant="red"
        />
        <StatsCard
          title="Avg Price"
          value={`₹${stats.averagePrice || 0}`}
          icon={IndianRupee}
          variant="purple"
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
                  <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                    Total Bookings
                  </p>
                  <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                    {stats.totalBookings || 0}
                  </p>
                </div>
                <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-3">
                  <Calendar className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40 border-purple-200 dark:border-purple-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-700 dark:text-purple-400 font-medium">
                    Total Earnings (95%)
                  </p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    ₹
                    {totalRevenueInRupees.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-3">
                  <IndianRupee className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function StatsCard({
  title,
  value,
  icon: Icon,
  variant = "blue",
}: {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  variant?: CardVariant;
}) {
  const styles = variantStyles[variant];
  return (
    <Card className={styles.card}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${styles.title}`}>{title}</p>
            <p className={`text-2xl font-bold mt-1 ${styles.value}`}>
              {value}
            </p>
          </div>
          <div className={`rounded-full ${styles.iconBg} p-3`}>
            <Icon className={`h-6 w-6 ${styles.icon}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

