"use client";

import { TrendingUp, Star } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export interface ServiceData {
  serviceId: number;
  serviceName: string;
  bookingCount: number;
  totalRevenue: number;
  completedCount: number;
  avgRating: string;
  percentage: string;
}

export interface ServicesChartProps {
  data: ServiceData[];
  totalBookings: number;
}

const chartConfig = {
  bookings: {
    label: "Bookings",
    color: "hsl(var(--chart-3))", // Purple
  },
} satisfies ChartConfig;

export function ServicesChart({ data, totalBookings }: ServicesChartProps) {
  // Format currency
  const formatCurrency = (value: number) => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    }
    if (value >= 1000) {
      return `₹${(value / 1000).toFixed(1)}K`;
    }
    return `₹${value}`;
  };

  // Sort by booking count and take top 5
  const topServices = [...data].sort((a, b) => b.bookingCount - a.bookingCount).slice(0, 5);

  return (
    <Card className="shadow-lg hover:shadow-xl transition-all overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg sm:text-xl">Top Services</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Your most booked services and their performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <div className="min-w-[280px]">
            <ChartContainer config={chartConfig} className="h-[250px]">
              <BarChart
                accessibilityLayer
                data={topServices}
                layout="vertical"
                margin={{
                  left: 0,
                  right: 0,
                  top: 5,
                  bottom: 5,
                }}
              >
                <CartesianGrid horizontal={true} strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                  tick={{ fontSize: 10 }}
                />
                <YAxis
                  type="category"
                  dataKey="serviceName"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={80}
                  className="text-muted-foreground text-xs"
                  tickFormatter={(value) => (value.length > 10 ? `${value.slice(0, 10)}...` : value)}
                />
                <ChartTooltip
                  cursor={true}
                  content={<ChartTooltipContent />}
                />
                <Bar
                  dataKey="bookingCount"
                  fill="var(--color-bookings)"
                  radius={4}
                />
              </BarChart>
            </ChartContainer>
          </div>
        </div>

        {/* Service Details List */}
        <div className="space-y-2 sm:space-y-3 mt-4">
          {topServices.map((service, index) => (
            <div
              key={service.serviceId}
              className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs sm:text-sm font-bold flex-shrink-0">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-xs sm:text-sm truncate">{service.serviceName}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{service.bookingCount} bookings</span>
                    <span>•</span>
                    <span className="text-green-600 font-medium">
                      {formatCurrency(service.totalRevenue)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span className="font-medium">{service.avgRating}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
