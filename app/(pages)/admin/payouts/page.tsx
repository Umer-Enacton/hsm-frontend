"use client";

import { useEffect, useState } from "react";
import {
  Wallet,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
  IndianRupee,
  User,
  Building2,
  Calendar,
  Users,
  CreditCard,
} from "lucide-react";
import { api, API_ENDPOINTS } from "@/lib/api";
import {
  AdminPageHeader,
  LoadingState,
  ErrorState,
} from "@/components/admin/shared";
import { AdminPayoutsSkeleton } from "@/components/admin/skeletons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type PayoutStatus = "pending" | "paid" | "all";
type ProviderFilter = "all" | "ready" | "waiting";

interface Payout {
  paymentId: number;
  bookingId: number;
  amount: number;
  providerShare: number;
  platformFee: number;
  providerPayoutStatus: PayoutStatus;
  paymentCreatedAt: string;
  paymentCompletedAt: string;
  bookingStatus: string;
  bookingDate: string;
  totalPrice: number;
  providerId: number;
  providerName: string;
  providerEmail: string;
  providerBusiness: string;
  canProcessPayout: boolean;
  providerTotalEarnings: number;
  minimumPayoutAmount: number;
}

interface PayoutSummary {
  totalPendingAmount: number;
  totalPaidAmount: number;
  pendingCount: number;
  paidCount: number;
  providersReadyToPay: Array<{
    providerId: number;
    providerName: string;
    providerBusiness: string;
    totalPending: number;
    canProcess: boolean;
  }>;
  providersWaiting: Array<{
    providerId: number;
    providerName: string;
    providerBusiness: string;
    totalPending: number;
    canProcess: boolean;
  }>;
  minimumPayoutAmount: number;
}

// New interface for provider-grouped payouts
interface ProviderPayout {
  providerId: number;
  providerName: string;
  providerEmail: string;
  businessName: string;
  businessId: number;
  totalPending: number;
  bookingCount: number;
  paymentIds: number[];
  canProcessPayout: boolean;
  minimumPayoutAmount: number;
}

