"use client";

import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { api, API_ENDPOINTS } from "@/lib/api";

interface PaymentDetail {
  id: number;
  paymentType: "upi" | "bank";
  upiId: string | null;
  bankAccount: string | null;
  ifscCode: string | null;
  accountHolderName: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function StaffPaymentDetailsPage() {
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<"upi" | "bank">("upi");
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form states
  const [upiId, setUpiId] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");

  // Fetch payment details
  const fetchPaymentDetails = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<{ details: PaymentDetail[] }>(
        API_ENDPOINTS.PAYMENT_DETAILS
      );
      setPaymentDetails(response.details || []);
    } catch (error: any) {
      console.error("Error fetching payment details:", error);
      toast.error(error.message || "Failed to load payment details");
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useState(() => {
    fetchPaymentDetails();
  });

  const openAddDialog = (type: "upi" | "bank") => {
    setPaymentType(type);
    setEditingId(null);
    setUpiId("");
    setBankAccount("");
    setIfscCode("");
    setAccountHolderName("");
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
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

    setIsSaving(true);
    try {
      await api.post(API_ENDPOINTS.PAYMENT_DETAILS, {
        paymentType,
        upiId: paymentType === "upi" ? upiId : undefined,
        bankAccount: paymentType === "bank" ? bankAccount : undefined,
        ifscCode: paymentType === "bank" ? ifscCode : undefined,
        accountHolderName: paymentType === "bank" ? accountHolderName : undefined,
      });

      toast.success("Payment details saved successfully");
      closeDialog();
      fetchPaymentDetails();
    } catch (error: any) {
      console.error("Error saving payment details:", error);
      toast.error(error.message || "Failed to save payment details");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Payment Details
          </h1>
          <p className="text-muted-foreground">
            Manage your payment methods to receive earnings from provider
          </p>
        </div>
      </div>

      {/* Status Alert */}
      {paymentDetails.length === 0 && !isLoading && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="p-2 bg-destructive/10 rounded-md">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-destructive mb-1">
                  Payment Details Required
                </h3>
                <p className="text-sm text-muted-foreground">
                  You must add payment details to receive your earnings. Without
                  payment details, providers cannot pay you for completed jobs.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => openAddDialog("upi")}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                Add Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {paymentDetails.length > 0 && !isLoading && (
        <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-md">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-800 dark:text-green-300 mb-1">
                  Payment Method Configured
                </h3>
                <p className="text-sm text-green-700 dark:text-green-400">
                  You can now receive earnings from your provider.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Methods List */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Saved Payment Methods</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => openAddDialog("upi")}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add UPI
          </Button>
          <Button
            variant="outline"
            onClick={() => openAddDialog("bank")}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Bank
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 max-w-4xl">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : paymentDetails.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 bg-muted rounded-full mb-4">
              <CreditCard className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Payment Methods</h3>
            <p className="text-muted-foreground mb-4 text-center max-w-sm">
              Add a UPI ID or bank account to start receiving your earnings
            </p>
            <Button
              onClick={() => openAddDialog("upi")}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Payment Method
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 max-w-4xl">
          {paymentDetails.map((detail) => (
            <div
              key={detail.id}
              className={`group relative bg-gradient-to-br from-card to-card border rounded-xl p-5 hover:border-primary/50 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 ${
                detail.isActive
                  ? "border-green-200 dark:border-green-800 ring-1 ring-green-500/20"
                  : ""
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    {detail.paymentType === "upi" ? (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-950/30 dark:to-indigo-950/30 flex items-center justify-center shadow-lg">
                        <IndianRupee className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-950/30 dark:to-cyan-950/30 flex items-center justify-center shadow-lg">
                        <Building className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                    )}
                  </div>

                  {/* Payment Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-base text-foreground">
                        {detail.paymentType === "upi" ? "UPI Payment" : "Bank Account"}
                      </h3>
                      {detail.isActive && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800"
                        >
                          Active
                        </Badge>
                      )}
                    </div>
                    {detail.paymentType === "upi" ? (
                      <p className="text-sm text-foreground font-mono bg-muted/50 px-2 py-1 rounded">
                        {detail.upiId}
                      </p>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-sm text-foreground font-mono bg-muted/50 px-2 py-1 rounded">
                          A/C: {detail.bankAccount}
                        </p>
                        <p className="text-xs text-muted-foreground px-2">
                          IFSC: {detail.ifscCode}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Add {paymentType === "upi" ? "UPI ID" : "Bank Account"}
            </DialogTitle>
            <DialogDescription>
              {paymentType === "upi"
                ? "Enter your UPI ID to receive payments directly from your provider"
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
            <Button variant="outline" onClick={closeDialog} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              {isSaving ? "Saving..." : `Add ${paymentType === "upi" ? "UPI ID" : "Bank Details"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
