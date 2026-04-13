"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Clock,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  UserCheck,
  Users,
  CreditCard,
  Bell,
  Timer,
  Ban,
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
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-blue-600 transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">
            Terms & Conditions
          </span>
        </div>

        {/* Header */}
        <div className="bg-white dark:bg-slate-900 border rounded-xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Terms & <span className="text-blue-600">Conditions</span>
              </h1>
              <p className="text-muted-foreground mt-1">
                The governing rules for the Home Service Management platform.
              </p>
            </div>
            <Badge variant="secondary" className="w-fit h-fit py-1 px-3">
              Last Updated: {lastUpdated}
            </Badge>
          </div>
        </div>

        {/* Main Sections */}
        <div className="grid gap-6">
          {/* Agreement */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 text-sm">
              <div className="flex items-center gap-2 font-semibold">
                <Shield className="h-4 w-4 text-blue-600" />
                Agreement to Terms
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground leading-relaxed">
              Welcome to Home Service Management. By using our platform, you agree to these
              terms. We connect customers with verified service providers. While we facilitate
              bookings and payments, the actual service contract is between you and the Service
              Professional.
            </CardContent>
          </Card>

          {/* Subscription Plans & Fees */}
          <Card className="shadow-sm border-l-4 border-l-purple-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                Subscription Plans & Platform Fees
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Providers choose a subscription plan that determines their platform fee percentage:
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                {/* Free Plan */}
                <div className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-foreground">Free</h4>
                    <Badge className="bg-gray-200 text-gray-700">15% Fee</Badge>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• 4 Services</li>
                    <li>• 100 bookings/month</li>
                    <li>• Basic dashboard</li>
                    <li>• 3 images per service</li>
                  </ul>
                </div>
                {/* Pro Plan */}
                <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-blue-700">Pro</h4>
                    <Badge className="bg-blue-600">10% Fee</Badge>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• 15 Services</li>
                    <li>• 500 bookings/month</li>
                    <li>• Advanced analytics</li>
                    <li>• 7 images per service</li>
                    <li>• ₹200/month (or ₹2,400/year)</li>
                  </ul>
                </div>
                {/* Premium Plan */}
                <div className="border rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-purple-700">Premium</h4>
                    <Badge className="bg-purple-600">5% Fee</Badge>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Unlimited services</li>
                    <li>• Unlimited bookings</li>
                    <li>• Full analytics suite</li>
                    <li>• 15 images per service</li>
                    <li>• Priority support</li>
                    <li>• ₹500/month (or ₹6,000/year)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Terms */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-green-600" />
                Payment Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-3 rounded-md bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800">
                  <p className="font-semibold text-foreground text-sm mb-1">100% Upfront Payment</p>
                  <p className="text-xs text-muted-foreground">
                    Full payment required via Razorpay to lock your booking slot
                  </p>
                </div>
                <div className="p-3 rounded-md bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800">
                  <p className="font-semibold text-foreground text-sm mb-1">2-Minute Slot Lock</p>
                  <p className="text-xs text-muted-foreground">
                    Payment intents expire after 2 minutes; slot released on failure
                  </p>
                </div>
              </div>
              <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-800">
                <p className="font-semibold text-foreground text-sm mb-2">Payment Split (Per Booking)</p>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground">Platform Fee</span>
                    <p className="font-bold text-foreground">5-15%</p>
                    <p className="text-muted-foreground">Based on provider plan</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Provider Share</span>
                    <p className="font-bold text-foreground">85-95%</p>
                    <p className="text-muted-foreground">After platform fee</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Staff Earning</span>
                    <p className="font-bold text-foreground">Commission</p>
                    <p className="text-muted-foreground">Per booking (if assigned)</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cancellation Policy */}
          <Card className="shadow-sm border-l-4 border-l-rose-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-rose-600" />
                Cancellation & Refund Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-md bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                <p className="font-semibold text-foreground text-sm mb-1">Customer Cancellations</p>
                <p className="text-xs text-muted-foreground">
                  Refund percentage based on hours remaining before service time:
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="p-3 rounded-md bg-emerald-50 dark:bg-emerald-900/10 border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">More than 24h before</span>
                    <Badge className="bg-emerald-600">100% Refund</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Full refund to customer</p>
                </div>
                <div className="p-3 rounded-md bg-blue-50 dark:bg-blue-900/10 border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">12-24 hours before</span>
                    <Badge className="bg-blue-600">75% Refund</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">75% refund (configurable)</p>
                </div>
                <div className="p-3 rounded-md bg-amber-50 dark:bg-amber-900/10 border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">4-12 hours before</span>
                    <Badge className="bg-amber-600">50% Refund</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">50% refund (configurable)</p>
                </div>
                <div className="p-3 rounded-md bg-rose-50 dark:bg-rose-900/10 border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">30min-4 hours before</span>
                    <Badge className="bg-rose-600">25% Refund</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">25% refund (configurable)</p>
                </div>
              </div>
              <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-800 border border-dashed">
                <p className="font-semibold text-foreground text-sm mb-1">Provider Cancellations</p>
                <p className="text-xs text-muted-foreground">
                  If provider cancels: <span className="text-emerald-600 font-semibold">100% refund</span> to customer
                </p>
              </div>
              <p className="text-xs text-muted-foreground italic">
                * Platform fee is retained on all customer cancellations. Exact percentages may be adjusted by platform administration.
              </p>
            </CardContent>
          </Card>

          {/* Reschedule Policy */}
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
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Maximum 2 reschedules per booking</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-rose-600">
                    <Ban className="h-4 w-4" />
                    <span className="font-medium">No changes within 1 hour of service</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Timer className="h-4 w-4 text-amber-500" />
                    <span className="font-medium">Provider has 30 minutes to accept</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-black mb-1">
                    Reschedule Fee
                  </p>
                  <p className="text-3xl font-black text-blue-600">₹100</p>
                  <p className="text-[10px] text-muted-foreground">
                    Non-refundable once request initiated
                  </p>
                </div>
              </div>
              <div className="p-3 rounded-md bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
                <p className="font-semibold text-foreground text-sm mb-1">Reschedule Fee Distribution</p>
                <p className="text-xs text-muted-foreground">
                  When customer cancels a reschedule request after acceptance, provider keeps 50% of reschedule fee (₹50)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Staff Policy */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-cyan-600" />
                Staff & Assignment Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <ul className="space-y-2 ml-4 list-disc">
                <li>
                  <span className="text-foreground">Auto-Assignment:</span> Staff automatically assigned to bookings 1 hour before service time using round-robin with load balancing
                </li>
                <li>
                  <span className="text-foreground">Leave Management:</span> Staff on approved leave are excluded from auto-assignment
                </li>
                <li>
                  <span className="text-foreground">Earnings:</span> Staff earn commission or fixed amount per booking as configured by provider
                </li>
                <li>
                  <span className="text-foreground">Minimum Payout:</span> Staff must accumulate minimum amount before payout (configurable by admin: ₹300-₹1,000)
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Automated Processes */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5 text-amber-600" />
                Automated Processes & Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p className="text-foreground font-medium mb-2">Scheduled Jobs:</p>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="p-2 rounded bg-slate-50 dark:bg-slate-800">
                  <p className="font-medium text-foreground text-xs">Every 30 minutes</p>
                  <p className="text-xs">• Send upcoming reminders (day before)</p>
                  <p className="text-xs">• Send day-of reminders</p>
                  <p className="text-xs">• Auto-reject expired bookings</p>
                </div>
                <div className="p-2 rounded bg-slate-50 dark:bg-slate-800">
                  <p className="font-medium text-foreground text-xs">Every 5 minutes</p>
                  <p className="text-xs">• Auto-assign staff to bookings</p>
                </div>
                <div className="p-2 rounded bg-slate-50 dark:bg-slate-800">
                  <p className="font-medium text-foreground text-xs">Every 6 hours</p>
                  <p className="text-xs">• Auto-cancel missed bookings (after 2 days)</p>
                </div>
                <div className="p-2 rounded bg-slate-50 dark:bg-slate-800">
                  <p className="font-medium text-foreground text-xs">Daily at 8 PM</p>
                  <p className="text-xs">• Send staff reminders for next day</p>
                </div>
                <div className="p-2 rounded bg-slate-50 dark:bg-slate-800">
                  <p className="font-medium text-foreground text-xs">Daily at midnight</p>
                  <p className="text-xs">• Check and expire trial subscriptions</p>
                </div>
                <div className="p-2 rounded bg-slate-50 dark:bg-slate-800">
                  <p className="font-medium text-foreground text-xs">Every 30 seconds</p>
                  <p className="text-xs">• Cleanup expired payment intents</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking Time Limits */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Important Time Limits
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-3 text-sm text-muted-foreground">
              <div className="p-3 rounded-md border">
                <p className="font-medium text-foreground">Booking Acceptance</p>
                <p>Provider has 30 minutes to accept before auto-reject</p>
              </div>
              <div className="p-3 rounded-md border">
                <p className="font-medium text-foreground">Cancellation Cutoff</p>
                <p>Cannot cancel within 30 minutes of service time</p>
              </div>
              <div className="p-3 rounded-md border">
                <p className="font-medium text-foreground">Reschedule Cutoff</p>
                <p>Cannot reschedule within 1 hour of service time</p>
              </div>
              <div className="p-3 rounded-md border">
                <p className="font-medium text-foreground">Payment Lock</p>
                <p>Slot locked for 2 minutes during payment</p>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="shadow-sm bg-muted/20 border-none">
            <CardContent className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <div>
                <h3 className="font-bold">Need clarity on our terms?</h3>
                <p className="text-xs text-muted-foreground">
                  Our support team is available to help with any questions
                </p>
              </div>
              <Button asChild size="sm" className="rounded-full shadow-lg">
                <Link href="/privacy">Privacy Policy</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center text-[10px] text-muted-foreground py-10 uppercase tracking-[0.2em]">
          © {new Date().getFullYear()} Home Service Management
        </div>
      </div>
    </div>
  );
}
