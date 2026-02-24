/**
 * Slot Statistics Cards Component
 * Displays summary statistics for availability management
 */

import { Card, CardContent } from "@/components/ui/card";
import { Clock, Calendar, TrendingUp, Activity } from "lucide-react";
import type { SlotStats } from "@/lib/provider/slots";

interface SlotStatsProps {
  stats: SlotStats | null;
}

export function SlotStats({ stats }: SlotStatsProps) {
  if (!stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 animate-pulse bg-muted rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Slots"
        value={stats.totalSlots}
        icon={Clock}
        description="Time templates"
      />
      <StatsCard
        title="Active Slots"
        value={stats.activeSlots}
        icon={Activity}
        description="Available for booking"
      />
      <StatsCard
        title="Today's Bookings"
        value={stats.todayBookings}
        icon={Calendar}
        description="Bookings today"
      />
      <StatsCard
        title="Utilization"
        value={`${stats.utilizationRate}%`}
        icon={TrendingUp}
        description="Coverage rate"
      />
    </div>
  );
}

function StatsCard({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
          <div className="rounded-full bg-primary/10 p-3">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
