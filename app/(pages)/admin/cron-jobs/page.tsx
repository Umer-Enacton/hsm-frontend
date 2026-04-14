"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, API_ENDPOINTS } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
  RefreshCw,
  FileText,
  Lock,
  Unlock,
  Plus,
  Edit,
  Trash2,
  Globe,
  ChevronDown,
  ChevronUp,
  Zap,
  Calendar,
  TrendingUp,
  Cpu,
} from "lucide-react";
import {
  AdminPageHeader,
  StatCard,
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/admin/shared";
import { AdminCronJobsSkeleton } from "@/components/admin/skeletons";

interface CronJob {
  id: number;
  name: string;
  displayName: string;
  description: string;
  endpoint: string;
  method: string;
  cronExpression: string | null;
  intervalMinutes: number | null;
  isEnabled: boolean;
  category: string;
  maxRetries: number;
  retryIntervalSeconds: number;
  lastRunAt: string | null;
  lastRunStatus: string | null;
  nextRunAt: string | null;
  successRate: number | null;
  latestLog: {
    id: number;
    status: string;
    startedAt: string;
    durationMs: number | null;
  } | null;
  syncStatus: "not_synced" | "synced" | "sync_failed" | "sync_pending";
  syncError?: string | null;
  lastSyncedAt?: string | null;
  pgCronJobname?: string | null;
}

interface CronStats {
  summary: {
    totalJobs: number;
    enabledJobs: number;
    runningJobs: number;
    recentRuns: number;
    recentSuccess: number;
    recentFailed: number;
    recentSuccessRate: number;
  };
  jobsByCategory: { category: string; count: number }[];
  failedJobs: Array<{
    id: number;
    name: string;
    displayName: string;
    lastRunAt: string | null;
    lastRunStatus: string;
  }>;
}

interface CronLog {
  id: number;
  startedAt: string;
  completedAt: string | null;
  status: string;
  result: string | null;
  errorMessage: string | null;
  errorDetails: string | null;
  triggeredBy: string;
  triggeredByUserId: number | null;
  durationMs: number | null;
  retryCount: number;
  jobId: number;
}

const categoryConfig: Record<string, { label: string; icon: typeof Zap; variant: "blue" | "purple" | "emerald" | "orange" | "red" }> = {
  booking: { label: "Booking", icon: Calendar, variant: "blue" },
  subscription: { label: "Subscription", icon: TrendingUp, variant: "purple" },
  staff: { label: "Staff", icon: Cpu, variant: "emerald" },
  payment: { label: "Payment", icon: Globe, variant: "orange" },
  maintenance: { label: "Maintenance", icon: Zap, variant: "red" },
};

const statusConfig: Record<string, { icon: typeof CheckCircle; label: string; className: string }> = {
  success: { icon: CheckCircle, label: "Success", className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-300" },
  failed: { icon: XCircle, label: "Failed", className: "bg-rose-100 text-rose-700 hover:bg-rose-200 border-rose-300" },
  running: { icon: RefreshCw, label: "Running", className: "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-300" },
  partial_success: { icon: AlertCircle, label: "Partial", className: "bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-300" },
};

const syncStatusConfig: Record<string, { icon: typeof CheckCircle; label: string; className: string }> = {
  synced: { icon: CheckCircle, label: "Synced", className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-300" },
  not_synced: { icon: Clock, label: "Pending", className: "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300" },
  sync_failed: { icon: XCircle, label: "Failed", className: "bg-rose-100 text-rose-700 hover:bg-rose-200 border-rose-300" },
  sync_pending: { icon: RefreshCw, label: "Syncing", className: "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-300" },
};

function formatDuration(ms: number | null): string {
  if (!ms) return "-";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Never";
  return new Date(dateStr).toLocaleString();
}

function getRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function getNextRunTime(intervalMinutes: number | null, lastRunAt: string | null): string {
  if (!intervalMinutes) return "N/A";
  if (!lastRunAt) return "Pending";

  const last = new Date(lastRunAt).getTime();
  const now = Date.now();
  const next = last + intervalMinutes * 60 * 1000;

  if (next < now) {
    return "Overdue";
  }

  const diff = Math.floor((next - now) / 1000);
  if (diff < 60) return `in ${diff}s`;
  if (diff < 3600) return `in ${Math.floor(diff / 60)}m`;
  return `in ${Math.floor(diff / 3600)}h`;
}

function parseResult(result: string | null): string {
  if (!result) return "-";
  try {
    const parsed = JSON.parse(result);
    const parts = [];
    if (parsed.processed) parts.push(`${parsed.processed} processed`);
    if (parsed.succeeded) parts.push(`${parsed.succeeded} succeeded`);
    if (parsed.failed) parts.push(`${parsed.failed} failed`);
    if (parsed.notificationsSent) parts.push(`${parsed.notificationsSent} notified`);
    if (parsed.checked) parts.push(`${parsed.checked} checked`);
    if (parsed.updated) parts.push(`${parsed.updated} updated`);
    if (parsed.assigned) parts.push(`${parsed.assigned} assigned`);
    if (parsed.reminded) parts.push(`${parsed.reminded} reminded`);
    return parts.join(", ") || "Completed";
  } catch {
    return "Completed";
  }
}

// Add/Edit Job Dialog
function JobDialog({ job, onSuccess, onCancel }: { job?: CronJob; onSuccess: () => void; onCancel: () => void }) {
  const queryClient = useQueryClient();
  const isEdit = !!job;

  const [formData, setFormData] = useState({
    name: job?.name || "",
    displayName: job?.displayName || "",
    description: job?.description || "",
    intervalMinutes: job?.intervalMinutes || 30,
    isEnabled: job?.isEnabled ?? true,
    maxRetries: job?.maxRetries || 3,
    retryIntervalSeconds: job?.retryIntervalSeconds || 60,
    category: job?.category || "maintenance",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isEdit) {
        await api.put(API_ENDPOINTS.ADMIN_CRON_JOB_BY_ID(job.id), formData);
        toast.success("Job updated successfully");
      } else {
        await api.post(API_ENDPOINTS.ADMIN_CRON_JOBS, formData);
        toast.success("Job created successfully");
      }
      onSuccess();
    } catch (error: any) {
      toast.error(isEdit ? "Failed to update job" : "Failed to create job");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit Job" : "Add New Job"}</DialogTitle>
        <DialogDescription>
          {isEdit ? "Update the scheduled job configuration" : "Configure a new scheduled background job"}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label htmlFor="name">Job Name (unique ID)</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="my_cron_job"
              disabled={isEdit}
              required
            />
          </div>

          <div className="col-span-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              placeholder="My Cron Job"
              required
            />
          </div>

          <div className="col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What does this job do?"
              rows={2}
              required
            />
          </div>

          <div>
            <Label htmlFor="intervalMinutes">Interval (minutes)</Label>
            <Input
              id="intervalMinutes"
              type="number"
              value={formData.intervalMinutes}
              onChange={(e) => setFormData({ ...formData, intervalMinutes: parseInt(e.target.value) || 0 })}
              min={1}
              required
            />
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="booking">Booking</SelectItem>
                <SelectItem value="subscription">Subscription</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="maxRetries">Max Retries</Label>
            <Input
              id="maxRetries"
              type="number"
              value={formData.maxRetries}
              onChange={(e) => setFormData({ ...formData, maxRetries: parseInt(e.target.value) || 0 })}
              min={0}
            />
          </div>

          <div>
            <Label htmlFor="retryInterval">Retry Interval (seconds)</Label>
            <Input
              id="retryInterval"
              type="number"
              value={formData.retryIntervalSeconds}
              onChange={(e) => setFormData({ ...formData, retryIntervalSeconds: parseInt(e.target.value) || 0 })}
              min={0}
            />
          </div>

          <div className="col-span-2 flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="isEnabled">Enabled</Label>
              <p className="text-xs text-muted-foreground">Job will run based on schedule</p>
            </div>
            <Switch
              id="isEnabled"
              checked={formData.isEnabled}
              onCheckedChange={(v) => setFormData({ ...formData, isEnabled: v })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEdit ? "Update Job" : "Create Job"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

// Expandable Log Row Component
function LogRow({ log, jobName }: { log: CronLog; jobName: string }) {
  const [expanded, setExpanded] = useState(false);
  const StatusIcon = statusConfig[log.status]?.icon || AlertCircle;
  const statusClassName = statusConfig[log.status]?.className || "";

  return (
    <>
      <TableRow className="cursor-pointer hover:bg-muted/50 transition-colors border-b last:border-b-0" onClick={() => setExpanded(!expanded)}>
        <TableCell className="py-4 px-4">
          <div className="flex items-center gap-2">
            <StatusIcon className="h-4 w-4" />
            <span className="font-medium">{jobName}</span>
          </div>
        </TableCell>
        <TableCell className="py-4 px-4">
          <Badge
            variant="outline"
            className={
              log.triggeredBy === "manual"
                ? "bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-300"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300"
            }
          >
            {log.triggeredBy === "manual" ? "Manual" : "Scheduled"}
          </Badge>
        </TableCell>
        <TableCell className="py-4 px-4">
          <div className="text-sm">
            <div>{formatDate(log.startedAt)}</div>
            <div className="text-xs text-muted-foreground">{getRelativeTime(log.startedAt)}</div>
          </div>
        </TableCell>
        <TableCell className="py-4 px-4">
          <Badge className={statusClassName}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusConfig[log.status]?.label || log.status}
          </Badge>
        </TableCell>
        <TableCell className="py-4 px-4">{formatDuration(log.durationMs)}</TableCell>
        <TableCell className="py-4 px-4">
          <div className="text-sm truncate max-w-[200px]">{parseResult(log.result)}</div>
        </TableCell>
        <TableCell className="py-4 px-4">
          <div className="flex items-center gap-2">
            {log.retryCount > 0 && (
              <Badge variant="outline" className="text-xs">
                R{log.retryCount}
              </Badge>
            )}
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow className="hover:bg-muted/30 transition-colors border-b last:border-b-0">
          <TableCell colSpan={7} className="py-4 px-4 bg-muted/30">
            <div className="space-y-2">
              {log.errorMessage && (
                <div className="text-sm">
                  <span className="font-medium text-rose-600">Error: </span>
                  <span className="text-rose-600">{log.errorMessage}</span>
                </div>
              )}
              {log.result && (
                <div className="text-sm">
                  <span className="font-medium">Result: </span>
                  <pre className="text-xs bg-background p-2 rounded mt-1 overflow-x-auto">
                    {JSON.stringify(JSON.parse(log.result), null, 2)}
                  </pre>
                </div>
              )}
              <div className="text-xs text-muted-foreground grid grid-cols-2 gap-2">
                <div>Started: {formatDate(log.startedAt)}</div>
                <div>Completed: {log.completedAt ? formatDate(log.completedAt) : "Running..."}</div>
                <div>Duration: {formatDuration(log.durationMs)}</div>
                <div>Log ID: {log.id}</div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export default function AdminCronJobsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [triggeringJob, setTriggeringJob] = useState<number | null>(null);
  const [syncingJob, setSyncingJob] = useState<number | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [editingJob, setEditingJob] = useState<CronJob | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Fetch all jobs
  const {
    data: jobs,
    isLoading: isLoadingJobs,
    error: jobsError,
    refetch: refetchJobs,
  } = useQuery<CronJob[]>({
    queryKey: ["admin", "cron-jobs"],
    queryFn: () => api.get<{ success: boolean; data: CronJob[] }>(API_ENDPOINTS.ADMIN_CRON_JOBS).then((r) => r.data),
    staleTime: 30000,
    refetchInterval: 30000,
  });

  // Fetch stats
  const {
    data: stats,
    isLoading: isLoadingStats,
    refetch: refetchStats,
  } = useQuery<CronStats>({
    queryKey: ["admin", "cron-stats"],
    queryFn: () => api.get<{ success: boolean; data: CronStats }>(API_ENDPOINTS.ADMIN_CRON_STATS).then((r) => r.data),
    staleTime: 30000,
    refetchInterval: 30000,
  });

  // Fetch all logs for the logs tab
  const { data: allLogs, isLoading: isLoadingLogs } = useQuery<CronLog[]>({
    queryKey: ["admin", "cron-logs-all"],
    queryFn: async () => {
      if (!jobs) return [];
      const logsByJob = await Promise.all(
        jobs.map((job) =>
          api
            .get<{ success: boolean; data: CronLog[] }>(API_ENDPOINTS.ADMIN_CRON_JOB_LOGS(job.id) + "?limit=50")
            .then((r) => (r.data || []).map((log: CronLog) => ({ ...log, jobId: job.id, jobName: job.displayName, jobCategory: job.category })))
        )
      );
      return logsByJob.flat().sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    },
    enabled: !!jobs && activeTab === "logs",
    staleTime: 10000,
    refetchInterval: 30000,
  });

  // Trigger job mutation
  const triggerMutation = useMutation({
    mutationFn: async (jobId: number) => {
      return api.post(API_ENDPOINTS.ADMIN_CRON_JOB_TRIGGER(jobId), {});
    },
    onSuccess: (data, variables) => {
      const job = jobs?.find((j) => j.id === variables);
      toast.success(`Job "${job?.displayName}" triggered successfully`, {
        description: "Execution started. Check logs for results.",
      });
      setTriggeringJob(null);
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["admin", "cron-jobs"] });
        queryClient.invalidateQueries({ queryKey: ["admin", "cron-stats"] });
        queryClient.invalidateQueries({ queryKey: ["admin", "cron-logs-all"] });
      }, 2000);
    },
    onError: (error: Error) => {
      toast.error(`Failed to trigger job: ${error.message}`);
      setTriggeringJob(null);
    },
  });

  const handleTriggerJob = (jobId: number) => {
    setTriggeringJob(jobId);
    triggerMutation.mutate(jobId);
    setTimeout(() => {
      if (triggeringJob === jobId) {
        toast.error("Job execution timeout - check server logs");
        setTriggeringJob(null);
      }
    }, 30000);
  };

  // Toggle job mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ jobId, isEnabled }: { jobId: number; isEnabled: boolean }) => {
      return api.put(API_ENDPOINTS.ADMIN_CRON_JOB_BY_ID(jobId), { isEnabled });
    },
    onSuccess: () => {
      toast.success("Job updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "cron-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "cron-stats"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update job: ${error.message}`);
    },
  });

  const handleToggleJob = (jobId: number, currentStatus: boolean) => {
    toggleMutation.mutate({ jobId, isEnabled: !currentStatus });
  };

  // Delete job mutation
  const deleteMutation = useMutation({
    mutationFn: async (jobId: number) => {
      return api.delete(API_ENDPOINTS.ADMIN_CRON_JOB_BY_ID(jobId));
    },
    onSuccess: () => {
      toast.success("Job deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "cron-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "cron-stats"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete job: ${error.message}`);
    },
  });

  const handleDeleteJob = (jobId: number) => {
    if (confirm("Are you sure you want to delete this job?")) {
      deleteMutation.mutate(jobId);
    }
  };

  // Sync single job mutation
  const syncJobMutation = useMutation({
    mutationFn: async (jobId: number) => {
      return api.post(API_ENDPOINTS.ADMIN_CRON_JOB_SYNC(jobId), {});
    },
    onSuccess: (data, variables) => {
      const job = jobs?.find((j) => j.id === variables);
      if (data.data?.success) {
        toast.success(`Job "${job?.displayName}" synced successfully`);
      } else {
        toast.error(`Failed to sync: ${data.data?.error || "Unknown error"}`);
      }
      setSyncingJob(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "cron-jobs"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to sync: ${error.message}`);
      setSyncingJob(null);
    },
  });

  const handleSyncJob = (jobId: number) => {
    setSyncingJob(jobId);
    syncJobMutation.mutate(jobId);
  };

  // Sync all jobs mutation
  const syncAllMutation = useMutation({
    mutationFn: async () => {
      return api.post(API_ENDPOINTS.ADMIN_CRON_JOBS_SYNC_ALL, {});
    },
    onSuccess: (data) => {
      const result = data.data;
      toast.success(`Sync completed: ${result.synced} synced, ${result.failed} failed`);
      setSyncingAll(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "cron-jobs"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to sync: ${error.message}`);
      setSyncingAll(false);
    },
  });

  const handleSyncAll = () => {
    setSyncingAll(true);
    syncAllMutation.mutate();
  };

  // Get job name by ID for logs
  const getJobById = (id: number) => jobs?.find((j) => j.id === id);

  // Error state
  if (jobsError && !jobs && !isLoadingJobs) {
    return (
      <ErrorState
        message={jobsError.message || "Failed to load cron jobs"}
        onRetry={() => {
          refetchJobs();
          refetchStats();
        }}
      />
    );
  }

  // Loading state
  if (isLoadingJobs || isLoadingStats) {
    return <AdminCronJobsSkeleton />;
  }

  // Empty state
  if (!jobs || jobs.length === 0) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Schedule Jobs"
          description="Manage and monitor all scheduled background jobs"
        />
        <EmptyState
          icon={Clock}
          title="No Cron Jobs"
          description="You haven't created any scheduled jobs yet. Create your first job to automate background tasks."
          actionLabel="Create Job"
          onAction={() => setIsAddDialogOpen(true)}
        />
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="hidden">Add Job</Button>
          </DialogTrigger>
          <JobDialog
            onSuccess={() => {
              setIsAddDialogOpen(false);
              queryClient.invalidateQueries({ queryKey: ["admin", "cron-jobs"] });
            }}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </Dialog>
      </div>
    );
  }

  const syncedCount = jobs.filter((j) => j.syncStatus === "synced").length;
  const notSyncedCount = jobs.filter((j) => j.syncStatus === "not_synced").length;
  const failedSyncCount = jobs.filter((j) => j.syncStatus === "sync_failed").length;
  const pendingSyncCount = jobs.filter((j) => j.syncStatus === "sync_pending").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        title="Schedule Jobs"
        description="Manage and monitor all scheduled background jobs"
        actions={
          <>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Job
                </Button>
              </DialogTrigger>
              <JobDialog
                onSuccess={() => {
                  setIsAddDialogOpen(false);
                  queryClient.invalidateQueries({ queryKey: ["admin", "cron-jobs"] });
                }}
                onCancel={() => setIsAddDialogOpen(false)}
              />
            </Dialog>
          </>
        }
        onRefresh={() => {
          refetchJobs();
          refetchStats();
        }}
        isRefreshing={isLoadingJobs}
      />

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Jobs"
          value={stats?.summary.totalJobs || 0}
          change={`${stats?.summary.enabledJobs || 0} enabled`}
          icon={Clock}
          variant="blue"
        />
        <StatCard
          title="Running"
          value={stats?.summary.runningJobs || 0}
          change="Currently executing"
          icon={RefreshCw}
          variant="purple"
        />
        <StatCard
          title="Success Rate"
          value={`${stats?.summary.recentSuccessRate || 0}%`}
          change={`${stats?.summary.recentSuccess}/${stats?.summary.recentRuns} runs`}
          icon={CheckCircle}
          variant="emerald"
        />
      </div>

      {/* Sync Status Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium">pg_cron Sync Status</h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncAll}
            disabled={syncingAll}
          >
            {syncingAll ? "Syncing..." : "Sync All"}
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Synced */}
          <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{syncedCount}</p>
                  <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">Synced</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending */}
          <Card className="border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-950/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400 shrink-0" />
                <div>
                  <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{notSyncedCount}</p>
                  <p className="text-xs text-gray-600/70 dark:text-gray-400/70">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Failed */}
          <Card className="border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
                <div>
                  <p className="text-2xl font-bold text-rose-700 dark:text-rose-300">{failedSyncCount}</p>
                  <p className="text-xs text-rose-600/70 dark:text-rose-400/70">Failed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Syncing */}
          <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
                <div>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{pendingSyncCount}</p>
                  <p className="text-xs text-blue-600/70 dark:text-blue-400/70">Syncing</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Failed Jobs Alert */}
      {stats?.failedJobs && stats.failedJobs.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-800 dark:text-amber-200 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Jobs Needing Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {stats.failedJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between bg-background dark:bg-background rounded-lg px-3 py-2 border border-amber-200 dark:border-amber-800"
                >
                  <span className="font-medium text-sm">{job.displayName}</span>
                  <span className="text-xs text-muted-foreground">{getRelativeTime(job.lastRunAt)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-background">
            <Clock className="h-4 w-4 mr-2" />
            Jobs
          </TabsTrigger>
          <TabsTrigger value="logs" className="data-[state=active]:bg-background">
            <FileText className="h-4 w-4 mr-2" />
            Execution Logs
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab - Table View */}
        <TabsContent value="dashboard">
          <div className="border rounded-md overflow-hidden bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="py-4 px-4">Job</TableHead>
                  <TableHead className="py-4 px-4">Category</TableHead>
                  <TableHead className="py-4 px-4">Status</TableHead>
                  <TableHead className="py-4 px-4">Sync Status</TableHead>
                  <TableHead className="py-4 px-4">Last Run</TableHead>
                  <TableHead className="py-4 px-4">Next Run</TableHead>
                  <TableHead className="py-4 px-4">Duration</TableHead>
                  <TableHead className="py-4 px-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => {
                  const StatusIcon = job.latestLog
                    ? statusConfig[job.latestLog.status]?.icon || Clock
                    : Clock;
                  const isLoading = triggeringJob === job.id;
                  const CategoryIcon = categoryConfig[job.category]?.icon || Zap;

                  return (
                    <TableRow
                      key={job.id}
                      className={
                        !job.isEnabled
                          ? "opacity-50"
                          : isLoading
                            ? "bg-blue-50/30 dark:bg-blue-950/20"
                            : "hover:bg-muted/50 transition-colors"
                      }
                    >
                      <TableCell className="py-4 px-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{job.displayName}</span>
                            {isLoading && (
                              <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 text-xs">
                                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                Running
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Globe className="h-3 w-3" />
                            {job.name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-4">
                        <Badge variant="outline" className="gap-1">
                          <CategoryIcon className="h-3 w-3" />
                          {categoryConfig[job.category]?.label || job.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Badge className={statusConfig[job.latestLog?.status || "success"]?.className || ""}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig[job.latestLog?.status || "success"]?.label || "Ready"}
                          </Badge>
                          {job.successRate !== null && (
                            <span className="text-xs text-muted-foreground">
                              {job.successRate}%
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {(() => {
                            const config = syncStatusConfig[job.syncStatus] || syncStatusConfig.not_synced;
                            const Icon = config.icon;
                            return (
                              <Badge className={config.className}>
                                <Icon className="h-3 w-3 mr-1" />
                                {config.label}
                              </Badge>
                            );
                          })()}
                          {(job.syncStatus === "not_synced" || job.syncStatus === "sync_failed") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => handleSyncJob(job.id)}
                              disabled={syncingJob === job.id}
                              title={job.syncError || "Sync to pg_cron"}
                            >
                              {syncingJob === job.id ? "Syncing..." : job.syncStatus === "sync_failed" ? "Retry" : "Sync"}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-4">
                        <div className="text-sm">
                          <div>{getRelativeTime(job.lastRunAt)}</div>
                          <div className="text-xs text-muted-foreground">
                            Every {job.intervalMinutes}min
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-4">
                        <div className="text-sm">{getNextRunTime(job.intervalMinutes, job.lastRunAt)}</div>
                      </TableCell>
                      <TableCell className="py-4 px-4">
                        <div className="text-sm">
                          {isLoading ? (
                            <span className="text-blue-600">Running...</span>
                          ) : job.latestLog && job.latestLog.durationMs !== null ? (
                            formatDuration(job.latestLog.durationMs)
                          ) : (
                            "-"
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTriggerJob(job.id)}
                            disabled={!job.isEnabled || triggeringJob !== null}
                            title="Run Now"
                          >
                            {isLoading ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingJob(job)}
                            disabled={triggeringJob !== null}
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleJob(job.id, job.isEnabled)}
                            disabled={toggleMutation.isPending || triggeringJob !== null}
                            title={job.isEnabled ? "Disable" : "Enable"}
                          >
                            {job.isEnabled ? (
                              <Unlock className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <Lock className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteJob(job.id)}
                            disabled={triggeringJob !== null}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-rose-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Execution Logs</CardTitle>
              <CardDescription>
                Detailed execution history for all scheduled jobs (most recent first)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingLogs ? (
                <LoadingState message="Loading logs..." />
              ) : allLogs && allLogs.length > 0 ? (
                <div className="border rounded-md overflow-hidden bg-card shadow-sm">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="py-4 px-4">Job</TableHead>
                        <TableHead className="py-4 px-4">Trigger</TableHead>
                        <TableHead className="py-4 px-4">Started</TableHead>
                        <TableHead className="py-4 px-4">Status</TableHead>
                        <TableHead className="py-4 px-4">Duration</TableHead>
                        <TableHead className="py-4 px-4">Result</TableHead>
                        <TableHead className="py-4 px-4"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allLogs.map((log: any) => {
                        const job = getJobById(log.jobId);
                        return <LogRow key={log.id} log={log} jobName={job?.displayName || "Unknown"} />;
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <EmptyState
                  icon={FileText}
                  title="No Execution Logs"
                  description="No execution logs available yet. Logs will appear here after jobs run."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      {editingJob && (
        <Dialog open={!!editingJob} onOpenChange={(open) => !open && setEditingJob(null)}>
          <JobDialog
            job={editingJob}
            onSuccess={() => {
              setEditingJob(null);
              queryClient.invalidateQueries({ queryKey: ["admin", "cron-jobs"] });
            }}
            onCancel={() => setEditingJob(null)}
          />
        </Dialog>
      )}
    </div>
  );
}
