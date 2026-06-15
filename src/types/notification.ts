// Notification System Types

export type NotificationModule = 'incident' | 'employee' | 'assessment' | 'transport' | 'grievance' | 'feedback';

export type NotificationType = 
  | 'incident_assigned'
  | 'incident_updated' 
  | 'incident_closed'
  | 'incident_reopened'
  | 'incident_reminder_10_days'
  | 'employee_verified'
  | 'assessment_assigned'
  | 'assessment_submitted'
  | 'assessment_completed'
  | 'assessment_rework_required'
  | 'assessment_due_5_days'
  | 'assessment_overdue'
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
  /** Tenant the notification belongs to. Populated from NotificationData.clientId on insert. */
  clientId?: string;
  recipientId: string;
  recipientEmail: string;
  subject: string;
  body: string;
  /**
   * 'skipped' is retained for historical rows but is no longer written by the service —
   * skips are now stamped on the source record (incidents.is_skipped / .skipped_notifications).
   */
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

// Skip conditions for assessment notifications (same as incident)
export const ASSESSMENT_SKIP_CONDITIONS = {
  SELF_ACTION: 'self_action', // Don't notify if user performs action on their own assessment
  ALREADY_NOTIFIED: 'already_notified', // Don't send duplicate notifications
  INACTIVE_USER: 'inactive_user', // Don't notify inactive users
  NO_EMAIL: 'no_email', // Don't notify users without email
} as const;

export type AssessmentSkipCondition = typeof ASSESSMENT_SKIP_CONDITIONS[keyof typeof ASSESSMENT_SKIP_CONDITIONS];

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

// Assessment notification data interface
export interface AssessmentNotificationData extends NotificationData {
  metadata: {
    assessmentId: string;
    createdBy: string;
    assignedTo?: string;
    actionBy: string;
  };
}

// Email template variables for assessment notifications
export interface AssessmentEmailVariables {
  User_Name: string;
  Assessment_ID: string;
  Assessment_Title: string;
  Assigned_Date?: string;
  Due_Date?: string;
  Submitted_By?: string;
  Submitted_Date?: string;
  Completed_By?: string;
  Completed_Date?: string;
  Requested_By?: string;
  Rework_Reason?: string;
  Overdue_Days?: string;
  Assessment_URL: string;
} 