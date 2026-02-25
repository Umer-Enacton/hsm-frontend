/**
 * Business Statistics Cards Component
 * Displays summary statistics for admin dashboard
 */

import { StatCard } from "@/components/admin/shared";
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
    <div className="grid gap-4 md:grid-cols-3">
      <StatCard
        title="Total Businesses"
        value={stats.total}
        change={`${stats.pending} pending verification`}
        icon={Briefcase}
      />
      <StatCard
        title="Verified"
        value={stats.verified}
        change={`${Math.round((stats.verified / stats.total) * 100)}% of total`}
        icon={CheckCircle}
        trend="up"
      />
      <StatCard
        title="Pending Verification"
        value={stats.pending}
        icon={Clock}
        trend="neutral"
      />
    </div>
  );
}
