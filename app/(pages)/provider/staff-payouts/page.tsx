"use client";

import { useState, useEffect } from "react";
import {
  Wallet,
  IndianRupee,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  User,
  Mail,
  Phone,
  Building2,
  Landmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  useProviderStaffPayoutSummary,
  useProcessProviderStaffPayout,
  type StaffPayoutSummary,
} from "@/lib/queries/use-staff-payouts";
import { ProviderStaffPayoutsSkeleton } from "@/components/provider/skeletons";

interface PayoutTotals {
  totalPendingAmount: number;
  totalPaidAmount: number;
  pendingCount: number;
}

interface SummaryResponse {
  message: string;
  data: {
    pendingPayouts: StaffPayoutSummary[];
    totals: PayoutTotals;
  };
}

export default function ProviderStaffPayoutsPage() {
  const [selectedStaff, setSelectedStaff] = useState<StaffPayoutSummary | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // TanStack Queries & Mutations
  const { data: summaryResponse, isLoading, refetch } = useProviderStaffPayoutSummary();
  const processMutation = useProcessProviderStaffPayout();

  const handleProcessPayout = async () => {
    if (!selectedStaff) return;

    try {
      await processMutation.mutateAsync(selectedStaff.staffId);
      setConfirmDialogOpen(false);
      setSelectedStaff(null);
    } catch (error: any) {
      // Error is handled in mutation
    }
  };

  const openConfirmDialog = (staff: StaffPayoutSummary) => {
    setSelectedStaff(staff);
    setConfirmDialogOpen(true);
  };

  if (isLoading) {
    return <ProviderStaffPayoutsSkeleton />;
  }

  const summary = summaryResponse || null;

  const totals = summary?.totals || {
    totalPendingAmount: 0,
    totalPaidAmount: 0,
    pendingCount: 0,
  };
  const pendingPayouts = summary?.pendingPayouts || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staff Payouts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and process payouts to your staff members
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => refetch()}
          disabled={isLoading || processMutation.isPending}
        >
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                  Pending Amount
                </p>
                <p className="text-2xl font-bold text-amber-900 dark:text-amber-100 flex items-center gap-1 mt-1">
                  <IndianRupee className="h-5 w-5" />
                  {(totals.totalPendingAmount / 100).toFixed(2)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  Total Paid
                </p>
                <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100 flex items-center gap-1 mt-1">
                  <IndianRupee className="h-5 w-5" />
                  {(totals.totalPaidAmount / 100).toFixed(2)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Staff with Pending
                </p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                  {totals.pendingCount}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Payouts */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Pending Staff Payouts
          </h2>

          {pendingPayouts.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No pending payouts</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Payment Details</TableHead>
                    <TableHead className="text-right">Pending Amount</TableHead>
                    <TableHead className="text-center">Bookings</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingPayouts.map((staff) => (
                    <TableRow key={staff.staffId}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={staff.staffAvatar || undefined}
                              alt={staff.staffName}
                            />
                            <AvatarFallback className="bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 text-purple-600 dark:text-purple-400 text-sm font-semibold">
                              {staff.staffName.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{staff.staffName}</p>
                            {staff.employeeId && (
                              <p className="text-xs text-muted-foreground">
                                ID: {staff.employeeId}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          {staff.staffEmail && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Mail className="h-3.5 w-3.5" />
                              {staff.staffEmail}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {staff.upiId ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Building2 className="h-4 w-4 text-green-600" />
                            <span className="font-medium">{staff.upiId}</span>
                            <Badge
                              variant="outline"
                              className="ml-2 text-xs bg-green-50 text-green-700 border-green-200"
                            >
                              UPI
                            </Badge>
                          </div>
                        ) : staff.bankAccount ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Landmark className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">
                              {staff.bankAccount.slice(-4)}
                            </span>
                            <Badge
                              variant="outline"
                              className="ml-2 text-xs bg-blue-50 text-blue-700 border-blue-200"
                            >
                              Bank
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            No payment details
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <p className="font-bold text-lg text-amber-700 dark:text-amber-400 flex items-center justify-end gap-1">
                          <IndianRupee className="h-4 w-4" />
                          {(staff.totalPending / 100).toFixed(2)}
                        </p>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{staff.payoutCount}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => openConfirmDialog(staff)}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Mark as Paid
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirm Payout
            </AlertDialogTitle>
            <AlertDialogDescription>
              Please confirm that you have transferred the payment to{" "}
              <strong>{selectedStaff?.staffName}</strong> before marking as paid.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {selectedStaff && (
            <div className="py-4 space-y-3 bg-muted/50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Staff Name:</span>
                <span className="font-medium">{selectedStaff.staffName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Amount to Pay:</span>
                <span className="font-bold text-lg text-amber-700 dark:text-amber-400 flex items-center gap-1">
                  <IndianRupee className="h-4 w-4" />
                  {(selectedStaff.totalPending / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Payment Method:</span>
                {selectedStaff.upiId ? (
                  <span className="font-medium">
                    UPI: {selectedStaff.upiId}
                  </span>
                ) : selectedStaff.bankAccount ? (
                  <span className="font-medium">
                    Bank: ****{selectedStaff.bankAccount.slice(-4)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    No payment details on file
                  </span>
                )}
              </div>
              <div className="pt-3 border-t">
                <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded">
                  <strong>Important:</strong> Please transfer the money via your
                  banking app/UPI app first, then click "Confirm" to mark as
                  paid.
                </p>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={processMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleProcessPayout}
              disabled={processMutation.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {processMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirm Payment
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
