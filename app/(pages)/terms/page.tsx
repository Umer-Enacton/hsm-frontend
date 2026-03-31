"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Clock,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TermsPage() {
  const lastUpdated = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Breadcrumb-like Back Link */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-blue-600 trrounded-mdolors">
            Home
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">
            Terms & Conditions
          </span>
        </div>

        {/* Simplified Header */}
        <div className="bg-white dark:bg-slate-900 border rounded-xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Terms & <span className="text-blue-600">Conditions</span>
              </h1>
              <p className="text-muted-foreground mt-1">
                The governing rules for the HomeFixCare platform.
              </p>
            </div>
            <Badge variant="secondary" className="w-fit h-fit py-1 px-3">
              Last Updated: {lastUpdated}
            </Badge>
          </div>
        </div>

        {/* Main Sections - Dashboard Style Cards */}
        <div className="grid gap-6">
          {/* Section 1: Agreement */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 text-sm">
              <div className="flex items-center gap-2 font-semibold">
                <Shield className="h-4 w-4 text-blue-600" />
                Agreement to Terms
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground leading-relaxed">
              Welcome to HomeFixCare. By using our platform, you agree to these
              legal terms. We connect you with local, verified service
              providers. While we facilitate the booking and payment, the actual
              service contract is between you and the Service Professional.
            </CardContent>
          </Card>

          {/* Section 2: Payments */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-green-600" />
                  Payment Escrow
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                <p className="mb-2">
                  100% upfront payment is required via Razorpay to lock your
                  slot.
                </p>
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between font-medium text-foreground mb-1">
                    <span>Provider Share</span>
                    <span>95%</span>
                  </div>
                  <div className="flex justify-between font-medium text-foreground">
                    <span>Platform Fee</span>
                    <span>5%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-blue-600" />
                  Verification
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                <p>
                  We verify every provider's identity and skills before they
                  appear on the platform. Review ratings left by other customers
                  to make informed decisions.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Section 3: Detailed Refund Logic */}
          <Card className="shadow-sm border-l-4 border-l-blue-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                Cancellation & Refund Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-md bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800">
                  <Badge className="bg-blue-600">100% Refund</Badge>
                  <div className="text-sm">
                    <p className="font-semibold text-foreground">
                      Immediate Rejection or Non-Response
                    </p>
                    <p className="text-xs text-muted-foreground">
                      If a provider rejects your booking or fails to confirm
                      before the appointment time.
                    </p>
                  </div>
                </div>rounded-md

                <div className="flex items-start gap-3 p-3 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <Badge
                    variant="outline"
                    className="border-blue-600 text-blue-600"
                  >
                    85% Refund
                  </Badge>
                  <div className="text-sm">
                    <p className="font-semibold text-foreground">
                      Customer-Led Cancellation (Confirmed)
                    </p>
                    <p className="text-xs text-muted-foreground">
                      If you cancel a booking that was already accepted by a
                      professional. 15% is retained for costs.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Rescheduling */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-blue-600" />
                Reschedule Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between gap-4 p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/30">
                <div className="space-y-2">
                  <p className="text-sm font-bold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Max 2 Reschedules
                  </p>
                  <p className="text-sm font-bold flex items-center gap-2 text-red-600">
                    <Clock className="h-4 w-4" />
                    No changes within 1 hour
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-black">
                    Flat Fee
                  </p>
                  <p className="text-2xl font-black text-blue-600">₹100</p>
                  <p className="text-[10px] text-muted-foreground italic">
                    Non-refundable after request starts
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Simple Contact Callout */}
          <Card className="shadow-sm bg-muted/20 border-none">
            <CardContent className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <div>
                <h3 className="font-bold">Need clarity on our terms?</h3>
                <p className="text-xs text-muted-foreground">
                  Our support team is available 24/7 for your help.
                </p>
              </div>
              <Button asChild size="sm" className="rounded-full shadow-lg">
                <Link href="/privacy">Privacy Policy</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Minimal Footer */}
        <div className="text-center text-[10px] text-muted-foreground py-10 uppercase tracking-[0.2em]">
          &copy; {new Date().getFullYear()} HomeFixCare Operations
        </div>
      </div>
    </div>
  );
}
