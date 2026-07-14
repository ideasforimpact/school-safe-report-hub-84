import { notificationService } from './notificationService';
import {
  NotificationData,
  NotificationType
} from '@/types/notification';
import { EmployeeData } from '@/contexts/auth/types';
import { formatEmployeeName } from './formatHelpers';

// Define the Employee interface based on the database structure
interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status?: boolean;
}

interface AssessmentNotificationAssessment {
  id: string;
  title: string;
  client_id: string;
  created_by: string;
  assigned_to: string;
  target_completion_date?: string | null;
}

// Assessment notification data interface
interface AssessmentNotificationData extends NotificationData {
  metadata: {
    assessmentId: string;
    createdBy: string;
    assignedTo?: string;
    actionBy: string;
  };
}

export class AssessmentNotificationService {
  private static instance: AssessmentNotificationService;
  
  private constructor() {}
  
  public static getInstance(): AssessmentNotificationService {
    if (!AssessmentNotificationService.instance) {
      AssessmentNotificationService.instance = new AssessmentNotificationService();
    }
    return AssessmentNotificationService.instance;
  }

  /**
   * Queue assessment assigned notification
   */
  async queueAssessmentAssignedNotification(
    assessment: AssessmentNotificationAssessment, 
    assignedEmployee: Employee, 
    currentEmployeeData?: EmployeeData
  ): Promise<boolean> {
    try {
      // Validate required employee data — only id + email are required for delivery.
      // first_name / last_name may legitimately be empty for shared / single-name accounts
      // (this guard was previously rejecting them, causing emails to silently disappear).
      if (!assignedEmployee?.id || !assignedEmployee?.email) {
        console.error('Invalid assigned employee data:', assignedEmployee);
        return false;
      }

      // Validate assessment data
      if (!assessment?.id || !assessment?.title || !assessment?.client_id) {
        console.error('Invalid assessment data:', assessment);
        return false;
      }

      const recipientDisplayName = formatEmployeeName(assignedEmployee);

      const notificationData: NotificationData = {
        module: 'assessment',
        type: 'assessment_assigned' as NotificationType,
        recipientId: assignedEmployee.id,
        recipientEmail: assignedEmployee.email,
        recipientName: recipientDisplayName,
        clientId: assessment.client_id,
        priority: 'medium',
        variables: {
          User_Name: recipientDisplayName,
          Assessment_ID: assessment.id,
          Assessment_Title: assessment.title,
          created_by: assessment.created_by,
          assigned_to: assessment.assigned_to,
          Assigned_Date: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          Due_Date: assessment.target_completion_date ? new Date(assessment.target_completion_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }) : 'Not specified',
          Assessment_URL: `${this.getBaseUrl()}/assessments`
        },
        metadata: {
          assessmentId: assessment.id,
          createdBy: assessment.created_by,
          assignedTo: assessment.assigned_to,
          actionBy: assessment.created_by // The person who created and assigned the assessment
        }
      };

      console.log('Queueing assessment assigned notification:', {
        assessmentId: assessment.id,
        recipientId: assignedEmployee.id,
        recipientEmail: assignedEmployee.email
      });

      const { success, emailQueueId } = await notificationService.queueNotificationWithId(notificationData, currentEmployeeData);
      if (success) {
        await this.triggerImmediateEmailProcessing(emailQueueId);
      }
      return success;
    } catch (error) {
      console.error('Error queueing assessment assigned notification:', error);
      return false;
    }
  }

  /**
   * Queue assessment reassigned notification
   */
  async queueAssessmentReassignedNotification(
    assessment: any,
    assignedEmployee: Employee,
    currentEmployeeData?: any
  ): Promise<boolean> {
    try {
      if (!assignedEmployee?.id || !assignedEmployee?.email) {
        console.error('Invalid assigned employee data:', assignedEmployee);
        return false;
      }

      if (!assessment?.id || !assessment?.title || !assessment?.client_id) {
        console.error('Invalid assessment data:', assessment);
        return false;
      }

      const recipientDisplayName = formatEmployeeName(assignedEmployee);

      const notificationData: NotificationData = {
        module: 'assessment',
        type: 'assessment_reassigned' as NotificationType,
        recipientId: assignedEmployee.id,
        recipientEmail: assignedEmployee.email,
        recipientName: recipientDisplayName,
        clientId: assessment.client_id,
        priority: 'medium',
        variables: {
          User_Name: recipientDisplayName,
          Assessment_ID: assessment.id,
          Assessment_Title: assessment.title,
          created_by: assessment.created_by,
          assigned_to: assessment.assigned_to,
          Reassigned_Date: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          Due_Date: assessment.target_completion_date ? new Date(assessment.target_completion_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }) : 'Not specified',
          Assessment_URL: `${this.getBaseUrl()}/assessments`
        },
        metadata: {
          assessmentId: assessment.id,
          createdBy: assessment.created_by,
          assignedTo: assessment.assigned_to,
          actionBy: assessment.created_by
        }
      };

      console.log('Queueing assessment reassigned notification:', {
        assessmentId: assessment.id,
        recipientId: assignedEmployee.id,
        recipientEmail: assignedEmployee.email
      });

      const { success, emailQueueId } = await notificationService.queueNotificationWithId(notificationData, currentEmployeeData);
      if (success) {
        await this.triggerImmediateEmailProcessing(emailQueueId);
      }
      return success;
    } catch (error) {
      console.error('Error queueing assessment reassigned notification:', error);
      return false;
    }
  }

  /**
   * Queue assessment submitted notification
   */
  async queueAssessmentSubmittedNotification(
    assessment: AssessmentNotificationAssessment, 
    submittedBy: Employee, 
    currentEmployeeData?: EmployeeData
  ): Promise<boolean> {
    try {
      const createdByEmployee = await this.getEmployeeById(assessment.created_by);
      if (!createdByEmployee) {
        console.error('Creator employee not found for assessment:', assessment.id);
        return false;
      }

      const recipientDisplayName = formatEmployeeName(createdByEmployee);
      const actorDisplayName = formatEmployeeName(submittedBy);

      const notificationData: NotificationData = {
        module: 'assessment',
        type: 'assessment_submitted' as NotificationType,
        recipientId: createdByEmployee.id,
        recipientEmail: createdByEmployee.email,
        recipientName: recipientDisplayName,
        clientId: assessment.client_id,
        priority: 'medium',
        variables: {
          User_Name: recipientDisplayName,
          Assessment_ID: assessment.id,
          Assessment_Title: assessment.title,
          created_by: assessment.created_by,
          assigned_to: assessment.assigned_to,
          Submitted_By: actorDisplayName,
          Submitted_Date: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          Assessment_URL: `${this.getBaseUrl()}/assessments`
        },
        metadata: {
          assessmentId: assessment.id,
          createdBy: assessment.created_by,
          assignedTo: assessment.assigned_to,
          actionBy: submittedBy.id
        }
      };

      const { success, emailQueueId } = await notificationService.queueNotificationWithId(notificationData, currentEmployeeData);
      if (success) {
        await this.triggerImmediateEmailProcessing(emailQueueId);
      }
      return success;
    } catch (error) {
      console.error('Error queueing assessment submitted notification:', error);
      return false;
    }
  }

  /**
   * Queue assessment completed notification
   */
  async queueAssessmentCompletedNotification(
    assessment: AssessmentNotificationAssessment, 
    completedBy: Employee,
    currentEmployeeData?: EmployeeData
  ): Promise<boolean> {
    try {
      const assignedEmployee = await this.getEmployeeById(assessment.assigned_to);
      if (!assignedEmployee) {
        console.error('Assigned employee not found for assessment:', assessment.id);
        return false;
      }

      const recipientDisplayName = formatEmployeeName(assignedEmployee);
      const actorDisplayName = formatEmployeeName(completedBy);

      const notificationData: NotificationData = {
        module: 'assessment',
        type: 'assessment_completed' as NotificationType,
        recipientId: assignedEmployee.id,
        recipientEmail: assignedEmployee.email,
        recipientName: recipientDisplayName,
        clientId: assessment.client_id,
        priority: 'medium',
        variables: {
          User_Name: recipientDisplayName,
          Assessment_ID: assessment.id,
          Assessment_Title: assessment.title,
          created_by: assessment.created_by,
          assigned_to: assessment.assigned_to,
          Completed_By: actorDisplayName,
          Completed_Date: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          Assessment_URL: `${this.getBaseUrl()}/assessments`
        },
        metadata: {
          assessmentId: assessment.id,
          createdBy: assessment.created_by,
          assignedTo: assessment.assigned_to,
          actionBy: completedBy.id
        }
      };

      return await notificationService.queueNotification(notificationData, currentEmployeeData);
    } catch (error) {
      console.error('Error queueing assessment completed notification:', error);
      return false;
    }
  }

  /**
   * Queue assessment rework required notification
   */
  async queueAssessmentReworkRequiredNotification(
    assessment: AssessmentNotificationAssessment, 
    requestedBy: Employee, 
    reworkReason: string,
    currentEmployeeData?: EmployeeData
  ): Promise<boolean> {
    try {
      const assignedEmployee = await this.getEmployeeById(assessment.assigned_to);
      if (!assignedEmployee) {
        console.error('Assigned employee not found for assessment:', assessment.id);
        return false;
      }

      const recipientDisplayName = formatEmployeeName(assignedEmployee);
      const actorDisplayName = formatEmployeeName(requestedBy);

      const notificationData: NotificationData = {
        module: 'assessment',
        type: 'assessment_rework_required' as NotificationType,
        recipientId: assignedEmployee.id,
        recipientEmail: assignedEmployee.email,
        recipientName: recipientDisplayName,
        clientId: assessment.client_id,
        priority: 'high',
        variables: {
          User_Name: recipientDisplayName,
          Assessment_ID: assessment.id,
          Assessment_Title: assessment.title,
          created_by: assessment.created_by,
          assigned_to: assessment.assigned_to,
          Requested_By: actorDisplayName,
          Rework_Reason: reworkReason,
          Assessment_URL: `${this.getBaseUrl()}/assessments`
        },
        metadata: {
          assessmentId: assessment.id,
          createdBy: assessment.created_by,
          assignedTo: assessment.assigned_to,
          actionBy: requestedBy.id
        }
      };

      const { success, emailQueueId } = await notificationService.queueNotificationWithId(notificationData, currentEmployeeData);
      if (success) {
        await this.triggerImmediateEmailProcessing(emailQueueId);
      }
      return success;
    } catch (error) {
      console.error('Error queueing assessment rework required notification:', error);
      return false;
    }
  }

  /**
   * Queue assessment due in 5 days notification
   */
  async queueAssessmentDueReminderNotification(
    assessment: AssessmentNotificationAssessment, 
    assignedEmployee: Employee,
    currentEmployeeData?: EmployeeData
  ): Promise<boolean> {
    try {
      const recipientDisplayName = formatEmployeeName(assignedEmployee);

      const notificationData: NotificationData = {
        module: 'assessment',
        type: 'assessment_due_5_days' as NotificationType,
        recipientId: assignedEmployee.id,
        recipientEmail: assignedEmployee.email,
        recipientName: recipientDisplayName,
        clientId: assessment.client_id,
        priority: 'medium',
        variables: {
          User_Name: recipientDisplayName,
          Assessment_ID: assessment.id,
          Assessment_Title: assessment.title,
          created_by: assessment.created_by,
          assigned_to: assessment.assigned_to,
          Due_Date: assessment.target_completion_date ? new Date(assessment.target_completion_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }) : 'Not specified',
          Assessment_URL: `${this.getBaseUrl()}/assessments`
        },
        metadata: {
          assessmentId: assessment.id,
          createdBy: assessment.created_by,
          assignedTo: assessment.assigned_to,
          actionBy: assessment.assigned_to // System reminder
        }
      };

      return await notificationService.queueNotification(notificationData, currentEmployeeData);
    } catch (error) {
      console.error('Error queueing assessment due reminder notification:', error);
      return false;
    }
  }

  /**
   * Queue assessment overdue notification
   */
  async queueAssessmentOverdueNotification(
    assessment: AssessmentNotificationAssessment, 
    assignedEmployee: Employee,
    overdueDays: number,
    currentEmployeeData?: EmployeeData
  ): Promise<boolean> {
    try {
      const recipientDisplayName = formatEmployeeName(assignedEmployee);

      const notificationData: NotificationData = {
        module: 'assessment',
        type: 'assessment_overdue' as NotificationType,
        recipientId: assignedEmployee.id,
        recipientEmail: assignedEmployee.email,
        recipientName: recipientDisplayName,
        clientId: assessment.client_id,
        priority: 'high',
        variables: {
          User_Name: recipientDisplayName,
          Assessment_ID: assessment.id,
          Assessment_Title: assessment.title,
          created_by: assessment.created_by,
          assigned_to: assessment.assigned_to,
          Due_Date: assessment.target_completion_date ? new Date(assessment.target_completion_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }) : 'Not specified',
          Overdue_Days: overdueDays.toString(),
          Assessment_URL: `${this.getBaseUrl()}/assessments`
        },
        metadata: {
          assessmentId: assessment.id,
          createdBy: assessment.created_by,
          assignedTo: assessment.assigned_to,
          actionBy: assessment.assigned_to // System reminder
        }
      };

      return await notificationService.queueNotification(notificationData, currentEmployeeData);
    } catch (error) {
      console.error('Error queueing assessment overdue notification:', error);
      return false;
    }
  }

  /**
   * Process the email queue immediately after queueing a notification, instead
   * of waiting for the periodic cron to pick it up. Failures here are logged
   * but never block the caller — the row stays queued for the cron either way.
   *
   * When emailQueueId is provided, only that specific row is processed —
   * this guarantees it's sent right away even if there's a backlog of older
   * unsent rows that would otherwise push it outside the cron's batch window.
   * Falls back to a full batch-scan invoke if no id is available.
   */
  private async triggerImmediateEmailProcessing(emailQueueId?: string): Promise<void> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      await supabase.functions.invoke(
        'process-email-queue',
        emailQueueId ? { body: { emailQueueId } } : undefined
      );
    } catch (error) {
      console.error('Error triggering immediate email queue processing:', error);
    }
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
}

// Export singleton instance
export const assessmentNotificationService = AssessmentNotificationService.getInstance(); 