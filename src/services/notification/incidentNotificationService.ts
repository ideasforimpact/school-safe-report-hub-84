import { notificationService } from './notificationService';
import {
  IncidentNotificationData,
  NotificationData,
  NotificationType
} from '@/types/notification';
import { formatEmployeeName } from './formatHelpers';
import { supabase } from '@/integrations/supabase/client';

// The 4 incident notification types reachable from create/edit/close/reopen flows
// are queued via the fetch-incidents edge function (operation: 'queue_notification'),
// which does the same notification_rules skip-check + template render + email_queue/
// notification_logs writes server-side instead of as direct REST calls from here.
// incident_reminder_10_days is cron-triggered, not part of these flows, and still
// goes through the shared client-side notificationService below.
async function queueIncidentNotificationViaEdgeFunction(
  notificationData: NotificationData,
  currentEmployeeData?: Record<string, unknown>
): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-incidents', {
      body: {
        operation: 'queue_notification',
        clientId: notificationData.clientId,
        notificationType: notificationData.type,
        recipientId: notificationData.recipientId,
        recipientEmail: notificationData.recipientEmail,
        recipientName: notificationData.recipientName,
        notificationPriority: notificationData.priority,
        notificationVariables: notificationData.variables,
        notificationMetadata: notificationData.metadata,
        actionById: currentEmployeeData?.id,
      },
    });

    if (error) throw error;
    if (!data?.success) throw new Error('Failed to queue notification');

    return data.skipped ? false : Boolean(data.delivered);
  } catch (error) {
    console.error('Error queueing incident notification via edge function:', error);
    return false;
  }
}

// Database-row shape for incidents (snake_case, as returned by Supabase)
interface IncidentRow {
  id: string;
  ticket_id: string;
  client_id: string;
  description?: string;
  created_at: string;
  assigned_to?: string;
  created_by?: string;
  [key: string]: unknown;
}

// Define the Employee interface based on the database structure
interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status?: boolean;
}

export class IncidentNotificationService {
  private static instance: IncidentNotificationService;
  
  private constructor() {}
  
  public static getInstance(): IncidentNotificationService {
    if (!IncidentNotificationService.instance) {
      IncidentNotificationService.instance = new IncidentNotificationService();
    }
    return IncidentNotificationService.instance;
  }

