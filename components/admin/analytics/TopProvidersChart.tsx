"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export interface ProviderData {
  providerId: number;
  providerName: string;
  businessName: string;
  bookingCount: number;
  totalRevenue: number;
  platformFees: number;
  percentage: string;
}

export interface TopProvidersChartProps {
  data: ProviderData[];
  totalPlatformFees: number;
}

const formatCurrencyDetailed = (value: number | null | undefined) => {
  if (value == null || isNaN(value)) {
    return '₹0';
  }
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`;
  }
  if (value >= 1000) {
    return `₹${(value / 1000).toFixed(1)}K`;
  }
  return `₹${Number(value).toFixed(2)}`;
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium">{data.fullName}</p>
        <p className="text-xs text-muted-foreground">{data.businessName}</p>
        <p className="text-sm text-green-600">
          Platform Fees: {formatCurrencyDetailed(data.platformFees)}
        </p>
        <p className="text-xs text-muted-foreground">
          {data.bookingCount} bookings ({data.percentage}%)
        </p>
      </div>
    );
  }
  return null;
};

export function TopProvidersChart({ data, totalPlatformFees }: TopProvidersChartProps) {
  const formatCurrency = (value: number | null | undefined) => {
    if (value == null || isNaN(value)) {
      return '₹0';
    }
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    }
    if (value >= 1000) {
      return `₹${(value / 1000).toFixed(1)}K`;
    }
    return `₹${Number(value).toFixed(2)}`;
  };

  // Prepare data for bar chart
  const chartData = data.map((item) => ({
    name: item.providerName.length > 15 ? item.providerName.substring(0, 15) + "..." : item.providerName,
 fullName: item.providerName,
    businessName: item.businessName,
    platformFees: item.platformFees,
    bookingCount: item.bookingCount,
    percentage: item.percentage,
  }));

  if (data.length === 0) {
    return (
      <Card className="shadow-lg hover:shadow-xl transition-all">
        <CardHeader>
          <CardTitle>Top Providers</CardTitle>
          <CardDescription>Highest earning providers for the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No provider data available yet.</p>
            <p className="text-sm mt-1">
              Provider rankings will appear once payments are processed.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Purple gradient for bars
  const BAR_COLOR = "#a855f7";

  return (
    <Card className="shadow-lg hover:shadow-xl transition-all overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
          Top Providers
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">Highest earning providers by platform fee contribution</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <div className="min-w-[280px]">
            <div className="h-[200px] sm:h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{
                    top: 5,
                    right: 30,
                    left: 10,
                    bottom: 5,
                  }}
                >
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={formatCurrency}
                    tick={{ fill: "#64748b", fontSize: 10 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    width={80}
                  />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="platformFees" fill={BAR_COLOR} radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={BAR_COLOR} fillOpacity={0.8 + (index * 0.02)} />
                ))}
              </Bar>
            </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Provider breakdown list */}
        <div className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2">
          <h4 className="text-xs sm:text-sm font-medium text-muted-foreground">
            Top {data.length} Providers by Platform Fees
          </h4>
          {data.map((provider, index) => (
            <div key={provider.providerId} className="flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                <span className="text-muted-foreground font-mono text-[10px] sm:text-xs flex-shrink-0">#{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{provider.providerName}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{provider.businessName}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
                <span className="text-muted-foreground text-[10px] sm:text-xs hidden sm:inline">{provider.bookingCount} bookings</span>
                <span className="font-medium text-purple-600 text-[10px] sm:text-xs">{formatCurrency(provider.platformFees)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium">Total Platform Fees from Top {data.length}</span>
            <span className="text-base sm:text-lg font-bold text-purple-600">{formatCurrency(totalPlatformFees)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
