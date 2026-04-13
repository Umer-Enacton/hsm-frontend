"use client";

import { useState, useEffect } from "react";
import { api, API_ENDPOINTS } from "@/lib/api";
import { AdminPageHeader, StatCard, EmptyState } from "@/components/admin/shared";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  IndianRupee,
  TrendingUp,
  Clock,
  CheckCircle,
  Download,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Earning {
  id: number;
  amount: number;
  payoutStatus: "pending" | "processing" | "paid" | "failed";
  calculationType: string;
  bookingId: number;
  createdAt: string;
  payoutDate: string | null;
}

interface EarningsData {
  earnings: Earning[];
  totals: {
    totalEarnings: number;
    pendingPayout: number;
    paidAmount: number;
    completedBookings: number;
  };
}

export default function StaffEarningsPage() {
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month");

  useEffect(() => {
    fetchEarnings();
  }, [period]);

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ message: string; data: EarningsData }>(
        `${API_ENDPOINTS.STAFF_PAYOUTS_MY_EARNINGS}?period=${period}`
      );
      setEarningsData(response.data);
    } catch (error) {
      console.error("Error fetching earnings:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Earning["payoutStatus"]) => {
    switch (status) {
      case "paid":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400";
      case "pending":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400";
      case "processing":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400";
      case "failed":
        return "bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400";
      default:
        return "";
    }
  };

  const exportStatement = () => {
    if (!earningsData) return;

    const csvContent = [
      ["Date", "Amount (₹)", "Status", "Type"],
      ...earningsData.earnings.map((e) => [
        new Date(e.createdAt).toLocaleDateString(),
        (e.amount / 100).toFixed(2),
        e.payoutStatus,
        e.calculationType,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `earnings-${period}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Earnings"
        description="Track your earnings and payout history"
        actions={
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportStatement}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        }
        showRefresh={true}
        onRefresh={fetchEarnings}
      />

      {/* Summary Cards */}
      {earningsData?.totals && (
        <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4">
          <StatCard
            title="Total Earnings"
            value={`₹${(earningsData.totals.totalEarnings / 100).toFixed(2)}`}
            icon={Wallet}
            variant="purple"
          />
          <StatCard
            title="Pending Payout"
            value={`₹${(earningsData.totals.pendingPayout / 100).toFixed(2)}`}
            icon={Clock}
            variant="yellow"
          />
          <StatCard
            title="Paid Amount"
            value={`₹${(earningsData.totals.paidAmount / 100).toFixed(2)}`}
            icon={CheckCircle}
            variant="emerald"
          />
          <StatCard
            title="Completed Jobs"
            value={earningsData.totals.completedBookings}
            icon={IndianRupee}
            variant="blue"
          />
        </div>
      )}

      {/* Earnings List */}
      <Card>
        <CardHeader>
          <CardTitle>Earning History</CardTitle>
        </CardHeader>
        <CardContent>
          {!earningsData || earningsData.earnings.length === 0 ? (
            <EmptyState
              icon={IndianRupee}
              title="No earnings yet"
              description="Complete bookings to see your earnings here"
            />
          ) : (
            <div className="border rounded-md overflow-hidden bg-white dark:bg-[#2D2D2D]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-zinc-50 dark:bg-zinc-900/50">
                    <TableHead className="h-12 px-4 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Date
                    </TableHead>
                    <TableHead className="h-12 px-4 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Amount
                    </TableHead>
                    <TableHead className="h-12 px-4 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Status
                    </TableHead>
                    <TableHead className="h-12 px-4 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Type
                    </TableHead>
                    <TableHead className="h-12 px-4 text-right text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Payout Date
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {earningsData.earnings.map((earning) => (
                    <TableRow
                      key={earning.id}
                      className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                    >
                      <TableCell className="px-4 py-3">
                        {new Date(earning.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="px-4 py-3 font-medium">
                        ₹{(earning.amount / 100).toFixed(2)}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge
                          className={getStatusColor(earning.payoutStatus)}
                          variant="secondary"
                        >
                          {earning.payoutStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 capitalize">
                        {earning.calculationType}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        {earning.payoutDate
                          ? new Date(earning.payoutDate).toLocaleDateString()
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