  /**
   * Queue incident assigned notification
   */
  async queueIncidentAssignedNotification(incident: IncidentRow, assignedEmployee: Employee, currentEmployeeData?: Record<string, unknown>): Promise<boolean> {
    try {
      // Validate required employee data — only id + email are required for delivery.
      // first_name / last_name may legitimately be empty for shared / single-name accounts.
      if (!assignedEmployee?.id || !assignedEmployee?.email) {
        console.error('Invalid assigned employee data:', assignedEmployee);
        return false;
      }

      // Validate incident data
      if (!incident?.id || !incident?.ticket_id || !incident?.client_id) {
        console.error('Invalid incident data:', incident);
        return false;
      }

      const displayName = formatEmployeeName(assignedEmployee);

      const notificationData: NotificationData = {
        module: 'incident',
        type: 'incident_assigned' as NotificationType,
        recipientId: assignedEmployee.id,
        recipientEmail: assignedEmployee.email,
        recipientName: displayName,
        clientId: incident.client_id,
        priority: 'medium',
        variables: {
          User_Name: displayName,
          Incident_ID: incident.ticket_id,
          Incident_Title: incident.description || 'No description provided',
          Reported_Date: new Date(incident.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          Incident_URL: `${this.getBaseUrl()}/incidents/${incident.id}`,
          created_by: incident.created_by,
          assigned_to: incident.assigned_to
        },
        metadata: {
          incidentId: incident.id,
          reportedBy: incident.created_by,
          actionBy: incident.created_by // The person who created and assigned the incident
        }
      };

      console.log('Queueing incident assigned notification:', {
        incidentId: incident.id,
        ticketId: incident.ticket_id,
        recipientId: assignedEmployee.id,
        recipientEmail: assignedEmployee.email
      });

      return await queueIncidentNotificationViaEdgeFunction(notificationData, currentEmployeeData);
    } catch (error) {
      console.error('Error queueing incident assigned notification:', error);
      return false;
    }
  }

  /**
   * Queue incident updated notification
   */
  async queueIncidentUpdatedNotification(
    incident: IncidentRow,
    updatedBy: Employee,
    updateNotes?: string,
    currentEmployeeData?: Record<string, unknown>,
    preloadedAssignee?: Employee | null
  ): Promise<boolean> {
    try {
      const assignedEmployee = preloadedAssignee !== undefined
        ? preloadedAssignee
        : await this.getEmployeeById(incident.assigned_to);
      if (!assignedEmployee) {
        console.error('Assigned employee not found for incident:', incident.id);
        return false;
      }

      const recipientDisplayName = formatEmployeeName(assignedEmployee);
      const actorDisplayName = formatEmployeeName(updatedBy);

      const notificationData: NotificationData = {
        module: 'incident',
        type: 'incident_updated' as NotificationType,
        recipientId: assignedEmployee.id,
        recipientEmail: assignedEmployee.email,
        recipientName: recipientDisplayName,
        clientId: incident.client_id,
        priority: 'medium',
        variables: {
          User_Name: recipientDisplayName,
          Incident_ID: incident.ticket_id,
          Incident_Title: incident.description,
          Updated_By: actorDisplayName,
          Update_Notes: updateNotes || 'Incident has been updated',
          Incident_URL: `${this.getBaseUrl()}/incidents/${incident.id}`,
          created_by: incident.created_by,
          assigned_to: incident.assigned_to
        },
        metadata: {
          incidentId: incident.id,
          reportedBy: incident.created_by,
          actionBy: updatedBy.id
        }
      };

      return await queueIncidentNotificationViaEdgeFunction(notificationData, currentEmployeeData);
    } catch (error) {
      console.error('Error queueing incident updated notification:', error);
      return false;
    }
  }

  /**
   * Queue incident closed notification
   */
  async queueIncidentClosedNotification(
    incident: IncidentRow,
    closedBy: Employee,
    currentEmployeeData?: Record<string, unknown>
  ): Promise<boolean> {
    try {
      const assignedEmployee = await this.getEmployeeById(incident.assigned_to);
      if (!assignedEmployee) {
        console.error('Assigned employee not found for incident:', incident.id);
        return false;
      }

      const recipientDisplayName = formatEmployeeName(assignedEmployee);
      const actorDisplayName = formatEmployeeName(closedBy);

      const notificationData: NotificationData = {
        module: 'incident',
        type: 'incident_closed' as NotificationType,
        recipientId: assignedEmployee.id,
        recipientEmail: assignedEmployee.email,
        recipientName: recipientDisplayName,
        clientId: incident.client_id,
        priority: 'medium',
        variables: {
          User_Name: recipientDisplayName,
          Incident_ID: incident.ticket_id,
          Incident_Title: incident.description,
          Closed_By: actorDisplayName,
          Closed_Date: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          Incident_URL: `${this.getBaseUrl()}/incidents/${incident.id}`,
          created_by: incident.created_by,
          assigned_to: incident.assigned_to
        },
        metadata: {
          incidentId: incident.id,
          reportedBy: incident.created_by,
          actionBy: closedBy.id
        }
      };

      return await queueIncidentNotificationViaEdgeFunction(notificationData, currentEmployeeData);
    } catch (error) {
      console.error('Error queueing incident closed notification:', error);
      return false;
    }
  }

  /**
   * Queue incident reopened notification
   */
  async queueIncidentReopenedNotification(
    incident: IncidentRow,
    reopenedBy: Employee,
    reopenReason?: string,
    currentEmployeeData?: Record<string, unknown>,
    // Callers that already have the assigned employee's details (e.g. the
    // reopen-incident edge function now returns it inline) can pass it here
    // to skip the DB lookup below.
    assignedEmployeeOverride?: Employee | null
  ): Promise<boolean> {
    try {
      const assignedEmployee = assignedEmployeeOverride ?? await this.getEmployeeById(incident.assigned_to);
      if (!assignedEmployee) {
        console.error('Assigned employee not found for incident:', incident.id);
        return false;
      }

      const recipientDisplayName = formatEmployeeName(assignedEmployee);
      const actorDisplayName = formatEmployeeName(reopenedBy);

      const notificationData: NotificationData = {
        module: 'incident',
        type: 'incident_reopened' as NotificationType,
        recipientId: assignedEmployee.id,
        recipientEmail: assignedEmployee.email,
        recipientName: recipientDisplayName,
        clientId: incident.client_id,
        priority: 'high',
        variables: {
          User_Name: recipientDisplayName,
          Incident_ID: incident.ticket_id,
          Incident_Title: incident.description,
          Reopened_By: actorDisplayName,
          Reopen_Reason: reopenReason || 'Incident has been reopened',
          Incident_URL: `${this.getBaseUrl()}/incidents/${incident.id}`,
          created_by: incident.created_by,
          assigned_to: incident.assigned_to
        },
        metadata: {
          incidentId: incident.id,
          reportedBy: incident.created_by,
          actionBy: reopenedBy.id
        }
      };

      return await queueIncidentNotificationViaEdgeFunction(notificationData, currentEmployeeData);
    } catch (error) {
      console.error('Error queueing incident reopened notification:', error);
      return false;
    }
  }

  /**
   * Queue incident reminder notification (for incidents open > 10 days)
   */
  async queueIncidentReminderNotification(
    incident: IncidentRow,
    assignedEmployee: Employee,
    currentEmployeeData?: Record<string, unknown>
  ): Promise<boolean> {
    try {
      const recipientDisplayName = formatEmployeeName(assignedEmployee);

      const notificationData: NotificationData = {
        module: 'incident',
        type: 'incident_reminder' as NotificationType,
        recipientId: assignedEmployee.id,
        recipientEmail: assignedEmployee.email,
        recipientName: recipientDisplayName,
        clientId: incident.client_id,
        priority: 'high',
        variables: {
          User_Name: recipientDisplayName,
          Incident_ID: incident.ticket_id,
          Incident_Title: incident.description,
          Reported_Date: new Date(incident.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          created_by: incident.created_by,
          assigned_to: incident.assigned_to
        },
        metadata: {
          incidentId: incident.id,
          reportedBy: incident.created_by,
          actionBy: incident.assigned_to // For reminders, keep assigned_to as actionBy since it's a system reminder
        }
      };

      return await notificationService.queueNotification(notificationData, currentEmployeeData);
    } catch (error) {
      console.error('Error queueing incident reminder notification:', error);
      return false;
    }
  }

  /**
   * Get incident recipients (assigned employee and reporter)
   */
  private async getIncidentRecipients(incident: IncidentRow): Promise<Employee[]> {
    const recipients: Employee[] = [];

    try {
      // Get assigned employee
      if (incident.assigned_to) {
        const assignedEmployee = await this.getEmployeeById(incident.assigned_to);
        if (assignedEmployee) {
          recipients.push(assignedEmployee);
        }
      }

      // Get reporter (if different from assigned)
      if (incident.created_by && incident.created_by !== incident.assigned_to) {
        const reporter = await this.getEmployeeById(incident.created_by);
        if (reporter) {
          recipients.push(reporter);
        }
      }
    } catch (error) {
      console.error('Error getting incident recipients:', error);
    }

    return recipients;
  }

  /**
   * Get base URL for the application
   */
  private getBaseUrl(): string {
    // Check if we're in development or production
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    
    // Fallback for server-side or when window is not available
    // You can replace this with your actual production domain
    return process.env.NODE_ENV === 'production' 
      ? 'https://school-safe-report-hub.vercel.app'  // Or your actual production domain
      : 'http://localhost:3000';
  }

  /**
   * Get employee by ID
   */
  private async getEmployeeById(employeeId: string): Promise<Employee | null> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data: employee, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, email, status')
        .eq('id', employeeId)
        .single();

      if (error || !employee) {
        console.error('Employee not found:', employeeId);
        return null;
      }

      return employee as Employee;
    } catch (error) {
      console.error('Error fetching employee:', error);
      return null;
    }
  }

