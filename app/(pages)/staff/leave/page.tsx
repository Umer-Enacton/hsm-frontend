"use client";

import { useState, useEffect } from "react";
import { api, API_ENDPOINTS } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, X, Check, Clock, CheckCircle, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface LeaveRequest {
  id: number;
  leaveType: "full_day";
  startDate: string;
  endDate: string;
  reason: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled";
  rejectionReason?: string;
  createdAt: string;
  approvedAt?: string;
}

export default function StaffLeavePage() {
  const [leaveHistory, setLeaveHistory] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMultiDay, setIsMultiDay] = useState(false);

  useEffect(() => {
    fetchLeaveHistory();
  }, []);

  const fetchLeaveHistory = async () => {
    setLoading(true);
    try {
      const response = await api.get<{ message: string; data: LeaveRequest[] }>(
        API_ENDPOINTS.STAFF_LEAVE_MY_LEAVE,
      );
      setLeaveHistory(response.data || []);
    } catch (error) {
      console.error("Error fetching leave history:", error);
      toast.error("Failed to load leave history");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitLeave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const startDate = formData.get("startDate") as string;
    const endDate = isMultiDay ? (formData.get("endDate") as string) : startDate;

    const leaveData = {
      leaveType: "full_day" as const,
      startDate,
      endDate,
      reason: formData.get("reason") || undefined,
    };

    try {
      const response = await api.post<{
        message: string;
        data: LeaveRequest;
        warning?: {
          type: string;
          message: string;
          bookings: Array<{
            id: number;
            bookingDate: string;
            startTime: string;
            endTime: string;
            serviceName: string;
          }>;
        };
      }>(API_ENDPOINTS.STAFF_LEAVE, leaveData);

      // Show success message
      toast.success(response.message || "Leave request submitted successfully");

      // Show warning if there are existing bookings
      if (response.warning) {
        toast.warning(response.warning.message, {
          description: `${response.warning.bookings.length} booking(s) found on these dates. Provider will be notified.`,
          duration: 5000,
        });
      }

      setShowRequestDialog(false);
      setIsMultiDay(false);
      fetchLeaveHistory();
    } catch (error: any) {
      console.error("Error submitting leave:", error);
      toast.error(error.response?.data?.message || "Failed to submit leave request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelLeave = async (leaveId: number) => {
    if (!confirm("Are you sure you want to cancel this leave request?")) return;

    try {
      await api.patch(API_ENDPOINTS.STAFF_LEAVE_CANCEL(leaveId), {});
      toast.success("Leave request cancelled");
      fetchLeaveHistory();
    } catch (error: any) {
      console.error("Error cancelling leave:", error);
      toast.error(error.response?.data?.message || "Failed to cancel leave");
    }
  };

  const getStatusBadge = (status: LeaveRequest["status"]) => {
    const config = {
      approved: { label: "Approved", className: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400" },
      pending: { label: "Pending", className: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400" },
      rejected: { label: "Rejected", className: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400" },
      cancelled: { label: "Cancelled", className: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400" },
    };
    return config[status];
  };

  const getStatusIcon = (status: LeaveRequest["status"]) => {
    switch (status) {
      case "approved":
        return <Check className="h-3 w-3" />;
      case "pending":
        return <Clock className="h-3 w-3" />;
      case "rejected":
        return <X className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDurationDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const upcomingLeaves = leaveHistory.filter(
    (l) => l.status === "approved" && new Date(l.endDate) >= new Date()
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leave Management</h1>
          <p className="text-muted-foreground">
            Request leave and view your leave history
          </p>
        </div>
        <Dialog open={showRequestDialog} onOpenChange={(open) => {
          setShowRequestDialog(open);
          if (!open) setIsMultiDay(false);
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Request Leave
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Request Leave</DialogTitle>
              <DialogDescription>
                Submit a full-day leave request for approval by your provider
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitLeave} className="space-y-4">
              {/* Leave Type - Fixed to Full Day */}
              <div className="space-y-2">
                <Label>Leave Type</Label>
                <Input value="Full Day" disabled className="bg-muted" />
              </div>

              {/* Multi-Day Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="multiDay"
                  checked={isMultiDay}
                  onCheckedChange={(checked) => setIsMultiDay(checked as boolean)}
                />
                <Label
                  htmlFor="multiDay"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Enable multi-day leave (date range)
                </Label>
              </div>

              {/* Date Pickers */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">
                    {isMultiDay ? "Start Date *" : "Date *"}
                  </Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                {isMultiDay && (
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date *</Label>
                    <Input
                      id="endDate"
                      name="endDate"
                      type="date"
                      required
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                )}
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label htmlFor="reason">Reason (optional)</Label>
                <Textarea
                  id="reason"
                  name="reason"
                  placeholder="Provide a reason for your leave request..."
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowRequestDialog(false);
                    setIsMultiDay(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Request"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Upcoming Leaves Banner */}
      {upcomingLeaves.length > 0 && (
        <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10 dark:border-emerald-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <div className="flex-1">
                <p className="font-medium text-emerald-900 dark:text-emerald-100">
                  You have upcoming approved leave
                </p>
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  {upcomingLeaves.length} leave{upcomingLeaves.length > 1 ? "s" : ""} scheduled
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leave History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leave History</CardTitle>
          <CardDescription>Your past and current leave requests</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {leaveHistory.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No leave history</p>
              <p className="text-sm">Request your first leave using the button above</p>
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden bg-card shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="py-4 px-4">Date</TableHead>
                    <TableHead className="py-4 px-4">Duration</TableHead>
                    <TableHead className="py-4 px-4">Reason</TableHead>
                    <TableHead className="py-4 px-4">Status</TableHead>
                    <TableHead className="py-4 px-4">Requested</TableHead>
                    <TableHead className="py-4 px-4 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveHistory.map((leave) => {
                    const statusConfig = getStatusBadge(leave.status);
                    const days = getDurationDays(leave.startDate, leave.endDate);
                    return (
                      <TableRow
                        key={leave.id}
                        className="hover:bg-muted/50 transition-colors border-b last:border-b-0"
                      >
                        <TableCell className="py-4 px-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{formatDate(leave.startDate)}</span>
                            {leave.startDate !== leave.endDate && (
                              <>
                                <span className="text-muted-foreground">→</span>
                                <span className="font-medium">{formatDate(leave.endDate)}</span>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          <Badge variant="outline" className="font-medium">
                            {days} day{days > 1 ? "s" : ""}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          <p className="text-sm max-w-[200px] truncate" title={leave.reason || ""}>
                            {leave.reason || "-"}
                          </p>
                          {leave.rejectionReason && (
                            <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                              Rejected: {leave.rejectionReason}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          <Badge className={statusConfig.className} variant="outline">
                            <span className="flex items-center gap-1">
                              {getStatusIcon(leave.status)}
                              {statusConfig.label}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(leave.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </TableCell>
                        <TableCell className="py-4 px-4 text-right">
                          {leave.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancelLeave(leave.id)}
                            >
                              Cancel
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
