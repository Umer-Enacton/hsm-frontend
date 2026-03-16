"use client";

import { useState, useEffect } from "react";
import { CreditCard, IndianRupee, Building, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { api, API_ENDPOINTS } from "@/lib/api";

interface Stage4PaymentDetailsProps {
  onNext: (data: { hasPaymentDetails: boolean }) => void;
  existingPaymentDetails?: any[];
}

export function Stage4PaymentDetails({
  onNext,
  existingPaymentDetails = [],
}: Stage4PaymentDetailsProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"list" | "upi" | "bank">(
    existingPaymentDetails.length > 0 ? "list" : "upi"
  );
  const [paymentDetails, setPaymentDetails] = useState<any[]>(existingPaymentDetails);
  const [upiId, setUpiId] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");

  useEffect(() => {
    if (existingPaymentDetails.length > 0) {
      setPaymentDetails(existingPaymentDetails);
      // If has active payment method, notify parent and move to next
      const hasActive = existingPaymentDetails.some((d) => d.isActive);
      if (hasActive) {
        onNext({ hasPaymentDetails: true });
      }
    }
  }, [existingPaymentDetails]);

  const fetchPaymentDetails = async () => {
    try {
      setLoading(true);
      const response: any = await api.get(API_ENDPOINTS.PAYMENT_DETAILS);
      setPaymentDetails(response.details || []);

      // Check if has active payment method
      if (response.details && response.details.length > 0) {
        const hasActive = response.details.some((d: any) => d.isActive);
        if (hasActive) {
          onNext({ hasPaymentDetails: true });
        }
      }
    } catch (error: any) {
      console.error("Error fetching payment details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUPI = async () => {
    if (!upiId || !upiId.includes("@")) {
      toast.error("Please enter a valid UPI ID");
      return;
    }

    try {
      setLoading(true);
      await api.post(API_ENDPOINTS.PAYMENT_DETAILS, {
        paymentType: "upi",
        upiId,
      });

      toast.success("UPI ID saved successfully");
      setUpiId("");
      setActiveTab("list");
      fetchPaymentDetails();
    } catch (error: any) {
      console.error("Error saving UPI ID:", error);
      toast.error(error.message || "Failed to save UPI ID");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBank = async () => {
    if (!bankAccount || !ifscCode || !accountHolderName) {
      toast.error("Please fill all bank details");
      return;
    }

    try {
      setLoading(true);
      await api.post(API_ENDPOINTS.PAYMENT_DETAILS, {
        paymentType: "bank",
        bankAccount,
        ifscCode,
        accountHolderName,
      });

      toast.success("Bank details saved successfully");
      setBankAccount("");
      setIfscCode("");
      setAccountHolderName("");
      setActiveTab("list");
      fetchPaymentDetails();
    } catch (error: any) {
      console.error("Error saving bank details:", error);
      toast.error(error.message || "Failed to save bank details");
    } finally {
      setLoading(false);
    }
  };

  const handleSetActive = async (id: number) => {
    try {
      await api.put(API_ENDPOINTS.PAYMENT_DETAILS_SET_ACTIVE(id), {});
      toast.success("Payment method activated");
      fetchPaymentDetails();
    } catch (error: any) {
      console.error("Error activating payment method:", error);
      toast.error("Failed to activate payment method");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this payment method?")) {
      return;
    }

    try {
      await api.delete(API_ENDPOINTS.PAYMENT_DETAILS_DELETE(id));
      toast.success("Payment method deleted");
      fetchPaymentDetails();
    } catch (error: any) {
      console.error("Error deleting payment method:", error);
      toast.error("Failed to delete payment method");
    }
  };

  const hasActivePaymentMethod = paymentDetails.some((d) => d.isActive);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white">
            <CreditCard className="h-8 w-8" />
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Payment Details
          </h3>
          <p className="text-muted-foreground">
            Add your payment details to receive earnings from bookings
          </p>
        </div>
      </div>

      {/* Alert - Why payment details are needed */}
      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/40">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 dark:text-blue-300">
          <strong className="block mb-1">Why do I need to add payment details?</strong>
          To receive bookings and process payments, you must add a payment method. When a customer
          books your service, the payment is automatically split - you receive your share directly
          to your added UPI ID or bank account.
        </AlertDescription>
      </Alert>

      {/* Warning if no payment details */}
      {paymentDetails.length === 0 && !loading && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Required:</strong> You must add at least one payment method to complete setup
            and start receiving bookings.
          </AlertDescription>
        </Alert>
      )}

      {/* Success message if has active payment method */}
      {hasActivePaymentMethod && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950/40">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-300">
            <strong>Payment method added!</strong> You can now receive bookings. Add another
            method or click Next to continue.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-950 dark:to-emerald-950 w-full">
          <TabsTrigger
            value="list"
            className="flex-1 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800"
          >
            Saved Methods ({paymentDetails.length})
          </TabsTrigger>
          <TabsTrigger
            value="upi"
            className="flex-1 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Add UPI
          </TabsTrigger>
          <TabsTrigger
            value="bank"
            className="flex-1 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800"
          >
            <Building className="h-4 w-4 mr-2" />
            Add Bank
          </TabsTrigger>
        </TabsList>

        {/* List of saved payment methods */}
        <TabsContent value="list" className="mt-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-green-600 border-t-transparent rounded-full" />
            </div>
          ) : paymentDetails.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-muted rounded-lg">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">No payment methods added yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Add a UPI ID or bank account to start receiving bookings
              </p>
              <Button
                variant="outline"
                onClick={() => setActiveTab("upi")}
                className="border-green-500 text-green-600 hover:bg-green-50"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Add a payment method
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentDetails.map((detail) => (
                <div
                  key={detail.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    detail.isActive
                      ? "border-green-500 bg-green-50 dark:bg-green-950/40 shadow-lg"
                      : "border-muted"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white">
                        {detail.paymentType === "upi" ? (
                          <IndianRupee className="h-5 w-5" />
                        ) : (
                          <Building className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold">
                          {detail.paymentType === "upi" ? "UPI ID" : "Bank Account"}
                        </div>
                        {detail.isActive && (
                          <Badge className="bg-green-100 text-green-700 mt-1">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!detail.isActive && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSetActive(detail.id)}
                          className="border-green-500 text-green-600 hover:bg-green-50"
                        >
                          Set Active
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(detail.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 text-sm">
                    {detail.paymentType === "upi" ? (
                      <div>
                        <span className="text-muted-foreground">UPI ID:</span>
                        <p className="font-mono font-medium">{detail.upiId}</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-muted-foreground">Account:</span>
                          <p className="font-mono font-medium">{detail.bankAccount}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">IFSC:</span>
                          <p className="font-mono font-medium">{detail.ifscCode}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Add UPI ID */}
        <TabsContent value="upi" className="mt-4">
          <div className="space-y-4 p-4 border rounded-lg">
            <div>
              <Label htmlFor="upi">UPI ID</Label>
              <Input
                id="upi"
                placeholder="yourname@upi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter your UPI ID (e.g., merchant@paytm, name@okhdfcbank, name@upi)
              </p>
            </div>
            <Button
              onClick={handleSaveUPI}
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              {loading ? "Saving..." : "Save UPI ID"}
            </Button>
          </div>
        </TabsContent>

        {/* Add Bank Account */}
        <TabsContent value="bank" className="mt-4">
          <div className="space-y-4 p-4 border rounded-lg">
            <div>
              <Label htmlFor="accountHolder">Account Holder Name</Label>
              <Input
                id="accountHolder"
                placeholder="Account holder name as per bank records"
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="bankAccount">Account Number</Label>
              <Input
                id="bankAccount"
                placeholder="Bank account number"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="ifsc">IFSC Code</Label>
              <Input
                id="ifsc"
                placeholder="IFSC code (e.g., HDFC0001234)"
                value={ifscCode}
                onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                className="mt-2"
              />
            </div>
            <Button
              onClick={handleSaveBank}
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              {loading ? "Saving..." : "Save Bank Details"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Continue button - only enabled when has active payment method */}
      <div className="flex justify-end pt-4 border-t">
        <Button
          onClick={() => onNext({ hasPaymentDetails: true })}
          disabled={!hasActivePaymentMethod}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
        >
          {hasActivePaymentMethod ? (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Continue to Dashboard
            </>
          ) : (
            <>
              Add Payment Method to Continue
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