  // Legacy methods for backward compatibility
  async sendIncidentAssignedNotification(incident: IncidentRow, assignedEmployee: Employee, currentEmployeeData?: Record<string, unknown>): Promise<boolean> {
    return this.queueIncidentAssignedNotification(incident, assignedEmployee, currentEmployeeData);
  }

  async sendIncidentUpdatedNotification(incident: IncidentRow, updatedBy: Employee, updateNotes?: string, currentEmployeeData?: Record<string, unknown>): Promise<boolean> {
    return this.queueIncidentUpdatedNotification(incident, updatedBy, updateNotes, currentEmployeeData);
  }

  async sendIncidentClosedNotification(incident: IncidentRow, closedBy: Employee, currentEmployeeData?: Record<string, unknown>): Promise<boolean> {
    return this.queueIncidentClosedNotification(incident, closedBy, currentEmployeeData);
  }

  async sendIncidentReopenedNotification(incident: IncidentRow, reopenedBy: Employee, reopenReason?: string, currentEmployeeData?: Record<string, unknown>): Promise<boolean> {
    return this.queueIncidentReopenedNotification(incident, reopenedBy, reopenReason, currentEmployeeData);
  }

  async sendIncidentReminderNotification(incident: IncidentRow, assignedEmployee: Employee, currentEmployeeData?: Record<string, unknown>): Promise<boolean> {
    return this.queueIncidentReminderNotification(incident, assignedEmployee, currentEmployeeData);
  }
}

// Export singleton instance
export const incidentNotificationService = IncidentNotificationService.getInstance(); 