"use client";

import { useState, useEffect } from "react";
import {
  CreditCard,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  Building,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AdminPaymentsSkeleton } from "@/components/admin/skeletons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  useAdminPaymentDetails,
  useAdminCreatePaymentDetail,
  useUpdatePaymentDetail,
  useSetActivePaymentDetail,
  useDeletePaymentDetail,
} from "@/lib/queries";
import { API_ENDPOINTS } from "@/lib/api";

export default function AdminPaymentsPage() {
  // Use hooks for data fetching
  const {
    data: paymentDetails = [],
    isLoading,
    refetch,
  } = useAdminPaymentDetails();

  const createMutation = useAdminCreatePaymentDetail();
  const updateMutation = useUpdatePaymentDetail();
  const setActiveMutation = useSetActivePaymentDetail();
  const deleteMutation = useDeletePaymentDetail();

  const [saving, setSaving] = useState(false);

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<"upi" | "bank">("upi");
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form states
  const [upiId, setUpiId] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");

  const openAddDialog = (type: "upi" | "bank") => {
    setPaymentType(type);
    setEditingId(null);
    setUpiId("");
    setBankAccount("");
    setIfscCode("");
    setAccountHolderName("");
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (detail: any) => {
    setPaymentType(detail.paymentType);
    setEditingId(detail.id);
    if (detail.paymentType === "upi") {
      setUpiId(detail.upiId);
      setBankAccount("");
      setIfscCode("");
      setAccountHolderName("");
    } else {
      setUpiId("");
      setBankAccount(detail.bankAccount);
      setIfscCode(detail.ifscCode);
      setAccountHolderName(detail.accountHolderName);
    }
    setIsAddDialogOpen(true);
  };

  const closeDialog = () => {
    setIsAddDialogOpen(false);
    setPaymentType("upi");
    setEditingId(null);
    setUpiId("");
    setBankAccount("");
    setIfscCode("");
    setAccountHolderName("");
  };

  const handleSave = async () => {
    if (paymentType === "upi") {
      // UPI validation: must have exactly one @
      const trimmedUpi = upiId.trim().toLowerCase();

      if (!trimmedUpi) {
        toast.error("Please enter a UPI ID");
        return;
      }

      if (!trimmedUpi.includes("@")) {
        toast.error("UPI ID must contain exactly one @ symbol (e.g., name@upi)");
        return;
      }

      if (trimmedUpi.split("@").length !== 2) {
        toast.error("Invalid UPI ID format (e.g., name@upi)");
        return;
      }

      // Check for valid parts
      const [beforeAt, afterAt] = trimmedUpi.split("@");
      if (beforeAt.length < 2 || afterAt.length < 2) {
        toast.error("Invalid UPI ID format (e.g., name@upi)");
        return;
      }
    } else {
      if (!bankAccount || !ifscCode || !accountHolderName) {
        toast.error("Please fill all bank details");
        return;
      }

      // Validate bank account: 10-16 digits
      if (!/^\d{10,16}$/.test(bankAccount)) {
        toast.error("Account number must be 10-16 digits");
        return;
      }

      // Validate IFSC: 11 characters (4 letters + 0 + 6 digits)
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) {
        toast.error("Invalid IFSC code (e.g., HDFC0001234)");
        return;
      }

      // Validate account holder name
      if (accountHolderName.trim().length < 2) {
        toast.error("Account holder name must be at least 2 characters");
        return;
      }
      if (accountHolderName.length > 50) {
        toast.error("Account holder name cannot exceed 50 characters");
        return;
      }
    }

    if (editingId) {
      updateMutation.mutate({
        detailId: editingId,
        data:
          paymentType === "upi"
            ? { paymentType: "upi", upiId }
            : { paymentType: "bank", bankAccount, ifscCode, accountHolderName },
      });
    } else {
      // For new payment details, use the create mutation
      createMutation.mutate(
        paymentType === "upi"
          ? { paymentType: "upi", upiId }
          : { paymentType: "bank", bankAccount, ifscCode, accountHolderName },
        {
          onSuccess: () => {
            closeDialog();
          },
        }
      );
    }
  };

  const handleSetActive = (id: number) => {
    setActiveMutation.mutate({ detailId: id });
  };

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this payment method?")) {
      return;
    }
    deleteMutation.mutate({ detailId: id });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Payment Settings
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage your payment details for receiving platform fees
          </p>
        </div>
      </div>

      {/* Status Alert */}
      {paymentDetails.length === 0 && !isLoading && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex gap-3 sm:gap-4">
              <div className="p-2 bg-destructive/10 rounded-md flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-destructive mb-1">
                  System Alert: Payment Details Required
                </h3>
                <p className="text-sm text-muted-foreground">
                  You must add payment details to receive platform fees. Without
                  payment details, the payment system will not work properly.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => openAddDialog("upi")}
                className="flex-shrink-0"
              >
                Add Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {paymentDetails.length > 0 && !isLoading && (
        <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
          <CardContent className="">
            <div className="flex gap-3 sm:gap-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-md flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-green-800 dark:text-green-300 mb-1">
                  Payment Method Configured
                </h3>
                <p className="text-sm text-green-700 dark:text-green-400">
                  Your payment details are set up to receive platform fees.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Methods List */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-xl font-semibold">Saved Payment Methods</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => openAddDialog("upi")}
            className="flex-1 sm:flex-initial"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add UPI
          </Button>
          <Button
            variant="outline"
            onClick={() => openAddDialog("bank")}
            className="flex-1 sm:flex-initial"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Bank
          </Button>
        </div>
      </div>

      {isLoading ? (
        <AdminPaymentsSkeleton />
      ) : paymentDetails.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 bg-muted rounded-full mb-4">
              <CreditCard className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Payment Methods</h3>
            <p className="text-muted-foreground mb-4 text-center max-w-sm">
              Add a UPI ID or bank account to receive platform fees
            </p>
            <Button onClick={() => openAddDialog("upi")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Payment Method
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 max-w-4xl">
          {paymentDetails.map((detail) => (
            <div
              key={detail.id}
              className={`group relative bg-card border rounded-md p-4 hover:border-primary/50 hover:shadow-sm transition-all duration-200 ${
                detail.isActive ? "border-primary" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    {detail.paymentType === "upi" ? (
                      <div className="w-10 h-10 rounded-md bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center">
                        <IndianRupee className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-md bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                        <Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    )}
                  </div>

                  {/* Payment Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium capitalize text-foreground">
                        {detail.paymentType === "upi" ? "UPI" : "Bank Account"}
                      </h3>
                      {detail.isActive && (
                        <Badge variant="outline" className="text-xs">
                          Active
                        </Badge>
                      )}
                    </div>
                    {detail.paymentType === "upi" ? (
                      <p className="text-sm text-foreground/70 font-mono">
                        {detail.upiId}
                      </p>
                    ) : (
                      <div>
                        <p className="text-sm text-foreground/70 font-mono">
                          A/C: {detail.bankAccount}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {detail.ifscCode}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!detail.isActive && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetActive(detail.id)}
                      className="h-8 px-3"
                    >
                      Activate
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(detail)}
                    className="h-8 px-3"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(detail.id)}
                    className="h-8 px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Card */}
      {/* <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-md shrink-0">
              <IndianRupee className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <p className="font-semibold mb-2">How platform fees work?</p>
              <p className="text-blue-700 dark:text-blue-400 leading-relaxed">
                When customers book services, the payment is automatically split. You receive your platform fee percentage
                directly to your UPI ID or bank account, while the provider receives their share.
              </p>
            </div>
          </div>
        </CardContent>
      </Card> */}

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit" : "Add"}{" "}
              {paymentType === "upi" ? "UPI ID" : "Bank Account"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update your payment details"
                : paymentType === "upi"
                  ? "Enter your UPI ID to receive platform fees"
                  : "Enter your bank account details for direct transfers"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {paymentType === "upi" ? (
              <div className="space-y-2">
                <Label htmlFor="upi">UPI ID *</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="upi"
                    placeholder="yourname@upi"
                    value={upiId}
                    onChange={(e) => {
                      // UPI validation: lowercase, alphanumeric + dots/hyphens/underscore
                      let value = e.target.value.toLowerCase().trim();
                      value = value.replace(/[^a-z0-9.\-_@]/g, "");
                      setUpiId(value);
                    }}
                    className="pl-10"
                    maxLength={50}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Format: name@upi (e.g., merchant@paytm, john@okhdfcbank)
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="accountHolder">Account Holder Name *</Label>
                  <Input
                    id="accountHolder"
                    placeholder="Account holder name as per bank records"
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                    maxLength={50}
                  />
                  <p className="text-xs text-muted-foreground">
                    Max 50 characters
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankAccount">Account Number *</Label>
                  <Input
                    id="bankAccount"
                    placeholder="Bank account number (10-16 digits)"
                    value={bankAccount}
                    onChange={(e) => {
                      // Only digits allowed
                      const value = e.target.value.replace(/[^\d]/g, "");
                      setBankAccount(value);
                    }}
                    className="font-mono"
                    minLength={10}
                    maxLength={16}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter 10-16 digit account number
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ifsc">IFSC Code *</Label>
                  <Input
                    id="ifsc"
                    placeholder="IFSC code (e.g., HDFC0001234)"
                    value={ifscCode}
                    onChange={(e) => {
                      // IFSC: 11 characters, uppercase
                      const value = e.target.value.toUpperCase().trim();
                      setIfscCode(value);
                    }}
                    className="font-mono uppercase"
                    minLength={11}
                    maxLength={11}
                  />
                  <p className="text-xs text-muted-foreground">
                    11 characters (e.g., HDFC0001234)
                  </p>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update" : "Add"}{" "}
              {paymentType === "upi" ? "UPI ID" : "Bank Details"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
