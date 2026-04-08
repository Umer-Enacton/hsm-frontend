"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Check,
  XCircle,
  Info,
  Loader2,
  Lock,
  TrendingUp,
  BarChart3,
  Star,
  Clock,
  CreditCard,
  IndianRupee,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { api, API_ENDPOINTS } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { AdminPageHeader, StatCard } from "@/components/admin/shared";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Plan {
  id: number;
  name: string;
  description: string | null;
  monthlyPrice: number;
  yearlyPrice: number;
  trialDays: number;
  platformFeePercentage: number;
  maxServices: number;
  maxBookingsPerMonth: number | null;
  prioritySupport: boolean;
  analyticsAccess: boolean;
  razorpayMonthlyPlanId: string | null;
  razorpayYearlyPlanId: string | null;
  benefits: string[] | null;
  features: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  subscriberCount?: number;
}

// Available analytics charts - exactly matching provider side
const AVAILABLE_CHARTS = [
  {
    id: "revenue_chart",
    name: "Revenue Trends",
    icon: TrendingUp,
    tier: "pro",
    color: "bg-green-100 text-green-700",
  },
  {
    id: "status_chart",
    name: "Booking Status",
    icon: Star,
    tier: "pro",
    color: "bg-amber-100 text-amber-700",
  },
  {
    id: "trends",
    name: "Service Performance",
    icon: BarChart3,
    tier: "premium",
    color: "bg-blue-100 text-blue-700",
  },
  {
    id: "time_patterns",
    name: "Time Patterns & Busy Hours",
    icon: Clock,
    tier: "premium",
    color: "bg-purple-100 text-purple-700",
  },
];

interface PlanFormData {
  name: string;
  description: string;
  monthlyPrice: string;
  yearlyPrice: string;
  trialDays: string;
  platformFeePercentage: string;
  maxServices: string;
  maxBookingsPerMonth: string;
  prioritySupport: boolean;
  analyticsAccess: boolean;
  benefits: string;
}

interface DeletePlanState {
  isOpen: boolean;
  plan: Plan | null;
  subscriberCount: number;
  migrateToPlanId: string;
  password: string;
}

