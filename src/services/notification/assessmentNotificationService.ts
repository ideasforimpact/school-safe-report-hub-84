import { notificationService } from './notificationService';
import { 
  NotificationData,
  NotificationType 
} from '@/types/notification';
import { EmployeeData } from '@/contexts/auth/types';

// Define the Employee interface based on the database structure
interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status?: boolean;
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
    assessment: any, 
    assignedEmployee: Employee, 
    currentEmployeeData?: any
  ): Promise<boolean> {
    try {
      // Validate required employee data
      if (!assignedEmployee?.id || !assignedEmployee?.email || !assignedEmployee?.first_name || !assignedEmployee?.last_name) {
        console.error('Invalid assigned employee data:', assignedEmployee);
        return false;
      }

      // Validate assessment data
      if (!assessment?.id || !assessment?.title || !assessment?.client_id) {
        console.error('Invalid assessment data:', assessment);
        return false;
      }

      const notificationData: NotificationData = {
        module: 'assessment',
        type: 'assessment_assigned' as NotificationType,
        recipientId: assignedEmployee.id,
        recipientEmail: assignedEmployee.email,
        recipientName: `${assignedEmployee.first_name} ${assignedEmployee.last_name}`,
        clientId: assessment.client_id,
        priority: 'medium',
        variables: {
          User_Name: `${assignedEmployee.first_name} ${assignedEmployee.last_name}`,
          Assessment_ID: assessment.id,
          Assessment_Title: assessment.title,
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
          Assessment_URL: `${this.getBaseUrl()}/assessments/${assessment.id}`
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

      return await notificationService.queueNotification(notificationData, currentEmployeeData);
    } catch (error) {
      console.error('Error queueing assessment assigned notification:', error);
      return false;
    }
  }

  /**
   * Queue assessment submitted notification
   */
  async queueAssessmentSubmittedNotification(
    assessment: any, 
    submittedBy: Employee, 
    currentEmployeeData?: any
  ): Promise<boolean> {
    try {
      const createdByEmployee = await this.getEmployeeById(assessment.created_by);
      if (!createdByEmployee) {
        console.error('Creator employee not found for assessment:', assessment.id);
        return false;
      }

      const notificationData: NotificationData = {
        module: 'assessment',
        type: 'assessment_submitted' as NotificationType,
        recipientId: createdByEmployee.id,
        recipientEmail: createdByEmployee.email,
        recipientName: `${createdByEmployee.first_name} ${createdByEmployee.last_name}`,
        clientId: assessment.client_id,
        priority: 'medium',
        variables: {
          User_Name: `${createdByEmployee.first_name} ${createdByEmployee.last_name}`,
          Assessment_ID: assessment.id,
          Assessment_Title: assessment.title,
          Submitted_By: `${submittedBy.first_name} ${submittedBy.last_name}`,
          Submitted_Date: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          Assessment_URL: `${this.getBaseUrl()}/assessments/${assessment.id}`
        },
        metadata: {
          assessmentId: assessment.id,
          createdBy: assessment.created_by,
          assignedTo: assessment.assigned_to,
          actionBy: submittedBy.id
        }
      };

      return await notificationService.queueNotification(notificationData, currentEmployeeData);
    } catch (error) {
      console.error('Error queueing assessment submitted notification:', error);
      return false;
    }
  }

  /**
   * Queue assessment completed notification
   */
  async queueAssessmentCompletedNotification(
    assessment: any, 
    completedBy: Employee,
    currentEmployeeData?: any
  ): Promise<boolean> {
    try {
      const assignedEmployee = await this.getEmployeeById(assessment.assigned_to);
      if (!assignedEmployee) {
        console.error('Assigned employee not found for assessment:', assessment.id);
        return false;
      }

      const notificationData: NotificationData = {
        module: 'assessment',
        type: 'assessment_completed' as NotificationType,
        recipientId: assignedEmployee.id,
        recipientEmail: assignedEmployee.email,
        recipientName: `${assignedEmployee.first_name} ${assignedEmployee.last_name}`,
        clientId: assessment.client_id,
        priority: 'medium',
        variables: {
          User_Name: `${assignedEmployee.first_name} ${assignedEmployee.last_name}`,
          Assessment_ID: assessment.id,
          Assessment_Title: assessment.title,
          Completed_By: `${completedBy.first_name} ${completedBy.last_name}`,
          Completed_Date: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          Assessment_URL: `${this.getBaseUrl()}/assessments/${assessment.id}`
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
    assessment: any, 
    requestedBy: Employee, 
    reworkReason: string,
    currentEmployeeData?: any
  ): Promise<boolean> {
    try {
      const assignedEmployee = await this.getEmployeeById(assessment.assigned_to);
      if (!assignedEmployee) {
        console.error('Assigned employee not found for assessment:', assessment.id);
        return false;
      }

      const notificationData: NotificationData = {
        module: 'assessment',
        type: 'assessment_rework_required' as NotificationType,
        recipientId: assignedEmployee.id,
        recipientEmail: assignedEmployee.email,
        recipientName: `${assignedEmployee.first_name} ${assignedEmployee.last_name}`,
        clientId: assessment.client_id,
        priority: 'high',
        variables: {
          User_Name: `${assignedEmployee.first_name} ${assignedEmployee.last_name}`,
          Assessment_ID: assessment.id,
          Assessment_Title: assessment.title,
          Requested_By: `${requestedBy.first_name} ${requestedBy.last_name}`,
          Rework_Reason: reworkReason,
          Assessment_URL: `${this.getBaseUrl()}/assessments/${assessment.id}`
        },
        metadata: {
          assessmentId: assessment.id,
          createdBy: assessment.created_by,
          assignedTo: assessment.assigned_to,
          actionBy: requestedBy.id
        }
      };

      return await notificationService.queueNotification(notificationData, currentEmployeeData);
    } catch (error) {
      console.error('Error queueing assessment rework required notification:', error);
      return false;
    }
  }

  /**
   * Queue assessment due in 5 days notification
   */
  async queueAssessmentDueReminderNotification(
    assessment: any, 
    assignedEmployee: Employee,
    currentEmployeeData?: any
  ): Promise<boolean> {
    try {
      const notificationData: NotificationData = {
        module: 'assessment',
        type: 'assessment_due_5_days' as NotificationType,
        recipientId: assignedEmployee.id,
        recipientEmail: assignedEmployee.email,
        recipientName: `${assignedEmployee.first_name} ${assignedEmployee.last_name}`,
        clientId: assessment.client_id,
        priority: 'medium',
        variables: {
          User_Name: `${assignedEmployee.first_name} ${assignedEmployee.last_name}`,
          Assessment_ID: assessment.id,
          Assessment_Title: assessment.title,
          Due_Date: assessment.target_completion_date ? new Date(assessment.target_completion_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }) : 'Not specified',
          Assessment_URL: `${this.getBaseUrl()}/assessments/${assessment.id}`
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
    assessment: any, 
    assignedEmployee: Employee,
    overdueDays: number,
    currentEmployeeData?: any
  ): Promise<boolean> {
    try {
      const notificationData: NotificationData = {
        module: 'assessment',
        type: 'assessment_overdue' as NotificationType,
        recipientId: assignedEmployee.id,
        recipientEmail: assignedEmployee.email,
        recipientName: `${assignedEmployee.first_name} ${assignedEmployee.last_name}`,
        clientId: assessment.client_id,
        priority: 'high',
        variables: {
          User_Name: `${assignedEmployee.first_name} ${assignedEmployee.last_name}`,
          Assessment_ID: assessment.id,
          Assessment_Title: assessment.title,
          Due_Date: assessment.target_completion_date ? new Date(assessment.target_completion_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }) : 'Not specified',
          Overdue_Days: overdueDays.toString(),
          Assessment_URL: `${this.getBaseUrl()}/assessments/${assessment.id}`
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