import { supabase } from '@/integrations/supabase/client';
import { 
  NotificationData, 
  NotificationTemplate, 
  NotificationRule, 
  NotificationLog,
  NotificationType,
  NotificationModule,
  IncidentNotificationData,
  IncidentSkipCondition,
  INCIDENT_SKIP_CONDITIONS
} from '@/types/notification';
import { format } from 'date-fns';
import { getFrontendTemplate } from './templates';

export class NotificationService {
  private static instance: NotificationService;
  
  private constructor() {}
  
  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Queue notification for later processing by cron job
   */
  async queueNotification(notificationData: NotificationData, currentEmployeeData?: any): Promise<boolean> {
    try {
      console.log('Queueing notification:', {
        module: notificationData.module,
        type: notificationData.type,
        recipient: notificationData.recipientEmail
      });

      // Check if notification should be skipped
      const shouldSkip = await this.shouldSkipNotification(notificationData, currentEmployeeData);
      if (shouldSkip) {
        console.log('Notification skipped due to rules');
        await this.logNotification({
          ...notificationData,
          subject: '',
          body: '',
          status: 'skipped',
          metadata: { skipReason: shouldSkip }
        });
        return false;
      }

      // Get notification template from frontend registry
      const template = getFrontendTemplate(notificationData.module, notificationData.type);
      if (!template) {
        console.error('No template found for notification:', notificationData.type);
        return false;
      }

      // Process template variables
      const processedTemplate = this.processTemplate(template, notificationData.variables);
      
      // Queue email in database
      const emailQueued = await this.queueEmail({
        module_name: notificationData.module,
        notification_type: notificationData.type,
        client_id: notificationData.clientId,
        recipient_email: notificationData.recipientEmail,
        recipient_name: notificationData.recipientName,
        subject: processedTemplate.subject,
        body: processedTemplate.body,
        params: {
          ...notificationData.variables,
          template_id: template.id,
          module: notificationData.module,
          type: notificationData.type,
          priority: notificationData.priority
        },
        priority: notificationData.priority === 'high' ? 1 : 0
      });

      // Log notification
      await this.logNotification({
        ...notificationData,
        subject: processedTemplate.subject,
        body: processedTemplate.body,
        status: emailQueued ? 'pending' : 'failed',
        sentAt: undefined,
        errorMessage: emailQueued ? undefined : 'Failed to queue email'
      });

      return emailQueued;
    } catch (error) {
      console.error('Error queueing notification:', error);
      
      // Log failed notification
      await this.logNotification({
        ...notificationData,
        subject: '',
        body: '',
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return false;
    }
  }

  /**
   * Legacy method - now queues instead of sending immediately
   */
  async sendNotification(notificationData: NotificationData, currentEmployeeData?: any): Promise<boolean> {
    return this.queueNotification(notificationData, currentEmployeeData);
  }

  /**
   * Queue email in database for cron processing
   */
  private async queueEmail(emailData: {
    module_name: string;
    notification_type: string;
    client_id: string;
    recipient_email: string;
    recipient_name?: string;
    subject: string;
    body: string;
    params: Record<string, any>;
    priority?: number;
  }): Promise<boolean> {
    try {
      // Validate required fields
      if (!emailData.module_name || !emailData.notification_type || !emailData.client_id || 
          !emailData.recipient_email || !emailData.subject || !emailData.body) {
        console.error('Missing required fields for email queue:', emailData);
        return false;
      }

      // Clean and validate data
      const queueData = {
        module_name: emailData.module_name.trim(),
        notification_type: emailData.notification_type.trim(),
        client_id: emailData.client_id.trim(),
        recipient_email: emailData.recipient_email.trim(),
        recipient_name: emailData.recipient_name?.trim() || null,
        subject: emailData.subject.trim(),
        body: emailData.body.trim(),
        params: emailData.params || {},
        priority: emailData.priority || 0,
        is_sent: false,
        retry_count: 0,
        max_retries: 3,
        scheduled_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Queueing email with data:', {
        module_name: queueData.module_name,
        notification_type: queueData.notification_type,
        recipient_email: queueData.recipient_email,
        subject: queueData.subject
      });

      // Explicitly exclude id field and use upsert to handle potential conflicts
      const { error } = await supabase
        .from('email_queue')
        .insert(queueData);

      if (error) {
        console.error('Error queueing email:', error);
        console.error('Failed data:', queueData);
        
        // Try to create the table if it doesn't exist
        if (error.code === '42P01') { // Table doesn't exist
          console.log('email_queue table does not exist, this should be handled by migration');
        }
        
        return false;
      }

      console.log('Email queued successfully');
      return true;
    } catch (error) {
      console.error('Error queueing email:', error);
      return false;
    }
  }

  /**
   * Check if notification should be skipped based on rules
   */
  private async shouldSkipNotification(notificationData: NotificationData, currentEmployeeData?: any): Promise<string | null> {
    try {
      // Get notification rules for this module and type
      const { data: rules, error } = await supabase
        .from('notification_rules')
        .select('*')
        .eq('module', notificationData.module)
        .eq('type', notificationData.type)
        .eq('is_active', true);

      if (error || !rules || rules.length === 0) {
        return null; // No rules found, don't skip
      }

      const rule = rules[0];
      
      // Check each skip condition
      for (const condition of rule.skip_conditions || []) {
        const shouldSkip = await this.evaluateSkipCondition(condition, notificationData, currentEmployeeData);
        if (shouldSkip) {
          return condition;
        }
      }

      return null;
    } catch (error) {
      console.error('Error checking skip conditions:', error);
      return null;
    }
  }

  /**
   * Evaluate a specific skip condition
   */
  private async evaluateSkipCondition(condition: string, notificationData: NotificationData, currentEmployeeData?: any): Promise<boolean> {
    switch (condition) {
      case INCIDENT_SKIP_CONDITIONS.SELF_ACTION:
        return this.checkSelfAction(notificationData, currentEmployeeData);
      
      case INCIDENT_SKIP_CONDITIONS.INACTIVE_USER:
        return await this.checkInactiveUser(notificationData.recipientId);
      
      case INCIDENT_SKIP_CONDITIONS.NO_EMAIL:
        return !notificationData.recipientEmail || notificationData.recipientEmail.trim() === '';
      
      case INCIDENT_SKIP_CONDITIONS.ALREADY_NOTIFIED:
        return await this.checkAlreadyNotified(notificationData);
      
      default:
        return false;
    }
  }

  /**
   * Check if user is performing action on their own incident
   */
  private checkSelfAction(notificationData: NotificationData, currentEmployeeData?: any): boolean {
    if (notificationData.module !== 'incident') return false;
    
    const incidentData = notificationData as IncidentNotificationData;
    
    // Check if the current logged-in user is the recipient (self-action)
    if (currentEmployeeData?.id != incidentData.metadata?.reportedBy) {
      return true;
    }

    // Check if the user is the one who reported the incident
    if (incidentData.metadata?.reportedBy === notificationData.recipientId) {
      return true;
    }
    
    // Check if the user is the one who updated/closed/reopened the incident
    if (incidentData.metadata?.actionBy === notificationData.recipientId) {
      return true;
    }
    
    return false;
  }

  /**
   * Check if user is inactive
   */
  private async checkInactiveUser(userId: string): Promise<boolean> {
    try {
      const { data: employee, error } = await supabase
        .from('employees')
        .select('status')
        .eq('id', userId)
        .single();

      if (error || !employee) {
        return true; // Skip if employee not found
      }

      return !employee.status; // Skip if employee is inactive
    } catch (error) {
      console.error('Error checking user status:', error);
      return true; // Skip on error
    }
  }

  /**
   * Check if notification was already sent recently
   */
  private async checkAlreadyNotified(notificationData: NotificationData): Promise<boolean> {
    try {
      const { data: recentNotifications, error } = await supabase
        .from('notification_logs')
        .select('created_at')
        .eq('module', notificationData.module)
        .eq('type', notificationData.type)
        .eq('recipient_id', notificationData.recipientId)
        .eq('status', 'sent')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
        .limit(1);

      if (error) {
        console.error('Error checking recent notifications:', error);
        return false;
      }

      return recentNotifications && recentNotifications.length > 0;
    } catch (error) {
      console.error('Error checking already notified:', error);
      return false;
    }
  }

  /**
   * Process template with variables
   */
  private processTemplate(template: NotificationTemplate, variables: Record<string, string | number | Date>): { subject: string; body: string } {
    let subject = template.subject;
    let body = template.body;

    // Replace variables in subject and body
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      const stringValue = this.formatVariableValue(value);
      
      subject = subject.replace(new RegExp(placeholder, 'g'), stringValue);
      body = body.replace(new RegExp(placeholder, 'g'), stringValue);
    }

    return { subject, body };
  }

