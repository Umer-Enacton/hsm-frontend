import { atom } from 'jotai';

// Blocked business notification state
export interface BlockedBusinessNotification {
  type: 'blocked_business';
  businessId: number;
  businessName: string;
  reason: string;
  blockedAt: string | null;
}

// Deactivated service notification state
export interface DeactivatedServiceNotification {
  type: 'deactivated_service';
  serviceId: number;
  serviceName: string;
  reason: string;
  deactivatedAt: string | null;
}

// Reactivated service notification state
export interface ReactivatedServiceNotification {
  type: 'reactivated_service';
  serviceId: number;
  serviceName: string;
  reactivatedAt: string | null;
}

// Unblocked business notification state
export interface UnblockedBusinessNotification {
  type: 'unblocked_business';
  businessId: number;
  businessName: string;
  unblockedAt: string | null;
}

// Missing payment details notification state
export interface MissingPaymentDetailsNotification {
  type: 'missing_payment_details';
  businessId: number;
  businessName: string;
}

// Pending verification notification state
export interface PendingVerificationNotification {
  type: 'pending_verification';
  businessId: number;
  businessName: string;
}

export type ProviderNotification =
  | BlockedBusinessNotification
  | DeactivatedServiceNotification
  | ReactivatedServiceNotification
  | UnblockedBusinessNotification
  | MissingPaymentDetailsNotification
  | PendingVerificationNotification
  | null;

// Support multiple simultaneous notifications
export const providerNotificationsAtom = atom<ProviderNotification[]>([]);

// Atom for dismissed notification IDs
export const notificationDismissedAtom = atom<Set<string>>(new Set<string>());
