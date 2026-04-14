"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  Users,
  TrendingUp,
  CreditCard,
  IndianRupee,
  Calendar as CalendarIcon,
  RefreshCw,
  Ban,
  Power,
  ArrowUpDown,
  CalendarPlus,
  RotateCcw,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { api, API_ENDPOINTS } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AdminPageHeader,
  StatCard,
  EmptyState,
  ErrorState,
  LoadingState,
  StatusBadge,
} from "@/components/admin/shared";
import { AdminProviderSubscriptionsSkeleton } from "@/components/admin/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/use-debounce";

interface ProviderSubscription {
  id: number;
  providerId: number;
  providerName: string;
  providerEmail: string;
  providerBusiness?: string;
  planId: number;
  planName: string;
  planPlatformFeePercentage: number;
  status: "active" | "trial" | "cancelled" | "expired" | "completed" | "pending_payment";
  startDate: string;
  endDate: string | null;
  trialEndDate: string | null;
  billingCycle: "monthly" | "yearly";
  autoRenew: boolean;
  cancelAtPeriodEnd: boolean;
  amountPaid: number;
  platformFeeAtPurchase: number;
  razorpaySubscriptionId: string | null;
}

interface SubscriptionDetail {
  subscription: ProviderSubscription;
  usage?: {
    currentMonthBookings: number;
    maxBookings: number | null;
    remainingBookings: number | null;
    limitReached: boolean;
  };
  paymentHistory?: Array<{
    id: number;
    amount: number;
    status: string;
    paymentDate: string;
  }>;
}

export default function AdminProviderSubscriptionsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Admin action states
  const [actionLoading, setActionLoading] = useState(false);
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [extendDays, setExtendDays] = useState(30);
  const [changePlanDialogOpen, setChangePlanDialogOpen] = useState(false);
  const [selectedForAction, setSelectedForAction] = useState<ProviderSubscription | null>(null);
  const [confirmDialogAction, setConfirmDialogAction] = useState<"cancel" | "renew" | "refund" | null>(null);

  // Debounce search to avoid excessive re-renders
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch subscriptions with TanStack Query
  const { data: subscriptions = [], isLoading: loading, error, refetch: fetchSubscriptions } = useQuery({
    queryKey: ["admin-provider-subscriptions"],
    queryFn: async () => {
      const response = await api.get<{ message: string; data: ProviderSubscription[] }>(
        API_ENDPOINTS.PROVIDER_SUBSCRIPTION_ALL
      );
      return response?.data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch subscription details
  const fetchSubscriptionDetails = async (providerId: number) => {
    try {
      setDetailLoading(true);

      // Find the subscription from our loaded data
      const subscription = subscriptions.find((s) => s.providerId === providerId);

      if (!subscription) {
        throw new Error("Subscription not found");
      }

      // For now, just show the subscription data we have
      setSelectedSubscription({
        subscription,
        usage: {
          currentMonthBookings: 0,
          maxBookings: subscription.planName === "Free" ? 100 : subscription.planName === "Pro" ? 500 : null,
          remainingBookings: subscription.planName === "Free" ? 100 : subscription.planName === "Pro" ? 500 : null,
          limitReached: false,
        },
        paymentHistory: [],
      });
    } catch (err: any) {
      console.error("Error fetching subscription details:", err);
      toast.error(err?.message || "Failed to load subscription details");
    } finally {
      setDetailLoading(false);
    }
  };

  // Removed manual useEffect fetching as useQuery handles it

  // Filter subscriptions
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((sub) => {
      const matchesSearch =
        !debouncedSearch ||
        sub.providerName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        sub.providerEmail?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        sub.providerBusiness?.toLowerCase().includes(debouncedSearch.toLowerCase());

      const matchesStatus = statusFilter === "all" || sub.status === statusFilter;
      const matchesPlan = planFilter === "all" || sub.planName === planFilter;

      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [subscriptions, debouncedSearch, statusFilter, planFilter]);

  // Get unique plan names for filter
  const planNames = useMemo(() => {
    return Array.from(new Set(subscriptions.map((s) => s.planName))).sort();
  }, [subscriptions]);

  // Calculate stats
  const stats = useMemo(() => ({
    total: subscriptions.length,
    active: subscriptions.filter((s) => s.status === "active").length,
    trial: subscriptions.filter((s) => s.status === "trial").length,
    cancelled: subscriptions.filter((s) => s.status === "cancelled").length,
    monthlyRevenue: subscriptions
      .filter((s) => s.status === "active" && s.billingCycle === "monthly")
      .reduce((sum, s) => sum + (s.amountPaid || 0), 0),
  }), [subscriptions]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (amountInPaise: number) => {
    return `₹${(amountInPaise / 100).toFixed(2)}`;
  };

  const getStatusVariant = (status: string): "active" | "trial" | "cancelled" | "blocked" | "pending" => {
    switch (status) {
      case "active":
        return "active";
      case "trial":
        return "trial";
      case "cancelled":
      case "expired":
        return "cancelled";
      case "pending_payment":
        return "pending";
      default:
        return "pending";
    }
  };

  // ============================================
  // ADMIN ACTION HANDLERS
  // ============================================

  // Cancel subscription
  const handleCancelSubscription = async () => {
    if (!selectedForAction) return;
    setActionLoading(true);
    try {
      await api.delete(API_ENDPOINTS.ADMIN_SUBSCRIPTION_CANCEL(selectedForAction.id));
      toast.success("Subscription cancelled successfully");
      fetchSubscriptions();
      setConfirmDialogAction(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to cancel subscription");
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle auto-renew
  const handleToggleAutoRenew = async () => {
    if (!selectedForAction) return;
    const newAutoRenew = !selectedForAction.autoRenew;
    setActionLoading(true);
    try {
      await api.post(API_ENDPOINTS.ADMIN_SUBSCRIPTION_TOGGLE_AUTO_RENEW(selectedForAction.id), {
        enable: newAutoRenew,
      });
      toast.success(`Auto-renew ${newAutoRenew ? "enabled" : "disabled"} successfully`);
      fetchSubscriptions();
      setConfirmDialogAction(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update auto-renew");
    } finally {
      setActionLoading(false);
    }
  };

  // Extend subscription
  const handleExtendSubscription = async () => {
    if (!selectedForAction) return;

    setActionLoading(true);
    try {
      await api.post(API_ENDPOINTS.ADMIN_SUBSCRIPTION_EXTEND(selectedForAction.id), {
        days: extendDays,
      });
      toast.success(`Subscription extended by ${extendDays} days`);
      setExtendDialogOpen(false);
      setSelectedForAction(null);
      fetchSubscriptions();
    } catch (err: any) {
      toast.error(err?.message || "Failed to extend subscription");
    } finally {
      setActionLoading(false);
    }
  };

  // Refund subscription
  const handleRefundSubscription = async () => {
    if (!selectedForAction) return;
    setActionLoading(true);
    try {
      await api.post(API_ENDPOINTS.ADMIN_SUBSCRIPTION_REFUND(selectedForAction.id), {});
      toast.success("Refund processed successfully");
      fetchSubscriptions();
      setConfirmDialogAction(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to process refund");
    } finally {
      setActionLoading(false);
    }
  };

  // View payment history
  const handleViewPaymentHistory = async (subscription: ProviderSubscription) => {
    setSelectedForAction(subscription);
    await fetchSubscriptionDetails(subscription.providerId);
  };

  if (loading) {
    return <AdminProviderSubscriptionsSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Provider Subscriptions"
          description="View and manage all provider subscriptions"
          onRefresh={() => fetchSubscriptions()}
        />
        <ErrorState
          message={error instanceof Error ? error.message : "Failed to load subscriptions"}
          onRetry={() => fetchSubscriptions()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Provider Subscriptions"
        description="View and manage all provider subscriptions"
        onRefresh={fetchSubscriptions}
      />

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4">
        <StatCard
          title="Total Subscriptions"
          value={stats.total}
          icon={Users}
          variant="blue"
        />
        <StatCard
          title="Active Subscriptions"
          value={stats.active}
          change={`${stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% of total`}
          icon={CheckCircle2}
          trend="up"
          variant="emerald"
        />
        <StatCard
          title="Trial Users"
          value={stats.trial}
          icon={Clock}
          trend="neutral"
          variant="orange"
        />
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(stats.monthlyRevenue)}
          icon={TrendingUp}
          variant="purple"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by provider name, email, or business..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="pending_payment">Pending Payment</SelectItem>
          </SelectContent>
        </Select>
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            {planNames.map((plan) => (
              <SelectItem key={plan} value={plan}>
                {plan}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing <span className="font-medium">{filteredSubscriptions.length}</span>{" "}
        of <span className="font-medium">{subscriptions.length}</span> subscriptions
      </div>

      {/* Subscriptions Table */}
      {filteredSubscriptions.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No subscriptions found"
          description="Try adjusting your filters or search query"
        />
      ) : (
        <div className="border rounded-md overflow-hidden bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-[22%] py-4 px-4">Provider</TableHead>
                <TableHead className="w-[12%] py-4 px-4">Plan</TableHead>
                <TableHead className="w-[10%] py-4 px-4">Status</TableHead>
                <TableHead className="w-[10%] py-4 px-4">Platform Fee</TableHead>
                <TableHead className="w-[12%] py-4 px-4">Billing</TableHead>
                <TableHead className="w-[16%] py-4 px-4">Dates</TableHead>
                <TableHead className="w-[10%] py-4 px-4">Amount Paid</TableHead>
                <TableHead className="w-[8%] py-4 px-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscriptions.map((sub) => (
                <TableRow
                  key={sub.id}
                  className="hover:bg-muted/50 transition-colors border-b last:border-b-0"
                >
                  {/* Provider Column */}
                  <TableCell className="py-4 px-4">
                    <div>
                      <div className="font-medium text-sm">{sub.providerName || "N/A"}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{sub.providerEmail || ""}</div>
                      {sub.providerBusiness && (
                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {sub.providerBusiness}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Plan Column */}
                  <TableCell className="py-4 px-4">
                    <Badge variant="outline" className="font-medium">
                      {sub.planName}
                    </Badge>
                  </TableCell>

                  {/* Status Column */}
                  <TableCell className="py-4 px-4">
                    <StatusBadge status={getStatusVariant(sub.status)} />
                  </TableCell>

                  {/* Platform Fee Column */}
                  <TableCell className="py-4 px-4">
                    <Badge
                      variant="outline"
                      className={
                        sub.planPlatformFeePercentage <= 5
                          ? "bg-green-100 text-green-700 hover:bg-green-200 border-green-200"
                          : sub.planPlatformFeePercentage <= 10
                            ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200"
                            : "bg-red-100 text-red-700 hover:bg-red-200 border-red-200"
                      }
                    >
                      {sub.planPlatformFeePercentage}%
                    </Badge>
                  </TableCell>

                  {/* Billing Column */}
                  <TableCell className="py-4 px-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                        <span className="capitalize">{sub.billingCycle}</span>
                      </div>
                      {sub.autoRenew && (
                        <Badge variant="outline" className="text-xs w-fit">
                          Auto-renew
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  {/* Dates Column */}
                  <TableCell className="py-4 px-4">
                    <div className="text-xs space-y-1">
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Start:</span>
                        <span className="font-medium">{formatDate(sub.startDate)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">End:</span>
                        <span className="font-medium">{formatDate(sub.endDate)}</span>
                      </div>
                      {sub.trialEndDate && (
                        <div className="flex items-center gap-1 text-blue-600">
                          <Clock className="h-3 w-3" />
                          <span>Trial: {formatDate(sub.trialEndDate)}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Amount Paid Column */}
                  <TableCell className="py-4 px-4">
                    <div className="flex items-center gap-0.5 font-semibold text-sm">
                      <IndianRupee className="h-3.5 w-3.5 text-foreground" />
                      <span>{(sub.amountPaid / 100).toFixed(2)}</span>
                    </div>
                  </TableCell>

                  {/* Actions Column */}
                  <TableCell className="py-4 px-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={actionLoading}>
                          <RefreshCw className={`h-4 w-4 ${actionLoading ? "animate-spin" : ""}`} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        {/* View Actions */}
                        <DropdownMenuItem onClick={() => fetchSubscriptionDetails(sub.providerId)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleViewPaymentHistory(sub)}>
                          <History className="h-4 w-4 mr-2" />
                          Payment History
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        {/* Auto-Renew Toggle */}
                        <DropdownMenuItem onClick={() => { setSelectedForAction(sub); setConfirmDialogAction("renew"); }}>
                          <Power className="h-4 w-4 mr-2" />
                          {sub.autoRenew ? "Disable Auto-renew" : "Enable Auto-renew"}
                        </DropdownMenuItem>

                        {/* Extend Subscription */}
                        <DropdownMenuItem onClick={() => { setSelectedForAction(sub); setExtendDialogOpen(true); }}>
                          <CalendarPlus className="h-4 w-4 mr-2" />
                          Extend Subscription
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        {/* Cancel & Refund */}
                        <DropdownMenuItem
                          onClick={() => { setSelectedForAction(sub); setConfirmDialogAction("cancel"); }}
                          className="text-orange-600 focus:text-orange-600"
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          Cancel Subscription
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => { setSelectedForAction(sub); setConfirmDialogAction("refund"); }}
                          className="text-red-600 focus:text-red-600"
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Refund
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem onClick={() => router.push(`/admin/users?userId=${sub.providerId}`)}>
                          <Users className="h-4 w-4 mr-2" />
                          View Provider Profile
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Subscription Detail Dialog */}
      <Dialog
        open={!!selectedSubscription}
        onOpenChange={(open) => !open && setSelectedSubscription(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {detailLoading ? (
            <div className="py-8 space-y-4">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : selectedSubscription ? (
            <>
              <DialogHeader>
                <DialogTitle>Subscription Details</DialogTitle>
                <DialogDescription>
                  {selectedSubscription.subscription.providerName} - {selectedSubscription.subscription.planName} Plan
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Subscription Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Status</div>
                    <StatusBadge status={getStatusVariant(selectedSubscription.subscription.status)} />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Billing Cycle</div>
                    <div className="font-medium capitalize">{selectedSubscription.subscription.billingCycle}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Start Date</div>
                    <div className="font-medium">{formatDate(selectedSubscription.subscription.startDate)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">End Date</div>
                    <div className="font-medium">{formatDate(selectedSubscription.subscription.endDate)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Platform Fee</div>
                    <div className="font-medium">{selectedSubscription.subscription.planPlatformFeePercentage}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Total Paid</div>
                    <div className="font-medium flex items-center gap-1">
                      <IndianRupee className="h-3 w-3" />
                      {(selectedSubscription.subscription.amountPaid / 100).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Auto Renew</div>
                    <div className="font-medium">{selectedSubscription.subscription.autoRenew ? "Enabled" : "Disabled"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Razorpay Subscription ID</div>
                    <div className="font-medium text-xs">
                      {selectedSubscription.subscription.razorpaySubscriptionId || "N/A"}
                    </div>
                  </div>
                </div>

                {/* Usage Info */}
                {selectedSubscription.usage && (
                  <div className="rounded-lg bg-muted p-4">
                    <h4 className="font-semibold mb-3">Usage This Month</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Bookings Used</div>
                        <div className="font-medium">{selectedSubscription.usage.currentMonthBookings}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Max Bookings</div>
                        <div className="font-medium">
                          {selectedSubscription.usage.maxBookings || "Unlimited"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Remaining</div>
                        <div className="font-medium">
                          {selectedSubscription.usage.remainingBookings || "Unlimited"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Limit Reached</div>
                        <div className="font-medium">
                          {selectedSubscription.usage.limitReached ? (
                            <Badge variant="destructive">Yes</Badge>
                          ) : (
                            <Badge variant="outline">No</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment History */}
                {selectedSubscription.paymentHistory && selectedSubscription.paymentHistory.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Payment History</h4>
                    <div className="rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedSubscription.paymentHistory.map((payment) => (
                            <TableRow key={payment.id}>
                              <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                              <TableCell>{formatCurrency(payment.amount)}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={payment.status === "captured" ? "default" : "destructive"}
                                >
                                  {payment.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setSelectedSubscription(null)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    router.push(`/admin/users?userId=${selectedSubscription.subscription.providerId}`);
                    setSelectedSubscription(null);
                  }}
                >
                  View Provider Profile
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Extend Subscription Dialog */}
      <Dialog open={extendDialogOpen} onOpenChange={setExtendDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Extend Subscription</DialogTitle>
            <DialogDescription>
              Add extra days to {selectedForAction?.providerName}'s {selectedForAction?.planName} subscription
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Days to extend</label>
              <div className="flex gap-2">
                {[7, 15, 30, 60, 90].map((days) => (
                  <Button
                    key={days}
                    variant={extendDays === days ? "default" : "outline"}
                    size="sm"
                    onClick={() => setExtendDays(days)}
                  >
                    {days}
                  </Button>
                ))}
              </div>
              <Input
                type="number"
                value={extendDays}
                onChange={(e) => setExtendDays(parseInt(e.target.value) || 0)}
                min={1}
                max={365}
                className="mt-2"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              The subscription will be extended by <strong>{extendDays} days</strong> from its current end date.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendDialogOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={handleExtendSubscription} disabled={actionLoading}>
              {actionLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
              Extend Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialogs */}
      <AlertDialog open={confirmDialogAction === "cancel"} onOpenChange={(open) => !open && setConfirmDialogAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel {selectedForAction?.providerName}'s {selectedForAction?.planName} subscription?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Go Back</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCancelSubscription}
              className="bg-orange-600 hover:bg-orange-700"
              disabled={actionLoading}
            >
              Confirm Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDialogAction === "renew"} onOpenChange={(open) => !open && setConfirmDialogAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Toggle Auto-Renew</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {selectedForAction?.autoRenew ? "disable" : "enable"} auto-renew for {selectedForAction?.providerName}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleToggleAutoRenew}
              disabled={actionLoading}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDialogAction === "refund"} onOpenChange={(open) => !open && setConfirmDialogAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Refund Subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to refund {selectedForAction?.providerName}'s subscription? This will cancel the subscription and process a refund.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Go Back</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRefundSubscription}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={actionLoading}
            >
              Process Refund
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
