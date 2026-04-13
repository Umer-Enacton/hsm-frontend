"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Lock,
  UserCheck,
  Database,
  Eye,
  Bell,
  CreditCard,
  Mail,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicyPage() {
  const lastUpdated = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-blue-600 transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">Privacy Policy</span>
        </div>

        {/* Header */}
        <div className="bg-white dark:bg-slate-900 border rounded-md p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Privacy <span className="text-blue-600">Policy</span>
              </h1>
              <p className="text-muted-foreground mt-1 text-sm md:text-base">
                How we protect and handle your personal data across Home Service Management.
              </p>
            </div>
            <Badge
              variant="outline"
              className="w-fit h-fit py-1 px-3 border-blue-200 text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-900"
            >
              Last Updated: {lastUpdated}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="grid gap-6">
          <Card className="shadow-sm border-t-4 border-t-blue-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-blue-600" />
                Our Data Promise
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground leading-relaxed">
              We collect only what&apos;s necessary to connect customers with service professionals,
              process payments securely via Razorpay, and provide a seamless booking experience.
              Your data is encrypted, protected, and never sold to third parties.
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-indigo-600" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1">
                <p>• Name, email, and phone number</p>
                <p>• Profile photo (optional)</p>
                <p>• Service addresses for provider navigation</p>
                <p>• Staff member details (for providers)</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Database className="h-4 w-4 text-blue-600" />
                  Transactional Data
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1">
                <p>• Booking history & payment receipts</p>
                <p>• Service preferences & search history</p>
                <p>• Cancellation & reschedule records</p>
                <p>• Payout & earnings information</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-emerald-600" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1">
                <p>• Payment processed via Razorpay</p>
                <p>• We don&apos;t store your card details</p>
                <p>• PCI DSS compliant payment processing</p>
                <p>• Encrypted transaction logs</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Bell className="h-4 w-4 text-amber-600" />
                  Notification Data
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1">
                <p>• Push notifications for bookings</p>
                <p>• SMS reminders (upcoming services)</p>
                <p>• Email notifications & receipts</p>
                <p>• FCM device tokens for delivery</p>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-600" />
                How We Use Your Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
                <div className="flex gap-3 text-sm">
                  <span className="text-blue-600 font-bold tracking-tighter shrink-0">01.</span>
                  <span className="text-slate-600 dark:text-slate-400">Process bookings and connect customers with nearby service professionals</span>
                </div>
                <div className="flex gap-3 text-sm">
                  <span className="text-blue-600 font-bold tracking-tighter shrink-0">02.</span>
                  <span className="text-slate-600 dark:text-slate-400">Facilitate secure payments via Razorpay</span>
                </div>
                <div className="flex gap-3 text-sm">
                  <span className="text-blue-600 font-bold tracking-tighter shrink-0">03.</span>
                  <span className="text-slate-600 dark:text-slate-400">Send booking reminders (day before, day of service)</span>
                </div>
                <div className="flex gap-3 text-sm">
                  <span className="text-blue-600 font-bold tracking-tighter shrink-0">04.</span>
                  <span className="text-slate-600 dark:text-slate-400">Process refunds and manage cancellations per policy</span>
                </div>
                <div className="flex gap-3 text-sm">
                  <span className="text-blue-600 font-bold tracking-tighter shrink-0">05.</span>
                  <span className="text-slate-600 dark:text-slate-400">Assign staff to bookings and manage provider operations</span>
                </div>
                <div className="flex gap-3 text-sm">
                  <span className="text-blue-600 font-bold tracking-tighter shrink-0">06.</span>
                  <span className="text-slate-600 dark:text-slate-400">Calculate and process provider/staff payouts</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm bg-slate-900 text-white">
            <CardContent className="py-6">
              <div className="flex items-center gap-4 mb-4">
                <Lock className="h-6 w-6 text-blue-400" />
                <h3 className="font-bold">Security Measures</h3>
              </div>
              <div className="grid sm:grid-cols-2 gap-6 text-xs text-slate-400">
                <div className="space-y-1">
                  <p className="font-semibold text-white">Encryption</p>
                  <p>All data is encrypted in transit using SSL/TLS protocols</p>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-white">Secure Payments</p>
                  <p>Payments processed via Razorpay (PCI DSS compliant)</p>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-white">Data Minimization</p>
                  <p>We only collect data necessary for platform operations</p>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-white">Access Control</p>
                  <p>Role-based access protects sensitive user information</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-dashed text-center py-10 bg-muted/10">
            <CardContent className="space-y-4">
              <Mail className="h-8 w-8 text-blue-600 mx-auto" />
              <div>
                <h4 className="font-bold">Privacy Questions?</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Contact our support team for any privacy-related concerns
                </p>
              </div>
              <Button asChild variant="outline" size="sm" className="rounded-full px-8">
                <Link href="/terms">View Terms & Conditions</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center text-[10px] text-muted-foreground py-10 uppercase tracking-[0.2em] opacity-60">
          Home Service Management &bull; Privacy Standards
        </div>
      </div>
    </div>
  );
}