interface ProviderPayoutsResponse {
  providers: ProviderPayout[];
  minimumPayoutAmount: number;
}

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [summary, setSummary] = useState<PayoutSummary | null>(null);
  const [providerPayouts, setProviderPayouts] = useState<ProviderPayout[]>([]);
  const [allProviderPayouts, setAllProviderPayouts] = useState<
    ProviderPayout[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<PayoutStatus>("all");
  const [providerFilter, setProviderFilter] = useState<ProviderFilter>("all");
  const [providerDialogOpen, setProviderDialogOpen] = useState(false);
  const [bulkPayDialogOpen, setBulkPayDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] =
    useState<ProviderPayout | null>(null);
  const [processing, setProcessing] = useState(false);

  const fetchData = async (showRefreshLoading = false) => {
    try {
      if (showRefreshLoading) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const [payoutsData, summaryData, providersData] = await Promise.all([
        api.get<any>(`${API_ENDPOINTS.ADMIN_PAYOUTS}?status=${statusFilter}`),
        api.get<PayoutSummary>(`${API_ENDPOINTS.ADMIN_PAYOUTS}/summary`),
        api.get<ProviderPayoutsResponse>(
          `${API_ENDPOINTS.ADMIN_PAYOUTS_BY_PROVIDER}?filter=${providerFilter}`,
        ),
      ]);

      setPayouts(payoutsData.payouts || []);
      setSummary(summaryData);
      setProviderPayouts(providersData.providers || []);

      // Also fetch all providers for counts (filter=all)
      if (providerFilter !== "all") {
        const allProvidersData = await api.get<ProviderPayoutsResponse>(
          `${API_ENDPOINTS.ADMIN_PAYOUTS_BY_PROVIDER}?filter=all`,
        );
        setAllProviderPayouts(allProvidersData.providers || []);
      } else {
        setAllProviderPayouts(providersData.providers || []);
      }
    } catch (err: any) {
      console.error("Failed to fetch payouts:", err);
      setError(err.message || "Failed to load payouts");
      toast.error(err.message || "Failed to load payouts");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, providerFilter]);

  // Pay all pending payouts for a provider
  const handlePayProvider = async (provider: ProviderPayout) => {
    setSelectedProvider(provider);
    setProviderDialogOpen(true);
  };

  const confirmPayProvider = async () => {
    if (!selectedProvider) return;

    try {
      setProcessing(true);
      await api.put(
        `${API_ENDPOINTS.ADMIN_PAYOUTS}/provider/${selectedProvider.providerId}/pay-all`,
        {},
      );

      toast.success(
        `Paid ₹${(selectedProvider.totalPending / 100).toFixed(2)} to ${selectedProvider.providerName}`,
      );
      setProviderDialogOpen(false);
      setSelectedProvider(null);
      fetchData();
    } catch (err: any) {
      console.error("Failed to pay provider:", err);
      toast.error(err.message || "Failed to process provider payment");
    } finally {
      setProcessing(false);
    }
  };

  // Pay all ready providers at once
  const handlePayAllReady = () => {
    setBulkPayDialogOpen(true);
  };

  const confirmPayAllReady = async () => {
    const readyProviders = providersReadyToPay;
    if (readyProviders.length === 0) return;

    try {
      setProcessing(true);

      // Process all ready providers in parallel
      const promises = readyProviders.map((provider) =>
        api.put(
          `${API_ENDPOINTS.ADMIN_PAYOUTS}/provider/${provider.providerId}/pay-all`,
          {},
        ),
      );

      await Promise.all(promises);

      const totalAmount = readyProviders.reduce(
        (sum, p) => sum + p.totalPending,
        0,
      );

      toast.success(
        `Successfully paid ₹${(totalAmount / 100).toFixed(2)} to ${readyProviders.length} provider${readyProviders.length > 1 ? "s" : ""}`,
      );
      setBulkPayDialogOpen(false);
      fetchData();
    } catch (err: any) {
      console.error("Failed to pay all providers:", err);
      toast.error(err.message || "Failed to process some payments");
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amountInPaise: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amountInPaise / 100);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (isLoading) {
    return <AdminPayoutsSkeleton />;
  }

  if (error && !payouts.length) {
    return <ErrorState message={error} onRetry={() => fetchData()} />;
  }

  const providersReadyToPay = allProviderPayouts.filter(
    (p) => p.canProcessPayout,
  );
  const providersWaiting = allProviderPayouts.filter(
    (p) => !p.canProcessPayout,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Provider Payouts"
        description="Manage and process provider payouts. Process provider-level payments to ensure full accumulated amounts are paid."
        onRefresh={() => fetchData(true)}
        isRefreshing={isRefreshing}
      />

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending to Pay
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(summary.totalPendingAmount)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.pendingCount} payout
                {summary.pendingCount !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Paid Out
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(summary.totalPaidAmount)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.paidCount} payout{summary.paidCount !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Providers Ready
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {providersReadyToPay.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {providersWaiting.length} waiting for threshold
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Minimum Payout
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(summary.minimumPayoutAmount)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Payout threshold
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Provider-Grouped Payouts Section */}
      {allProviderPayouts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  Provider-Level Payouts
                  <div className="text-sm font-normal text-muted-foreground">
                    {allProviderPayouts.length} provider
                    {allProviderPayouts.length !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Process all pending payouts for a provider at once. This ensures
                providers receive their full accumulated amount.
              </p>
              {providersReadyToPay.length > 1 && (
                <Button onClick={handlePayAllReady} disabled={processing} className="w-full sm:w-auto">
                  <Wallet className="h-4 w-4 mr-2" />
                  Pay All Ready ({providersReadyToPay.length})
                </Button>
              )}
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {providerPayouts.length === 0 ? (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  {providerFilter === "ready" && (
                    <>
                      <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No providers ready for payout</p>
                    </>
                  )}
                  {providerFilter === "waiting" && (
                    <>
                      <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No providers waiting for threshold</p>
                    </>
                  )}
                  {providerFilter === "all" &&
                    allProviderPayouts.length === 0 && (
                      <>
                        <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No pending payouts found</p>
                      </>
                    )}
                </div>
              ) : (
                providerPayouts.map((provider) => (
                  <div
                    key={provider.providerId}
                    className={`group relative bg-card border rounded-lg p-4 transition-all ${
                      !provider.canProcessPayout
                        ? "bg-muted/30 opacity-60"
                        : "hover:border-primary/50 hover:shadow-sm"
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Provider Info */}
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold">
                          {provider.providerName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">
                            {provider.providerName}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {provider.businessName}
                          </p>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">
                            Total Pending
                          </p>
                          <p className="text-lg font-bold text-orange-600">
                            {formatCurrency(provider.totalPending)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Bookings</p>
                          <p className="text-lg font-semibold">
                            {provider.bookingCount}
                          </p>
                        </div>
                      </div>

                      {/* Threshold Status */}
                      {provider.canProcessPayout ? (
                        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/40 px-3 py-1.5 rounded-lg">
                          <CheckCircle className="h-4 w-4" />
                          Ready to pay
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-lg">
                          <Clock className="h-4 w-4" />
                          {formatCurrency(
                            provider.minimumPayoutAmount -
                              provider.totalPending,
                          )}{" "}
                          below threshold
                        </div>
                      )}

                      {/* Pay Button */}
                      <Button
                        onClick={() => handlePayProvider(provider)}
                        disabled={!provider.canProcessPayout || processing}
                        className={`w-full ${
                          provider.canProcessPayout
                            ? ""
                            : "bg-muted text-muted-foreground cursor-not-allowed"
                        }`}
                      >
                        {processing &&
                        selectedProvider?.providerId === provider.providerId
                          ? "Processing..."
                          : `Pay ${formatCurrency(provider.totalPending)}`}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State - No Pending Payouts */}
      {allProviderPayouts.length === 0 && summary && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-green-50 dark:bg-green-950/40 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
              <p className="text-muted-foreground mb-4">
                No pending payouts to process. All provider payouts have been
                paid.
              </p>
              {summary.totalPaidAmount > 0 && (
                <div className="inline-flex items-center gap-2 text-sm bg-green-50 dark:bg-green-950/40 px-4 py-2 rounded-lg">
                  <IndianRupee className="h-4 w-4 text-green-600" />
                  <span className="font-semibold text-green-600">
                    {formatCurrency(summary.totalPaidAmount)}
                  </span>
                  <span className="text-muted-foreground">
                    already paid out
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payout History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                Payout History
                <div className="text-sm font-normal text-muted-foreground">
                  Read-only records ({payouts.length})
                </div>
              </div>
            </CardTitle>
            <Select
              value={statusFilter}
              onValueChange={(v: any) => setStatusFilter(v)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {allProviderPayouts.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              Use the <span className="font-semibold">Provider-Level Payouts</span> section above to process payments.
            </p>
          )}
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Wallet className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No payout records found for this filter</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payouts.map((payout) => (
                <div
                  key={payout.paymentId}
                  className="bg-card border rounded-lg p-4 hover:border-primary/50 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {payout.providerName}
                        </span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">
                          {payout.providerBusiness}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          Booking #{payout.bookingId}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(payout.bookingDate)}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        {formatCurrency(payout.providerShare)}
                      </div>
                      <Badge
                        variant={
                          payout.providerPayoutStatus === "paid"
                            ? "outline"
                            : "default"
                        }
                        className={
                          payout.providerPayoutStatus === "paid"
                            ? ""
                            : "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-400"
                        }
                      >
                        {payout.providerPayoutStatus === "paid" ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Paid
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Provider Payment Confirmation Dialog */}
      <Dialog open={providerDialogOpen} onOpenChange={setProviderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Provider Payment</DialogTitle>
            <DialogDescription>
              Pay all pending payouts for {selectedProvider?.providerName}
            </DialogDescription>
          </DialogHeader>

          {selectedProvider && (
            <div className="py-4 space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Provider:</span>
                  <span className="font-medium">
                    {selectedProvider.providerName}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Business:</span>
                  <span className="font-medium">
                    {selectedProvider.businessName}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Bookings:</span>
                  <span className="font-medium">
                    {selectedProvider.bookingCount}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Amount:</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(selectedProvider.totalPending)}
                  </span>
                </div>
              </div>

              <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm text-blue-800 dark:text-blue-300">
                <AlertCircle className="h-4 w-4 inline mr-2" />
                This will mark ALL {selectedProvider.bookingCount} pending
                payouts for this provider as paid.
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setProviderDialogOpen(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmPayProvider}
              disabled={processing}
            >
              {processing
                ? "Processing..."
                : `Confirm Pay ${formatCurrency(selectedProvider?.totalPending || 0)}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Pay All Ready Providers Confirmation Dialog */}
      <Dialog open={bulkPayDialogOpen} onOpenChange={setBulkPayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Bulk Payment</DialogTitle>
            <DialogDescription>
              Pay all ready providers at once
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Providers:</span>
                <span className="font-medium">{providersReadyToPay.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Bookings:</span>
                <span className="font-medium">
                  {providersReadyToPay.reduce((sum, p) => sum + p.bookingCount, 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="font-bold text-green-600 text-lg">
                  {formatCurrency(
                    providersReadyToPay.reduce((sum, p) => sum + p.totalPending, 0)
                  )}
                </span>
              </div>
            </div>

            {/* Provider List */}
            <div className="max-h-40 overflow-y-auto">
              <p className="text-sm font-medium mb-2">Providers to be paid:</p>
              <div className="space-y-1">
                {providersReadyToPay.map((provider) => (
                  <div key={provider.providerId} className="flex items-center justify-between text-sm py-1 px-2 rounded hover:bg-muted">
                    <span>{provider.providerName}</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(provider.totalPending)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm text-amber-800 dark:text-amber-300">
              <AlertCircle className="h-4 w-4 inline mr-2" />
              This will process payments for {providersReadyToPay.length} provider{providersReadyToPay.length > 1 ? "s" : ""}. Make sure you have transferred the money to their accounts before confirming.
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkPayDialogOpen(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmPayAllReady}
              disabled={processing}
            >
              {processing
                ? "Processing..."
                : `Confirm Pay ${formatCurrency(
                    providersReadyToPay.reduce((sum, p) => sum + p.totalPending, 0)
                  )}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
