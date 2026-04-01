"use client";

import { useState, useMemo } from "react";
import {
  Wallet,
  CheckCircle,
  Clock,
  AlertCircle,
  IndianRupee,
  Building2,
  Calendar,
  Users,
  CreditCard,
  Copy,
} from "lucide-react";
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
import { API_ENDPOINTS } from "@/lib/api";
import {
  useAdminPayouts,
  useProviderGroupedPayouts,
  usePayoutSummary,
  usePayProvider,
  usePayBulkProviders,
} from "@/lib/queries";
import type { Payout, ProviderPayout, PayoutSummary } from "@/lib/queries/use-admin-payouts";

type PayoutStatus = "pending" | "paid" | "all";
type ProviderFilter = "all" | "ready" | "waiting";

export default function AdminPayoutsPage() {
  // Fetch data using cached hooks
  const {
    data: payouts = [],
    isLoading: payoutsLoading,
    error: payoutsError,
    refetch: refetchPayouts,
  } = useAdminPayouts();

  const {
    data: summary,
    isLoading: summaryLoading,
  } = usePayoutSummary();

  const {
    data: providerPayouts = [],
    isLoading: providersLoading,
    refetch: refetchProviders,
  } = useProviderGroupedPayouts();

  // Fetch all providers for counts (needed when filter is not "all")
  const { data: allProviderPayouts = [] } = useProviderGroupedPayouts("all");

  const isLoading = payoutsLoading || summaryLoading || providersLoading;
  const error = payoutsError;

  // Local state
  const [statusFilter, setStatusFilter] = useState<PayoutStatus>("all");
  const [providerFilter, setProviderFilter] = useState<ProviderFilter>("all");
  const [providerDialogOpen, setProviderDialogOpen] = useState(false);
  const [bulkPayDialogOpen, setBulkPayDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ProviderPayout | null>(null);

  // Mutation
  const payMutation = usePayProvider();

  // Filter provider payouts by current filter selection
  const filteredProviderPayouts = useMemo(() => {
    if (providerFilter === "all") return providerPayouts;
    if (providerFilter === "ready") {
      return providerPayouts.filter((p) => p.canProcessPayout);
    }
    if (providerFilter === "waiting") {
      return providerPayouts.filter((p) => !p.canProcessPayout);
    }
    return providerPayouts;
  }, [providerPayouts, providerFilter]);

  // Providers ready and waiting
  const providersReadyToPay = useMemo(() => {
    return allProviderPayouts.filter((p) => p.canProcessPayout);
  }, [allProviderPayouts]);

  const providersWaiting = useMemo(() => {
    return allProviderPayouts.filter((p) => !p.canProcessPayout);
  }, [allProviderPayouts]);

  // Filter payouts by status
  const filteredPayouts = useMemo(() => {
    if (statusFilter === "all") return payouts;
    return payouts.filter((p: Payout) => p.status === statusFilter);
  }, [payouts, statusFilter]);

  // Pay all pending payouts for a provider
  const handlePayProvider = async (provider: ProviderPayout) => {
    setSelectedProvider(provider);
    setProviderDialogOpen(true);
  };

  const confirmPayProvider = async () => {
    if (!selectedProvider) return;

    payMutation.mutate(
      { providerId: selectedProvider.providerId },
      {
        onSuccess: () => {
          toast.success(
            `Paid ₹${(selectedProvider.totalPending / 100).toFixed(2)} to ${selectedProvider.providerName}`,
          );
          setProviderDialogOpen(false);
          setSelectedProvider(null);
          refetchPayouts();
          refetchProviders();
        },
      }
    );
  };

  // Pay all ready providers at once
  const handlePayAllReady = () => {
    setBulkPayDialogOpen(true);
  };

  // Mutations
  const payBulkMutation = usePayBulkProviders();

  const confirmPayAllReady = async () => {
    if (providersReadyToPay.length === 0) return;

    try {
      const providerIds = providersReadyToPay.map((p) => p.providerId);
      await payBulkMutation.mutateAsync({ providerIds });

      setBulkPayDialogOpen(false);
    } catch (err) {
      // Error handling done in mutation
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
    return <ErrorState message={error.message || "Failed to load payouts"} onRetry={() => refetchPayouts()} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Provider Payouts"
        description="Manage and process provider payouts. Process provider-level payments to ensure full accumulated amounts are paid."
        onRefresh={() => {
          refetchPayouts();
          refetchProviders();
        }}
      />

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="gap-0 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200 dark:border-orange-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-400">
                Pending to Pay
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                {formatCurrency(summary.totalPendingAmount)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.pendingCount} payout
                {summary.pendingCount !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>

          <Card className="gap-0 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border-emerald-200 dark:border-emerald-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                Total Paid Out
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                {formatCurrency(summary.totalPaidAmount)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.paidCount} payout{summary.paidCount !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>

          <Card className="gap-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">
                Providers Ready
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {providersReadyToPay.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {providersWaiting.length} waiting for threshold
              </p>
            </CardContent>
          </Card>

          <Card className="gap-0 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 border-purple-200 dark:border-purple-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-400">
                Minimum Payout
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
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
                <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-md">
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
              <Select value={providerFilter} onValueChange={(v: any) => setProviderFilter(v)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter providers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  <SelectItem value="ready">Ready to Pay</SelectItem>
                  <SelectItem value="waiting">Waiting</SelectItem>
                </SelectContent>
              </Select>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Process all pending payouts for a provider at once. This ensures
                providers receive their full accumulated amount.
              </p>
              {providersReadyToPay.length > 1 && (
                <Button
                  onClick={handlePayAllReady}
                  disabled={payMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Pay All Ready ({providersReadyToPay.length})
                </Button>
              )}
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProviderPayouts.length === 0 ? (
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
                filteredProviderPayouts.map((provider) => (
                  <div
                    key={provider.providerId}
                    className={`group relative bg-card border rounded-md p-4 transition-all ${
                      !provider.canProcessPayout
                        ? "bg-muted/30 opacity-60"
                        : "hover:border-primary/50 hover:shadow-sm"
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Provider Info */}
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-md bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold">
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
                          <p className="text-muted-foreground">Total Pending</p>
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

                      {/* Payment Details for Manual Transfer */}
                      {provider.canProcessPayout && provider.paymentDetails && (
                        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                            <Wallet className="h-4 w-4" />
                            Payment Details for Transfer
                          </div>
                          {provider.paymentDetails.upiId ? (
                            <div className="flex items-center justify-between">
                              <span className="text-sm">
                                <span className="text-muted-foreground">
                                  UPI:
                                </span>{" "}
                                <span className="font-mono font-medium">
                                  {provider.paymentDetails.upiId}
                                </span>
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2"
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    provider.paymentDetails?.upiId || "",
                                  );
                                  toast.success("UPI ID copied!");
                                }}
                              >
                                Copy
                              </Button>
                            </div>
                          ) : (
                            provider.paymentDetails.bankAccount && (
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    Account:
                                  </span>
                                  <span className="font-mono font-medium">
                                    {provider.paymentDetails.bankAccountMasked}
                                  </span>
                                </div>
                                {provider.paymentDetails.ifscCode && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      IFSC:
                                    </span>
                                    <span className="font-mono">
                                      {provider.paymentDetails.ifscCode}
                                    </span>
                                  </div>
                                )}
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">
                                    Holder:
                                  </span>
                                  <span className="text-medium">
                                    {provider.paymentDetails.accountHolderName}
                                  </span>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}

                      {/* No Payment Details Warning */}
                      {provider.canProcessPayout &&
                        !provider.paymentDetails && (
                          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md p-3 text-sm">
                            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                              <AlertCircle className="h-4 w-4" />
                              <span>
                                Provider hasn't added payment details yet
                              </span>
                            </div>
                          </div>
                        )}

                      {/* Threshold Status */}
                      {provider.canProcessPayout ? (
                        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/40 px-3 py-1.5 rounded-md">
                          <CheckCircle className="h-4 w-4" />
                          Ready to pay
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-md">
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
                        disabled={!provider.canProcessPayout || payMutation.isPending}
                        className={`w-full ${
                          provider.canProcessPayout
                            ? ""
                            : "bg-muted text-muted-foreground cursor-not-allowed"
                        }`}
                      >
                        {payMutation.isPending &&
                        selectedProvider?.providerId === provider.providerId
                          ? "Processing..."
                          : `Mark as Paid`}
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
                <div className="inline-flex items-center gap-2 text-sm bg-green-50 dark:bg-green-950/40 px-4 py-2 rounded-md">
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
              <div className="p-2 bg-muted rounded-md">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                Payout History
                <div className="text-sm font-normal text-muted-foreground">
                  Read-only records ({filteredPayouts.length})
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
              Use the{" "}
              <span className="font-semibold">Provider-Level Payouts</span>{" "}
              section above to process payments.
            </p>
          )}
        </CardHeader>
        <CardContent>
          {filteredPayouts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Wallet className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No payout records found for this filter</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPayouts.map((payout) => (
                <div
                  key={payout.id}
                  className="bg-card border rounded-md p-4 hover:border-primary/50 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {payout.provider?.name || "Unknown Provider"}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          Booking #{payout.id}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(payout.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        {formatCurrency(payout.amount)}
                      </div>
                      <Badge
                        variant={
                          payout.status === "completed"
                            ? "outline"
                            : "default"
                        }
                        className={
                          payout.status === "completed"
                            ? ""
                            : "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-400"
                        }
                      >
                        {payout.status === "completed" ? (
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Mark as Paid (MANUAL)</DialogTitle>
            <DialogDescription>
              Mark all pending payouts for {selectedProvider?.providerName} as
              paid
            </DialogDescription>
          </DialogHeader>

          {selectedProvider && (
            <div className="py-4 space-y-4">
              <div className="bg-muted/50 rounded-md p-4 space-y-3">
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

              {/* Payment Details for Manual Transfer */}
              {selectedProvider.paymentDetails && (
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-blue-800 dark:text-blue-300">
                    <Wallet className="h-4 w-4" />
                    Transfer Money To:
                  </div>
                  {selectedProvider.paymentDetails.upiId ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        UPI ID:
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium">
                          {selectedProvider.paymentDetails.upiId}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              selectedProvider.paymentDetails?.upiId || "",
                            );
                            toast.success(
                              "UPI ID copied! Paste in your UPI app.",
                            );
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    selectedProvider.paymentDetails.bankAccount && (
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Bank Account:
                          </span>
                          <span className="font-mono">
                            {selectedProvider.paymentDetails.bankAccountMasked}
                          </span>
                        </div>
                        {selectedProvider.paymentDetails.ifscCode && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              IFSC Code:
                            </span>
                            <span className="font-mono">
                              {selectedProvider.paymentDetails.ifscCode}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            A/c Holder:
                          </span>
                          <span className="font-medium">
                            {selectedProvider.paymentDetails.accountHolderName}
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}

              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md p-4 text-sm text-amber-800 dark:text-amber-300">
                <AlertCircle className="h-4 w-4 inline mr-2" />
                <strong>IMPORTANT:</strong> Mark as "Paid"{" "}
                <strong>ONLY AFTER</strong> you manually transfer ₹
                {(selectedProvider.totalPending / 100).toFixed(2)} to the
                provider via UPI/bank.
              </div>

              <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md p-4 text-sm text-blue-800 dark:text-blue-300">
                <CheckCircle className="h-4 w-4 inline mr-2" />
                This will mark {selectedProvider.bookingCount} pending payouts
                as paid in the system.
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setProviderDialogOpen(false)}
              disabled={payMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmPayProvider}
              disabled={payMutation.isPending}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              {payMutation.isPending ? "Processing..." : `Confirm Mark as Paid`}
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
            <div className="bg-muted/50 rounded-md p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Providers:</span>
                <span className="font-medium">
                  {providersReadyToPay.length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Bookings:</span>
                <span className="font-medium">
                  {providersReadyToPay.reduce(
                    (sum, p) => sum + p.bookingCount,
                    0,
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="font-bold text-green-600 text-lg">
                  {formatCurrency(
                    providersReadyToPay.reduce(
                      (sum, p) => sum + p.totalPending,
                      0,
                    ),
                  )}
                </span>
              </div>
            </div>

            {/* Provider List */}
            <div className="max-h-40 overflow-y-auto">
              <p className="text-sm font-medium mb-2">Providers to be paid:</p>
              <div className="space-y-1">
                {providersReadyToPay.map((provider) => (
                  <div
                    key={provider.providerId}
                    className="flex items-center justify-between text-sm py-1 px-2 rounded hover:bg-muted"
                  >
                    <span>{provider.providerName}</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(provider.totalPending)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md p-4 text-sm text-amber-800 dark:text-amber-300">
              <AlertCircle className="h-4 w-4 inline mr-2" />
              This will process payments for {providersReadyToPay.length}{" "}
              provider{providersReadyToPay.length > 1 ? "s" : ""}. Make sure you
              have transferred the money to their accounts before confirming.
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkPayDialogOpen(false)}
              disabled={payMutation.isPending}
            >
              Cancel
            </Button>
            <Button onClick={confirmPayAllReady} disabled={payMutation.isPending}>
              {payMutation.isPending
                ? "Processing..."
                : `Confirm Pay ${formatCurrency(
                    providersReadyToPay.reduce(
                      (sum, p) => sum + p.totalPending,
                      0,
                    ),
                  )}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