export default function AdminSubscriptionPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState<PlanFormData>({
    name: "",
    description: "",
    monthlyPrice: "",
    yearlyPrice: "",
    trialDays: "",
    platformFeePercentage: "5",
    maxServices: "4",
    maxBookingsPerMonth: "",
    prioritySupport: false,
    analyticsAccess: true,
    benefits: "",
  });

  const [deleteState, setDeleteState] = useState<DeletePlanState>({
    isOpen: false,
    plan: null,
    subscriberCount: 0,
    migrateToPlanId: "",
    password: "",
  });

  const [selectedCharts, setSelectedCharts] = useState<string[]>([]);

  // Fetch plans
  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<{ message: string; data: Plan[] }>(
        API_ENDPOINTS.SUBSCRIPTION_PLANS,
      );
      if (response && response.data) {
        setPlans(response.data);
      }
    } catch (error: any) {
      console.error("Error fetching plans:", error);
      toast.error(error?.message || "Failed to fetch plans");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Filter plans based on search
  const filteredPlans = useMemo(() => {
    if (!searchQuery) return plans;
    return plans.filter(
      (plan) =>
        plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.description?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [plans, searchQuery]);

  // Calculate stats
  const stats = useMemo(
    () => ({
      total: plans.length,
      active: plans.filter((p) => p.isActive).length,
      inactive: plans.filter((p) => !p.isActive).length,
      totalSubscribers: plans.reduce(
        (sum, p) => sum + (p.subscriberCount || 0),
        0,
      ),
    }),
    [plans],
  );

  // Open add/edit dialog
  const openEditDialog = useCallback((plan?: Plan) => {
    if (plan) {
      setCurrentPlan(plan);

      // Parse features JSON to get allowedGraphs
      let allowedGraphs: string[] = [];
      if (plan.features) {
        try {
          const features = JSON.parse(plan.features);
          allowedGraphs = features.allowedGraphs || [];
        } catch {
          allowedGraphs = [];
        }
      }

      setSelectedCharts(allowedGraphs);

      setFormData({
        name: plan.name,
        description: plan.description || "",
        monthlyPrice: (plan.monthlyPrice / 100).toString(),
        yearlyPrice: (plan.yearlyPrice / 100).toString(),
        trialDays: plan.trialDays.toString(),
        platformFeePercentage: plan.platformFeePercentage.toString(),
        maxServices: plan.maxServices.toString(),
        maxBookingsPerMonth:
          plan.maxBookingsPerMonth === null
            ? ""
            : plan.maxBookingsPerMonth.toString(),
        prioritySupport: plan.prioritySupport,
        analyticsAccess: plan.analyticsAccess,
        benefits: plan.benefits?.join(", ") || "",
      });
    } else {
      setCurrentPlan(null);

      // Default charts for new plan (Pro plan baseline - no premium features)
      setSelectedCharts(["revenue_chart", "status_chart"]);

      setFormData({
        name: "",
        description: "",
        monthlyPrice: "",
        yearlyPrice: "",
        trialDays: "0",
        platformFeePercentage: "5",
        maxServices: "4",
        maxBookingsPerMonth: "",
        prioritySupport: false,
        analyticsAccess: true,
        benefits: "",
      });
    }
    setIsEditDialogOpen(true);
  }, []);

  // Handle form submit
  const handleFormSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);

      try {
        const benefits = formData.benefits
          .split(",")
          .map((b) => b.trim())
          .filter(Boolean);

        const payload = {
          ...formData,
          monthlyPrice: parseInt(formData.monthlyPrice) * 100,
          yearlyPrice: parseInt(formData.yearlyPrice) * 100,
          trialDays: parseInt(formData.trialDays),
          platformFeePercentage: parseInt(formData.platformFeePercentage),
          maxServices: parseInt(formData.maxServices),
          maxBookingsPerMonth: formData.maxBookingsPerMonth
            ? parseInt(formData.maxBookingsPerMonth)
            : null,
          benefits,
          allowedGraphs: selectedCharts,
        };

        if (currentPlan) {
          await api.put<any>(
            API_ENDPOINTS.SUBSCRIPTION_PLAN_BY_ID(currentPlan.id),
            payload,
          );
          toast.success("Plan updated successfully");
        } else {
          await api.post<any>(API_ENDPOINTS.SUBSCRIPTION_PLANS, payload);
          toast.success("Plan created successfully");
        }

        setIsEditDialogOpen(false);
        fetchPlans();
      } catch (error: any) {
        console.error("Error saving plan:", error);
        toast.error(error?.message || "Failed to save plan");
      } finally {
        setSubmitting(false);
      }
    },
    [currentPlan, formData, fetchPlans, selectedCharts],
  );

  // Open delete confirmation
  const openDeleteDialog = useCallback((plan: Plan) => {
    setDeleteState({
      isOpen: true,
      plan,
      subscriberCount: plan.subscriberCount || 0,
      migrateToPlanId: "",
      password: "",
    });
  }, []);

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!deleteState.plan) return;

    setSubmitting(true);

    try {
      const payload: any = {
        password: deleteState.password,
      };

      if (deleteState.subscriberCount > 0) {
        if (!deleteState.migrateToPlanId) {
          toast.error("Please select a plan to migrate subscribers to");
          setSubmitting(false);
          return;
        }
        payload.migrateToPlanId = parseInt(deleteState.migrateToPlanId);
      }

      await api.delete(
        API_ENDPOINTS.SUBSCRIPTION_PLAN_BY_ID(deleteState.plan.id),
      );

      toast.success("Plan deleted successfully");
      setIsDeleteDialogOpen(false);
      setDeleteState({
        isOpen: false,
        plan: null,
        subscriberCount: 0,
        migrateToPlanId: "",
        password: "",
      });
      fetchPlans();
    } catch (error: any) {
      console.error("Error deleting plan:", error);
      if (error.cause?.count) {
        setDeleteState((prev) => ({
          ...prev,
          subscriberCount: error.cause.count,
        }));
        toast.warning("This plan has active subscribers. Please migrate them.");
      } else {
        toast.error(error?.message || "Failed to delete plan");
      }
    } finally {
      setSubmitting(false);
    }
  }, [deleteState, fetchPlans]);

  // Toggle plan active status
  const togglePlanStatus = useCallback(
    async (plan: Plan) => {
      try {
        await api.put(API_ENDPOINTS.SUBSCRIPTION_PLAN_BY_ID(plan.id), {
          ...plan,
          isActive: !plan.isActive,
        });

        toast.success(`Plan ${!plan.isActive ? "activated" : "deactivated"}`);
        fetchPlans();
      } catch (error: any) {
        console.error("Error toggling plan status:", error);
        toast.error(error?.message || "Failed to update plan status");
      }
    },
    [fetchPlans],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Subscription Plans"
        description="Manage subscription plans for providers"
        onRefresh={fetchPlans}
      />

      {/* Statistics */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4">
        <StatCard
          title="Total Plans"
          value={stats.total}
          icon={CreditCard}
          variant="blue"
        />
        <StatCard
          title="Active Plans"
          value={stats.active}
          change={`${stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% of total`}
          icon={CheckCircle2}
          trend="up"
          variant="emerald"
        />
        <StatCard
          title="Inactive Plans"
          value={stats.inactive}
          icon={XCircle}
          trend="neutral"
          variant="red"
        />
        <StatCard
          title="Total Subscribers"
          value={stats.totalSubscribers}
          icon={Check}
          variant="purple"
        />
      </div>

      {/* Header with Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search plans..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button
          onClick={() => openEditDialog()}
          className="text-white shadow-lg dark:text-black"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Plan
        </Button>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing <span className="font-medium">{filteredPlans.length}</span> of{" "}
        <span className="font-medium">{plans.length}</span> plans
      </div>

      {/* Plans Table */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-md" />
          ))}
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 p-12 text-center">
          <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No Plans Found</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            {searchQuery
              ? "No plans match your search criteria."
              : "Get started by creating your first subscription plan."}
          </p>
          {!searchQuery && (
            <Button
              onClick={() => openEditDialog()}
              className="mt-4"
              variant="outline"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Plan
            </Button>
          )}
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-[18%] py-4 px-4">Plan</TableHead>
                <TableHead className="w-[12%] py-4 px-4">Monthly</TableHead>
                <TableHead className="w-[12%] py-4 px-4">Yearly</TableHead>
                <TableHead className="w-[10%] py-4 px-4">Trial</TableHead>
                <TableHead className="w-[10%] py-4 px-4">
                  Platform Fee
                </TableHead>
                <TableHead className="w-[14%] py-4 px-4">Limits</TableHead>
                <TableHead className="w-[12%] py-4 px-4">Analytics</TableHead>
                <TableHead className="w-[8%] py-4 px-4">Status</TableHead>
                <TableHead className="w-[6%] py-4 px-4 text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlans.map((plan) => (
                <TableRow
                  key={plan.id}
                  className="hover:bg-muted/50 transition-colors border-b last:border-b-0"
                >
                  {/* Plan Column */}
                  <TableCell className="py-4 px-4">
                    <div>
                      <div className="font-semibold text-sm">{plan.name}</div>
                      {plan.description && (
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {plan.description}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Monthly Price */}
                  <TableCell className="py-4 px-4">
                    {plan.monthlyPrice === 0 ? (
                      <Badge variant="outline">Free</Badge>
                    ) : (
                      <div className="flex items-center gap-0.5 font-semibold text-sm">
                        <IndianRupee className="h-3.5 w-3.5 text-foreground" />
                        <span>{plan.monthlyPrice / 100}</span>
                      </div>
                    )}
                  </TableCell>

                  {/* Yearly Price */}
                  <TableCell className="py-4 px-4">
                    {plan.yearlyPrice === 0 ? (
                      <Badge variant="outline">Free</Badge>
                    ) : (
                      <div className="flex items-center gap-0.5 font-semibold text-sm">
                        <IndianRupee className="h-3.5 w-3.5 text-foreground" />
                        <span>{plan.yearlyPrice / 100}</span>
                      </div>
                    )}
                  </TableCell>

                  {/* Trial Days */}
                  <TableCell className="py-4 px-4">
                    {plan.trialDays > 0 ? (
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                        {plan.trialDays} days
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  {/* Platform Fee */}
                  <TableCell className="py-4 px-4">
                    <Badge
                      variant="outline"
                      className={
                        plan.platformFeePercentage <= 5
                          ? "bg-green-100 text-green-700 hover:bg-green-200 border-green-200"
                          : plan.platformFeePercentage <= 10
                            ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200"
                            : "bg-red-100 text-red-700 hover:bg-red-200 border-red-200"
                      }
                    >
                      {plan.platformFeePercentage}%
                    </Badge>
                  </TableCell>

                  {/* Limits */}
                  <TableCell className="py-4 px-4">
                    <div className="text-xs space-y-1">
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Services:</span>
                        <span className="font-medium">
                          {plan.maxServices === -1
                            ? "Unlimited"
                            : plan.maxServices}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Bookings:</span>
                        <span className="font-medium">
                          {plan.maxBookingsPerMonth === -1
                            ? "Unlimited"
                            : plan.maxBookingsPerMonth === null
                              ? "100"
                              : plan.maxBookingsPerMonth}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Analytics Charts */}
                  <TableCell className="py-4 px-4">
                    {plan.analyticsAccess ? (
                      <div className="flex flex-wrap gap-1">
                        {(() => {
                          let allowedGraphs: string[] = [];
                          if (plan.features) {
                            try {
                              const features = JSON.parse(plan.features);
                              allowedGraphs = features.allowedGraphs || [];
                            } catch {
                              allowedGraphs = [];
                            }
                          }
                          return allowedGraphs.slice(0, 2).map((graphId) => {
                            const chart = AVAILABLE_CHARTS.find(
                              (c) => c.id === graphId,
                            );
                            return chart ? (
                              <Badge
                                key={graphId}
                                className={`text-xs ${
                                  chart.tier === "premium"
                                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0"
                                    : "bg-blue-100 text-blue-700 border-blue-200"
                                }`}
                              >
                                {chart.name}
                              </Badge>
                            ) : null;
                          });
                        })()}
                        {(() => {
                          let allowedGraphs: string[] = [];
                          if (plan.features) {
                            try {
                              const features = JSON.parse(plan.features);
                              allowedGraphs = features.allowedGraphs || [];
                            } catch {
                              allowedGraphs = [];
                            }
                          }
                          if (allowedGraphs.length > 2) {
                            return (
                              <Badge variant="outline" className="text-xs">
                                +{allowedGraphs.length - 2} more
                              </Badge>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        No access
                      </span>
                    )}
                  </TableCell>

                  {/* Status */}
                  <TableCell className="py-4 px-4">
                    <Badge
                      className={`${
                        plan.isActive
                          ? "bg-green-100 text-green-700 hover:bg-green-200 border-green-200"
                          : "bg-red-100 text-red-700 hover:bg-red-200 border-red-200"
                      }`}
                    >
                      {plan.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="py-4 px-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => openEditDialog(plan)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit Plan
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => togglePlanStatus(plan)}
                        >
                          {plan.isActive ? (
                            <>
                              <XCircle className="h-4 w-4 mr-2 text-red-500" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => openDeleteDialog(plan)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Plan
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto max-w-7xl">
          <DialogHeader>
            <DialogTitle>
              {currentPlan ? "Edit Plan" : "Create New Plan"}
            </DialogTitle>
            <DialogDescription>
              {currentPlan
                ? "Update the subscription plan details"
                : "Create a new subscription plan for providers"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-6">
            {/* Two Column Layout */}
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column - Plan Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Plan Details
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="name">Plan Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Pro Plan"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Plan description..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="monthlyPrice">Monthly (₹)</Label>
                    <Input
                      id="monthlyPrice"
                      type="number"
                      min="0"
                      placeholder="200"
                      value={formData.monthlyPrice}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          monthlyPrice: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yearlyPrice">Yearly (₹)</Label>
                    <Input
                      id="yearlyPrice"
                      type="number"
                      min="0"
                      placeholder="2400"
                      value={formData.yearlyPrice}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          yearlyPrice: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="trialDays">Trial Days</Label>
                    <Input
                      id="trialDays"
                      type="number"
                      min="0"
                      placeholder="7"
                      value={formData.trialDays}
                      onChange={(e) =>
                        setFormData({ ...formData, trialDays: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="platformFeePercentage">
                      Platform Fee (%)
                    </Label>
                    <Input
                      id="platformFeePercentage"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.platformFeePercentage}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          platformFeePercentage: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="maxServices">Services</Label>
                    <Input
                      id="maxServices"
                      type="number"
                      min="-1"
                      value={formData.maxServices}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxServices: e.target.value,
                        })
                      }
                    />
                    <p className="text-[10px] text-muted-foreground">
                      -1 = unlimited
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxBookingsPerMonth">Bookings</Label>
                    <Input
                      id="maxBookingsPerMonth"
                      type="number"
                      min="-1"
                      placeholder="100"
                      value={formData.maxBookingsPerMonth}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxBookingsPerMonth: e.target.value,
                        })
                      }
                    />
                    <p className="text-[10px] text-muted-foreground">
                      -1 = unlimited
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="benefits">Benefits (comma separated)</Label>
                  <Textarea
                    id="benefits"
                    placeholder="Priority Support, Basic Analytics, Email Support"
                    value={formData.benefits}
                    onChange={(e) =>
                      setFormData({ ...formData, benefits: e.target.value })
                    }
                    rows={2}
                  />
                </div>

                {/* Feature Toggles */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Priority Support</Label>
                      <p className="text-xs text-muted-foreground">
                        Providers get priority support
                      </p>
                    </div>
                    <Switch
                      checked={formData.prioritySupport}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, prioritySupport: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-md border p-3">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Analytics Access</Label>
                      <p className="text-xs text-muted-foreground">
                        Providers can access analytics
                      </p>
                    </div>
                    <Switch
                      checked={formData.analyticsAccess}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, analyticsAccess: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - Charts Selection & Preview */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Analytics Charts
                </h3>

                {/* Charts Selection */}
                {formData.analyticsAccess && (
                  <div className="space-y-3 rounded-md border p-4 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20">
                    <div>
                      <Label className="text-sm font-semibold">
                        Select Available Charts
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Providers will see these charts in analytics
                      </p>
                    </div>
                    <div className="space-y-2">
                      {AVAILABLE_CHARTS.map((chart) => {
                        const IconComponent = chart.icon;
                        const isSelected = selectedCharts.includes(chart.id);
                        return (
                          <div
                            key={chart.id}
                            className={`flex items-center justify-between gap-2 rounded-md border bg-background/50 p-3 transition-all ${
                              isSelected
                                ? "border-purple-400 bg-purple-100/70 dark:border-purple-600 dark:bg-purple-950/50 shadow-sm"
                                : "opacity-70"
                            }`}
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <Checkbox
                                id={chart.id}
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedCharts([
                                      ...selectedCharts,
                                      chart.id,
                                    ]);
                                  } else {
                                    setSelectedCharts(
                                      selectedCharts.filter(
                                        (id) => id !== chart.id,
                                      ),
                                    );
                                  }
                                }}
                              />
                              <IconComponent className="h-4 w-4 text-muted-foreground" />
                              <Label
                                htmlFor={chart.id}
                                className="text-sm font-normal cursor-pointer flex-1"
                              >
                                {chart.name}
                              </Label>
                            </div>
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                chart.tier === "premium"
                                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-0"
                                  : "bg-blue-100 text-blue-700 border-blue-200"
                              }`}
                            >
                              {chart.tier === "premium" ? "Premium" : "Pro"}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                    {selectedCharts.length === 0 && (
                      <p className="text-xs text-amber-600 font-medium">
                        ⚠️ No charts selected - providers won't see any
                        analytics
                      </p>
                    )}
                  </div>
                )}

                {/* Live Preview Card */}
                <div className="space-y-3 rounded-md border-2 border-dashed border-green-300 p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                  <div>
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      Provider Preview
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      How this plan appears to providers
                    </p>
                  </div>

                  {/* Provider Preview Card - Exact match to provider side */}
                  <div className="relative flex flex-col rounded-xl border-2 transition-all duration-300 h-full border-gray-200 bg-white hover:shadow-lg">
                    {/* Card Header */}
                    <div
                      className={`p-4 text-center bg-gradient-to-r ${
                        formData.name.toLowerCase().includes("premium")
                          ? "from-purple-600 to-indigo-600 text-white"
                          : formData.name.toLowerCase().includes("pro")
                            ? "from-blue-600 to-cyan-600 text-white"
                            : "from-gray-600 to-gray-700 text-white"
                      }`}
                    >
                      <h3 className="text-xl font-bold">
                        {formData.name || "Plan Name"}
                      </h3>
                    </div>

                    {/* Card Body */}
                    <div className="flex flex-col h-full p-4">
                      {/* Price */}
                      <div className="text-center mb-4">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-3xl font-black text-gray-900">
                            ₹{formData.monthlyPrice || "0"}
                          </span>
                          <span className="text-gray-500">/month</span>
                        </div>
                        {formData.yearlyPrice &&
                          formData.yearlyPrice !== formData.monthlyPrice && (
                            <p className="text-xs text-gray-500 mt-1">
                              Yearly: ₹{formData.yearlyPrice}
                              {formData.monthlyPrice &&
                                parseInt(formData.yearlyPrice) <
                                  parseInt(formData.monthlyPrice) * 12 && (
                                  <span className="text-green-600 ml-1">
                                    (Save ₹
                                    {parseInt(formData.monthlyPrice) * 12 -
                                      parseInt(formData.yearlyPrice)}
                                    /year)
                                  </span>
                                )}
                            </p>
                          )}
                      </div>

                      {/* Platform Fee */}
                      <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 mb-3">
                        <span className="text-sm text-gray-600">
                          Platform Fee
                        </span>
                        <span
                          className={`text-sm font-bold ${
                            parseInt(formData.platformFeePercentage || "0") <= 5
                              ? "text-green-600"
                              : parseInt(
                                    formData.platformFeePercentage || "0",
                                  ) <= 10
                                ? "text-yellow-600"
                                : "text-red-600"
                          }`}
                        >
                          {formData.platformFeePercentage || "0"}%
                        </span>
                      </div>

                      {/* Benefits */}
                      {formData.benefits && (
                        <div className="space-y-2 mb-3">
                          {formData.benefits.split(",").map(
                            (benefit, idx) =>
                              benefit.trim() && (
                                <div
                                  key={idx}
                                  className="flex items-start gap-2 text-sm"
                                >
                                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                  <span>{benefit.trim()}</span>
                                </div>
                              ),
                          )}
                        </div>
                      )}

                      {/* Limits */}
                      <div className="rounded-lg bg-gray-50 p-3 mb-3 space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Services:</span>
                          <span className="font-medium">
                            {formData.maxServices === "-1"
                              ? "Unlimited"
                              : formData.maxServices || "4"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Bookings/month:</span>
                          <span className="font-medium">
                            {formData.maxBookingsPerMonth === "-1"
                              ? "Unlimited"
                              : formData.maxBookingsPerMonth || "100"}
                          </span>
                        </div>
                      </div>

                      {/* Analytics Charts Preview - Shows locked/unlocked state */}
                      <div className="mt-auto">
                        <p className="text-xs font-semibold text-gray-700 mb-2">
                          Analytics Dashboard:
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {AVAILABLE_CHARTS.map((chart) => {
                            const IconComponent = chart.icon;
                            const isEnabled = selectedCharts.includes(chart.id);
                            return (
                              <div
                                key={chart.id}
                                className={`flex items-center gap-2 rounded-lg p-2 text-xs border ${
                                  isEnabled
                                    ? "bg-white border-green-200 shadow-sm"
                                    : "bg-gray-100 border-gray-200 opacity-60"
                                }`}
                              >
                                {isEnabled ? (
                                  <IconComponent className="h-4 w-4 text-green-600 flex-shrink-0" />
                                ) : (
                                  <Lock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                )}
                                <span
                                  className={
                                    isEnabled
                                      ? "text-gray-700"
                                      : "text-gray-400 line-through"
                                  }
                                >
                                  {chart.name}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        {selectedCharts.length === 0 && (
                          <p className="text-xs text-gray-400 mt-2 text-center">
                            No analytics available
                          </p>
                        )}
                      </div>

                      {/* Status Badge */}
                      <div className="mt-4 text-center">
                        <Badge
                          className={`${
                            currentPlan?.isActive !== false
                              ? "bg-green-600 text-white"
                              : "bg-red-600 text-white"
                          }`}
                        >
                          {currentPlan?.isActive !== false
                            ? "Active"
                            : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {currentPlan ? "Update" : "Create"} Plan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Delete Plan: {deleteState.plan?.name}</DialogTitle>
            <DialogDescription>
              {deleteState.subscriberCount > 0 &&
              !deleteState.migrateToPlanId ? (
                <div className="rounded-md bg-amber-50 p-4 text-sm text-amber-800 border border-amber-200 mt-4">
                  <div className="flex items-center gap-2 mb-2 font-semibold">
                    <Info className="h-4 w-4" />
                    Active Subscribers Found
                  </div>
                  <p className="mb-3">
                    This plan has <strong>{deleteState.subscriberCount}</strong>{" "}
                    active subscriber(s). You must migrate them to another plan
                    before deleting.
                  </p>
                  <Label htmlFor="migrateToPlanId">Migrate to Plan:</Label>
                  <select
                    id="migrateToPlanId"
                    className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={deleteState.migrateToPlanId}
                    onChange={(e) =>
                      setDeleteState({
                        ...deleteState,
                        migrateToPlanId: e.target.value,
                      })
                    }
                  >
                    <option value="">Select a plan...</option>
                    {plans
                      .filter((p) => p.id !== deleteState.plan?.id)
                      .map((p) => (
                        <option key={p.id} value={p.id.toString()}>
                          {p.name}
                        </option>
                      ))}
                  </select>
                </div>
              ) : (
                "This action cannot be undone. Are you sure you want to delete this plan?"
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {deleteState.subscriberCount > 0 && (
              <div className="rounded-md bg-amber-50 p-4 text-sm text-amber-800 border border-amber-200">
                <p>
                  <strong>Warning:</strong> Deleting this plan will affect{" "}
                  {deleteState.subscriberCount} provider(s).
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="deletePassword">Admin Password *</Label>
              <Input
                id="deletePassword"
                type="password"
                placeholder="Enter your admin password"
                value={deleteState.password}
                onChange={(e) =>
                  setDeleteState({ ...deleteState, password: e.target.value })
                }
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setDeleteState({
                    isOpen: false,
                    plan: null,
                    subscriberCount: 0,
                    migrateToPlanId: "",
                    password: "",
                  });
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={submitting || !deleteState.password}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {submitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Delete Plan
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
