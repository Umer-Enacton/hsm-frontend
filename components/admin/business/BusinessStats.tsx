/**
 * Business Statistics Cards Component
 * Displays summary statistics for admin dashboard
 */

import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import type { BusinessStats as BusinessStatsType } from "@/lib/admin/business";

interface BusinessStatsProps {
  stats: BusinessStatsType | null;
}

export function BusinessStats({ stats }: BusinessStatsProps) {
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
        title="Total Businesses"
        value={stats.total}
        icon={Briefcase}
      />
      <StatsCard
        title="Pending Verification"
        value={stats.pending}
        icon={Clock}
      />
      <StatsCard
        title="Verified"
        value={stats.verified}
        icon={CheckCircle}
      />
      <StatsCard
        title="Suspended"
        value={stats.suspended}
        icon={AlertTriangle}
      />
    </div>
  );
}

function StatsCard({ title, value, icon: Icon }: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className="rounded-full bg-primary/10 p-3">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
