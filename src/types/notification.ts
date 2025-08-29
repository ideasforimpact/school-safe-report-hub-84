// Notification System Types

export type NotificationModule = 'incident' | 'employee' | 'assessment' | 'transport' | 'grievance' | 'feedback';

export type NotificationType = 
  | 'incident_assigned'
  | 'incident_updated' 
  | 'incident_closed'
  | 'incident_reopened'
  | 'incident_reminder_10_days'
  | 'employee_verified'
  | 'assessment_completed'
  | 'transport_incident'
  | 'grievance_submitted'
  | 'feedback_received';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface NotificationTemplate {
  id: string;
  module: NotificationModule;
  type: NotificationType;
  subject: string;
  body: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationData {
  module: NotificationModule;
  type: NotificationType;
  recipientId: string;
  recipientEmail: string;
  recipientName: string;
  clientId: string;
  variables: Record<string, string | number | Date>;
  priority?: NotificationPriority;
  metadata?: Record<string, any>;
}

export interface NotificationRule {
  id: string;
  module: NotificationModule;
  type: NotificationType;
  name: string;
  description: string;
  isActive: boolean;
  skipConditions: string[]; // Array of conditions when notification should be skipped
  createdAt: string;
  updatedAt: string;
}

export interface NotificationLog {
  id: string;
  module: NotificationModule;
  type: NotificationType;
  recipientId: string;
  recipientEmail: string;
  subject: string;
  body: string;
  status: 'pending' | 'sent' | 'failed' | 'skipped';
  errorMessage?: string;
  sentAt?: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

// Incident-specific notification data
export interface IncidentNotificationData extends NotificationData {
  module: 'incident';
  incidentId: string;
  incidentTicketId: string;
  incidentTitle: string;
  reportedDate: Date;
  updatedBy?: string;
  updateNotes?: string;
  closedBy?: string;
  closedDate?: Date;
  reopenedBy?: string;
  reopenReason?: string;
}

// Skip conditions for incident notifications
export const INCIDENT_SKIP_CONDITIONS = {
  SELF_ACTION: 'self_action', // Don't notify if user performs action on their own incident
  ALREADY_NOTIFIED: 'already_notified', // Don't send duplicate notifications
  INACTIVE_USER: 'inactive_user', // Don't notify inactive users
  NO_EMAIL: 'no_email', // Don't notify users without email
} as const;

export type IncidentSkipCondition = typeof INCIDENT_SKIP_CONDITIONS[keyof typeof INCIDENT_SKIP_CONDITIONS];

// Notification configuration
export interface NotificationConfig {
  enabled: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
  maxRetries: number;
  retryDelay: number; // in seconds
}

// Email template variables for incident notifications
export interface IncidentEmailVariables {
  User_Name: string;
  Incident_ID: string;
  Incident_Title: string;
  Reported_Date: string;
  Updated_By?: string;
  Update_Notes?: string;
  Closed_By?: string;
  Closed_Date?: string;
  Reopened_By?: string;
  Reopen_Reason?: string;
} 