/**
 * Admin Types
 * Type definitions for admin-related data structures
 */

/**
 * Cron Job Sync Status
 */
export type CronJobSyncStatus = "not_synced" | "synced" | "sync_failed" | "sync_pending";

/**
 * Cron Job Status
 */
export type CronJobStatus = "running" | "success" | "failed" | "partial_success";

/**
 * Cron Job Category
 */
export type CronJobCategory = "booking" | "subscription" | "staff" | "payment" | "maintenance";

/**
 * Cron Job Triggered By
 */
export type CronJobTriggeredBy = "schedule" | "manual" | "webhook";

/**
 * Cron Job interface
 */
export interface CronJob {
  id: number;
  name: string;
  displayName: string;
  description?: string | null;
  endpoint: string;
  method: string;
  cronExpression?: string | null;
  intervalMinutes?: number | null;
  isEnabled: boolean;
  maxRetries: number;
  retryIntervalSeconds: number;
  category: CronJobCategory;
  lastRunAt?: string | null;
  lastRunStatus?: CronJobStatus | null;
  nextRunAt?: string | null;
  successRate?: number;
  latestLog?: CronJobLog;
  // pg_cron sync tracking
  syncStatus: CronJobSyncStatus;
  syncError?: string | null;
  lastSyncedAt?: string | null;
  pgCronJobname?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Cron Job Log interface
 */
export interface CronJobLog {
  id: number;
  jobId: number;
  startedAt: string;
  completedAt?: string | null;
  status: CronJobStatus;
  result?: string | null; // JSON string
  errorMessage?: string | null;
  errorDetails?: string | null; // JSON string
  triggeredBy: CronJobTriggeredBy;
  triggeredByUserId?: number | null;
  durationMs?: number | null;
  retryCount: number;
  createdAt: string;
}

/**
 * Cron Job Stats interface
 */
export interface CronJobStats {
  total: number;
  enabled: number;
  disabled: number;
  byCategory: Record<CronJobCategory, number>;
  recentFailures: number;
  avgSuccessRate: number;
}

/**
 * Sync Status Overview
 */
export interface SyncStatusOverview {
  total: number;
  synced: number;
  notSynced: number;
  mismatched: number;
  details: {
    synced: CronJob[];
    notSynced: CronJob[];
    mismatched: Array<CronJob & { issue: string }>;
  };
}