  /**
   * Format variable value for template replacement
   */
  private formatVariableValue(value: string | number | Date): string {
    if (value instanceof Date) {
      return format(value, 'MMM dd, yyyy h:mm a');
    }
    return String(value);
  }

  /**
   * Log notification to database
   */
  private async logNotification(logData: Omit<NotificationLog, 'id' | 'createdAt'>): Promise<void> {
    try {
      // Validate required fields
      if (!logData.module || !logData.type || !logData.recipientId || !logData.recipientEmail) {
        console.error('Missing required fields for notification log:', {
          module: logData.module,
          type: logData.type,
          recipientId: logData.recipientId,
          recipientEmail: logData.recipientEmail
        });
        return;
      }

      const logEntry = {
        module: logData.module,
        type: logData.type,
        recipient_id: logData.recipientId,
        recipient_email: logData.recipientEmail,
        subject: logData.subject || '',
        body: logData.body || '',
        status: logData.status,
        error_message: logData.errorMessage || null,
        sent_at: logData.sentAt || null,
        metadata: logData.metadata || {}
      };

      console.log('Logging notification:', {
        module: logEntry.module,
        type: logEntry.type,
        recipient_id: logEntry.recipient_id,
        status: logEntry.status
      });

      const { error } = await supabase
        .from('notification_logs')
        .insert([logEntry]);

      if (error) {
        console.error('Error logging notification:', error);
      } else {
        console.log('Notification logged successfully');
      }
    } catch (error) {
      console.error('Error logging notification:', error);
    }
  }

  /**
   * Get notification logs for a user
   */
  async getNotificationLogs(userId: string, limit: number = 50): Promise<NotificationLog[]> {
    try {
      const { data: logs, error } = await supabase
        .from('notification_logs')
        .select('*')
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching notification logs:', error);
        return [];
      }

      return logs as NotificationLog[];
    } catch (error) {
      console.error('Error fetching notification logs:', error);
      return [];
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(clientId: string, days: number = 30): Promise<{
    total: number;
    sent: number;
    failed: number;
    skipped: number;
  }> {
    try {
      const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      const { data: stats, error } = await supabase
        .from('notification_logs')
        .select('status')
        .gte('created_at', sinceDate);

      if (error) {
        console.error('Error fetching notification stats:', error);
        return { total: 0, sent: 0, failed: 0, skipped: 0 };
      }

      const total = stats?.length || 0;
      const sent = stats?.filter(log => log.status === 'sent').length || 0;
      const failed = stats?.filter(log => log.status === 'failed').length || 0;
      const skipped = stats?.filter(log => log.status === 'skipped').length || 0;

      return { total, sent, failed, skipped };
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      return { total: 0, sent: 0, failed: 0, skipped: 0 };
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance(); 