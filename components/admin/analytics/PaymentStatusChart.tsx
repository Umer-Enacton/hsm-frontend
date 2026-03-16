"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Wallet, CheckCircle2, Clock, XCircle, RefreshCw } from "lucide-react";

export interface PaymentStatusData {
  status: string;
  statusLabel: string;
  count: number;
  amount: number;
  platformFees: number;
  percentage: string;
  fill: string;
}

export interface PaymentStatusChartProps {
  data: PaymentStatusData[];
  totalPayments: number;
  totalAmount: number;
  totalPlatformFees: number;
}

const statusIcons = {
  paid: CheckCircle2,
  pending: Clock,
  failed: XCircle,
  refunded: RefreshCw,
};

export function PaymentStatusChart({
  data,
  totalPayments,
  totalAmount,
  totalPlatformFees,
}: PaymentStatusChartProps) {
  const formatCurrency = (value: number) => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    }
    if (value >= 1000) {
      return `₹${(value / 1000).toFixed(1)}K`;
    }
    return `₹${value.toFixed(0)}`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const StatusIcon = statusIcons[item.status as keyof typeof statusIcons];
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            {StatusIcon && (
              <StatusIcon className="h-4 w-4" style={{ color: item.fill }} />
            )}
            <p className="text-sm font-medium">{item.statusLabel}</p>
          </div>
          <p className="text-sm" style={{ color: item.fill }}>
            Platform Fees: {formatCurrency(item.platformFees)}
          </p>
          <p className="text-xs text-muted-foreground">
            {item.count} payments ({item.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <Card className="shadow-lg hover:shadow-xl transition-all">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-purple-600" />
            Payment Status
          </CardTitle>
          <CardDescription>Payment distribution by status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No payment data available yet.</p>
            <p className="text-sm mt-1">
              Payment status breakdown will appear once payments are processed.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg hover:shadow-xl transition-all overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
          Payment Status
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Payment distribution by status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <div className="min-w-[280px]">
            <div className="h-[160px] sm:h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={false}
                    outerRadius={50}
                    fill="#8884d8"
                    dataKey="platformFees"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        {/* Payment Status Summary */}
        <div className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2">
          <h4 className="text-xs sm:text-sm font-medium text-muted-foreground">
            Payment Summary ({totalPayments} total)
          </h4>
          {data.map((status) => {
            const StatusIcon =
              statusIcons[status.status as keyof typeof statusIcons];
            return (
              <div
                key={status.status}
                className="flex items-center justify-between text-xs sm:text-sm"
              >
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {StatusIcon && (
                    <StatusIcon
                      className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0"
                      style={{ color: status.fill }}
                    />
                  )}
                  <span className="truncate">{status.statusLabel}</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-3">
                  <span className="text-muted-foreground text-[10px] sm:text-xs hidden sm:inline">
                    {status.count} payments
                  </span>
                  <span className="font-medium text-purple-600 text-[10px] sm:text-xs">
                    {formatCurrency(status.platformFees)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Totals */}
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t">
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">Total Amount</span>
            <span className="font-semibold">{formatCurrency(totalAmount)}</span>
          </div>
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">Platform Fees</span>
            <span className="font-semibold text-green-600">
              {formatCurrency(totalPlatformFees)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
