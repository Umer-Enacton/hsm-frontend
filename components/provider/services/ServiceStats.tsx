/**
 * Service Statistics Cards Component
 * Displays summary statistics for provider services
 */

import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, CheckCircle, XCircle, IndianRupee } from "lucide-react";
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

  return (
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
        value={`₹${stats.averagePrice}`}
        icon={IndianRupee}
      />
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
            <p className={`text-2xl font-bold mt-1 ${valueClassName}`}>{value}</p>
          </div>
          <div className="rounded-full bg-primary/10 p-3">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
