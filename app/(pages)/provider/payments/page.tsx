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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { api, API_ENDPOINTS } from "@/lib/api";

export default function ProviderPaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<any[]>([]);
  const [upiId, setUpiId] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [activeTab, setActiveTab] = useState<"list" | "upi" | "bank">("list");

  useEffect(() => {
    fetchPaymentDetails();
  }, []);

  const fetchPaymentDetails = async () => {
    try {
      setLoading(true);
      const response: any = await api.get(API_ENDPOINTS.PAYMENT_DETAILS);
      setPaymentDetails(response.details || []);
    } catch (error: any) {
      console.error("Error fetching payment details:", error);
      toast.error("Failed to load payment details");
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
      setSaving(true);
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
      setSaving(false);
    }
  };

  const handleSaveBank = async () => {
    if (!bankAccount || !ifscCode || !accountHolderName) {
      toast.error("Please fill all bank details");
      return;
    }

    try {
      setSaving(true);
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
      setSaving(false);
    }
  };

  const handleSetActive = async (id: number) => {
    try {
      await api.put(API_ENDPOINTS.PAYMENT_DETAILS_SET_ACTIVE(id));
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
          Payment Details
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your payment details for receiving earnings
        </p>
      </div>

      {/* Warning if no payment details */}
      {paymentDetails.length === 0 && !loading && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> You must add payment details to receive bookings and earnings.
            Without payment details, customers cannot book your services.
          </AlertDescription>
        </Alert>
      )}

      {/* Success message when payment details exist */}
      {paymentDetails.length > 0 && !loading && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950/40">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-300">
            <strong>Payment method configured!</strong> You can now receive bookings.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-950 dark:to-indigo-950">
          <TabsTrigger value="list" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
            Saved Methods ({paymentDetails.length})
          </TabsTrigger>
          <TabsTrigger value="upi" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
            <Plus className="h-4 w-4 mr-2" />
            Add UPI
          </TabsTrigger>
          <TabsTrigger value="bank" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
            <Plus className="h-4 w-4 mr-2" />
            Add Bank
          </TabsTrigger>
        </TabsList>

        {/* List of saved payment methods */}
        <TabsContent value="list">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full" />
            </div>
          ) : paymentDetails.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No payment methods added yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add a UPI ID or bank account to start receiving bookings
                </p>
                <Button
                  variant="link"
                  onClick={() => setActiveTab("upi")}
                  className="mt-2"
                >
                  Add a payment method
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {paymentDetails.map((detail) => (
                <Card
                  key={detail.id}
                  className={`${detail.isActive ? "border-purple-500 border-2 shadow-lg" : ""}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white">
                          {detail.paymentType === "upi" ? (
                            <IndianRupee className="h-5 w-5" />
                          ) : (
                            <Building className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {detail.paymentType === "upi" ? "UPI ID" : "Bank Account"}
                          </CardTitle>
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
                          >
                            Set Active
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(detail.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {detail.paymentType === "upi" ? (
                        <div>
                          <span className="text-muted-foreground">UPI ID:</span>
                          <p className="font-mono font-medium">{detail.upiId}</p>
                        </div>
                      ) : (
                        <>
                          <div>
                            <span className="text-muted-foreground">Account:</span>
                            <p className="font-mono font-medium">{detail.bankAccount}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">IFSC:</span>
                            <p className="font-mono font-medium">{detail.ifscCode}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Holder:</span>
                            <p className="font-medium">{detail.accountHolderName}</p>
                          </div>
                        </>
                      )}
                      <div className="text-xs text-muted-foreground">
                        Added: {new Date(detail.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Add UPI ID */}
        <TabsContent value="upi">
          <Card>
            <CardHeader>
              <CardTitle>Add UPI ID</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                disabled={saving}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                {saving ? "Saving..." : "Save UPI ID"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Add Bank Account */}
        <TabsContent value="bank">
          <Card>
            <CardHeader>
              <CardTitle>Add Bank Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                disabled={saving}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                {saving ? "Saving..." : "Save Bank Details"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <p className="font-medium mb-1">Why do I need to add payment details?</p>
              <p className="text-blue-700 dark:text-blue-400">
                To receive bookings and process payments, you must add a payment method. When a customer
                books your service, the payment is automatically split - you receive your share directly
                to your added UPI ID or bank account.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
