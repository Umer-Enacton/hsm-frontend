"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Check,
  X,
  Clock,
  User,
  Mail,
  FileText,
  RefreshCw,
  Filter,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { api, API_ENDPOINTS } from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface StaffLeaveRequest {
  id: number;
  staffId: number;
  staffName: string;
  staffEmail?: string;
  staffEmployeeId?: string;
  leaveType: "full_day" | "half_day" | "hours";
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  reason?: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  rejectionReason?: string;
  createdAt: string;
  approvedAt?: string;
}

type StatusFilter = "all" | "pending" | "approved" | "rejected" | "cancelled";

export default function ProviderStaffLeavePage() {
  const [leaveRequests, setLeaveRequests] = useState<StaffLeaveRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<StaffLeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [searchTerm, setSearchTerm] = useState("");

  // Dialog states
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<StaffLeaveRequest | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [leaveRequests, statusFilter, searchTerm]);

  const fetchLeaveRequests = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<{ message: string; data: StaffLeaveRequest[] }>(
        API_ENDPOINTS.STAFF_LEAVE_BUSINESS,
      );
      setLeaveRequests(response.data || []);
    } catch (error: any) {
      console.error("Error fetching leave requests:", error);
      toast.error(error.message || "Failed to load leave requests");
    } finally {
      setIsLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = [...leaveRequests];

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((req) => req.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (req) =>
          req.staffName.toLowerCase().includes(term) ||
          req.staffEmail?.toLowerCase().includes(term) ||
          req.reason?.toLowerCase().includes(term),
      );
    }

    // Sort by date (newest first)
    filtered.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    setFilteredRequests(filtered);
  };

  const openActionDialog = (request: StaffLeaveRequest, action: "approve" | "reject") => {
    setSelectedRequest(request);
    setActionType(action);
    setRejectionReason("");
    setActionDialogOpen(true);
  };

  const handleAction = async () => {
    if (!selectedRequest || !actionType) return;

    setIsProcessing(true);
    try {
      if (actionType === "approve") {
        await api.put(API_ENDPOINTS.STAFF_LEAVE_APPROVE(selectedRequest.id), {});
        toast.success("Leave request approved");
      } else {
        await api.put(API_ENDPOINTS.STAFF_LEAVE_REJECT(selectedRequest.id), {
          rejectionReason: rejectionReason || "No reason provided",
        });
        toast.success("Leave request rejected");
      }

      setActionDialogOpen(false);
      setSelectedRequest(null);
      setRejectionReason("");
      fetchLeaveRequests();
    } catch (error: any) {
      console.error("Error processing leave request:", error);
      toast.error(error.message || "Failed to process leave request");
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { label: "Pending", className: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 hover:bg-amber-200" },
      approved: { label: "Approved", className: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 hover:bg-emerald-200" },
      rejected: { label: "Rejected", className: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 hover:bg-rose-200" },
      cancelled: { label: "Cancelled", className: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200" },
    };
    return config[status as keyof typeof config] || config.pending;
  };

  const getLeaveTypeLabel = (type: string) => {
    const labels = {
      full_day: "Full Day",
      half_day: "Half Day",
      hours: "Hours",
    };
    return labels[type as keyof typeof labels] || type;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staff Leave Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review and manage staff leave requests
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={fetchLeaveRequests}
          disabled={isLoading}
        >
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                  Pending
                </p>
                <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                  {leaveRequests.filter((r) => r.status === "pending").length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  Approved
                </p>
                <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                  {leaveRequests.filter((r) => r.status === "approved").length}
                </p>
              </div>
              <Check className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-rose-700 dark:text-rose-300">
                  Rejected
                </p>
                <p className="text-2xl font-bold text-rose-900 dark:text-rose-100">
                  {leaveRequests.filter((r) => r.status === "rejected").length}
                </p>
              </div>
              <X className="h-8 w-8 text-rose-600 dark:text-rose-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Total Requests
                </p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {leaveRequests.length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="status-filter">Status:</Label>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as StatusFilter)}
              >
                <SelectTrigger id="status-filter" className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by staff name, email, or reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-3 pr-10 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leave Requests Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all"
                  ? "No leave requests match your filters"
                  : "No leave requests found"}
              </p>
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden bg-card shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="py-4 px-4">Staff</TableHead>
                    <TableHead className="py-4 px-4">Leave Type</TableHead>
                    <TableHead className="py-4 px-4">Duration</TableHead>
                    <TableHead className="py-4 px-4">Reason</TableHead>
                    <TableHead className="py-4 px-4">Status</TableHead>
                    <TableHead className="py-4 px-4">Requested</TableHead>
                    <TableHead className="py-4 px-4 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => {
                    const statusConfig = getStatusBadge(request.status);
                    return (
                      <TableRow
                        key={request.id}
                        className="hover:bg-muted/50 transition-colors border-b last:border-b-0"
                      >
                        <TableCell className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                              <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm">{request.staffName}</p>
                                {request.staffEmployeeId && (
                                  <span className="text-xs bg-muted px-2 py-0.5 rounded">
                                    {request.staffEmployeeId}
                                  </span>
                                )}
                              </div>
                              {request.staffEmail && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Mail className="h-3 w-3" />
                                  {request.staffEmail}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          <p className="text-sm">{getLeaveTypeLabel(request.leaveType)}</p>
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          <p className="text-sm">
                            {formatDate(request.startDate)}
                            {request.startDate !== request.endDate && (
                              <> - {formatDate(request.endDate)}</>
                            )}
                          </p>
                          {request.leaveType === "hours" && request.startTime && request.endTime && (
                            <p className="text-xs text-muted-foreground">
                              {request.startTime} - {request.endTime}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          <p className="text-sm max-w-[200px] truncate" title={request.reason}>
                            {request.reason || "-"}
                          </p>
                          {request.rejectionReason && (
                            <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                              Rejected: {request.rejectionReason}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          <Badge className={statusConfig.className} variant="outline">
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(request.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          <div className="flex items-center justify-end gap-2">
                            {request.status === "pending" ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openActionDialog(request, "approve")}
                                  className="h-8 px-3 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openActionDialog(request, "reject")}
                                  className="h-8 px-3 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedRequest(request);
                                      setActionDialogOpen(true);
                                    }}
                                  >
                                    View Details
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
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

      {/* Action Confirmation Dialog */}
      <AlertDialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {actionType === "approve" ? (
                <>
                  <Check className="h-5 w-5 text-emerald-600" />
                  Approve Leave Request?
                </>
              ) : (
                <>
                  <X className="h-5 w-5 text-rose-600" />
                  Reject Leave Request?
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              {selectedRequest && (
                <>
                  <p>
                    <span className="font-medium">Staff:</span> {selectedRequest.staffName}
                  </p>
                  <p>
                    <span className="font-medium">Leave Type:</span> {getLeaveTypeLabel(selectedRequest.leaveType)}
                  </p>
                  <p>
                    <span className="font-medium">Duration:</span> {formatDate(selectedRequest.startDate)}
                    {selectedRequest.startDate !== selectedRequest.endDate && (
                      <> to {formatDate(selectedRequest.endDate)}</>
                    )}
                  </p>
                  {selectedRequest.reason && (
                    <p>
                      <span className="font-medium">Reason:</span> {selectedRequest.reason}
                    </p>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {actionType === "reject" && (
            <div className="py-4">
              <Label htmlFor="rejection-reason">Rejection Reason (Optional)</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Provide a reason for rejecting this leave request..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              disabled={isProcessing}
              className={
                actionType === "approve"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-rose-600 hover:bg-rose-700"
              }
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : actionType === "approve" ? (
                "Approve"
              ) : (
                "Reject"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
