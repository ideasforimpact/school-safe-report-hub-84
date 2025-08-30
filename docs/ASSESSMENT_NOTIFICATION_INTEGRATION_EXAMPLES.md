# Assessment Notification Integration Examples

## Overview
This document shows how to integrate assessment notifications into the specific components you mentioned:

1. **CreateAssessmentForm** → handleSubmit (Assessment Assigned)
2. **useAssessmentAnswerData** → handleSubmit (Assessment Submitted) 
3. **AssessmentViewDialog** → handleCompleteAssessment (Assessment Completed)
4. **AssessmentViewDialog** → handleReworkAssessment (Assessment Rework Required)

## 1. Assessment Assigned Notification

### Location: `CreateAssessmentForm` → `handleSubmit`

```typescript
import { assessmentNotificationService } from '@/services/notification/assessmentNotificationService';
import { useAuth } from '@/contexts/AuthContext';

const CreateAssessmentForm = () => {
  const { employeeData } = useAuth();

  const handleSubmit = async (formData: any) => {
    try {
      // 1. Create assessment first
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('assessments')
        .insert({
          title: formData.title,
          description: formData.description,
          assigned_to: formData.assignedTo,
          target_completion_date: formData.dueDate,
          created_by: employeeData?.id,
          client_id: employeeData?.clientId,
          status: 'assigned'
        })
        .select('id, title, target_completion_date, assigned_to, created_by, client_id')
        .single();

      if (assessmentError) {
        throw new Error(assessmentError.message);
      }

      // 2. Send notification if assigned to someone (and not self-assigned)
      if (formData.assignedTo && formData.assignedTo !== employeeData?.id) {
        console.log('Sending assessment assigned notification...');
        
        try {
          // Get assignee details
          const { data: assignee, error: assigneeError } = await supabase
            .from('employees')
            .select('id, email, first_name, last_name')
            .eq('id', formData.assignedTo)
            .single();

          if (assigneeError) {
            console.error('Error fetching assignee:', assigneeError);
          } else if (assignee) {
            const notificationResult = await assessmentNotificationService.queueAssessmentAssignedNotification(
              assessmentData,
              assignee,
              employeeData
            );
            
            console.log('Assessment assignment notification queued:', notificationResult);
          }
        } catch (notificationError) {
          console.error('Error queueing assessment assignment notification:', notificationError);
          // Don't fail the assessment creation if notification fails
        }
      }

      toast.success('Assessment created successfully');
      // Handle success...
      
    } catch (error) {
      console.error('Error creating assessment:', error);
      toast.error('Failed to create assessment');
    }
  };
};
```

## 2. Assessment Submitted Notification

### Location: `useAssessmentAnswerData` → `handleSubmit`

```typescript
import { assessmentNotificationService } from '@/services/notification/assessmentNotificationService';
import { useAuth } from '@/contexts/AuthContext';

const useAssessmentAnswerData = () => {
  const { employeeData } = useAuth();

  const handleSubmit = async (assessmentId: string, answers: any) => {
    try {
      // 1. Submit assessment answers first
      const { data: submissionData, error: submissionError } = await supabase
        .from('assessment_submissions')
        .insert({
          assessment_id: assessmentId,
          submitted_by: employeeData?.id,
          answers: answers,
          submitted_at: new Date().toISOString(),
          status: 'submitted'
        })
        .select()
        .single();

      if (submissionError) {
        throw new Error(submissionError.message);
      }

      // 2. Update assessment status
      await supabase
        .from('assessments')
        .update({ status: 'submitted' })
        .eq('id', assessmentId);

      // 3. Send notification to assessment creator (not self if self-submitted)
      try {
        // Get assessment details
        const { data: assessment, error: assessmentError } = await supabase
          .from('assessments')
          .select('id, title, created_by, assigned_to, client_id')
          .eq('id', assessmentId)
          .single();

        if (assessmentError) {
          console.error('Error fetching assessment:', assessmentError);
        } else if (assessment && assessment.created_by !== employeeData?.id) {
          // Get submitter details (current user)
          const submitter = {
            id: employeeData?.id || '',
            first_name: employeeData?.firstName || '',
            last_name: employeeData?.lastName || '',
            email: employeeData?.email || ''
          };

          const notificationResult = await assessmentNotificationService.queueAssessmentSubmittedNotification(
            assessment,
            submitter,
            employeeData
          );
          
          console.log('Assessment submission notification queued:', notificationResult);
        }
      } catch (notificationError) {
        console.error('Error queueing assessment submission notification:', notificationError);
        // Don't fail the submission if notification fails
      }

      toast.success('Assessment submitted successfully');
      // Handle success...
      
    } catch (error) {
      console.error('Error submitting assessment:', error);
      toast.error('Failed to submit assessment');
    }
  };
};
```

## 3. Assessment Completed Notification

### Location: `AssessmentViewDialog` → `handleCompleteAssessment`

```typescript
import { assessmentNotificationService } from '@/services/notification/assessmentNotificationService';
import { useAuth } from '@/contexts/AuthContext';

const AssessmentViewDialog = () => {
  const { employeeData } = useAuth();

  const handleCompleteAssessment = async (assessmentId: string) => {
    try {
      // 1. Update assessment status to completed
      const { data: assessmentData, error: updateError } = await supabase
        .from('assessments')
        .update({ 
          status: 'completed',
          completed_by: employeeData?.id,
          completed_at: new Date().toISOString()
        })
        .eq('id', assessmentId)
        .select('id, title, assigned_to, created_by, client_id')
        .single();

      if (updateError) {
        throw new Error(updateError.message);
      }

      // 2. Send notification to assigned person (not self if self-completed)
      if (assessmentData.assigned_to && assessmentData.assigned_to !== employeeData?.id) {
        try {
          // Get completer details (current user)
          const completer = {
            id: employeeData?.id || '',
            first_name: employeeData?.firstName || '',
            last_name: employeeData?.lastName || '',
            email: employeeData?.email || ''
          };

          const notificationResult = await assessmentNotificationService.queueAssessmentCompletedNotification(
            assessmentData,
            completer,
            employeeData
          );
          
          console.log('Assessment completion notification queued:', notificationResult);
        } catch (notificationError) {
          console.error('Error queueing assessment completion notification:', notificationError);
          // Don't fail the completion if notification fails
        }
      }

      toast.success('Assessment marked as completed');
      // Handle success...
      
    } catch (error) {
      console.error('Error completing assessment:', error);
      toast.error('Failed to complete assessment');
    }
  };
};
```

## 4. Assessment Rework Required Notification

### Location: `AssessmentViewDialog` → `handleReworkAssessment`

```typescript
import { assessmentNotificationService } from '@/services/notification/assessmentNotificationService';
import { useAuth } from '@/contexts/AuthContext';

const AssessmentViewDialog = () => {
  const { employeeData } = useAuth();

  const handleReworkAssessment = async (assessmentId: string, reworkReason: string) => {
    try {
      // 1. Update assessment status to rework required
      const { data: assessmentData, error: updateError } = await supabase
        .from('assessments')
        .update({ 
          status: 'rework_required',
          rework_reason: reworkReason,
          rework_requested_by: employeeData?.id,
          rework_requested_at: new Date().toISOString()
        })
        .eq('id', assessmentId)
        .select('id, title, assigned_to, created_by, client_id')
        .single();

      if (updateError) {
        throw new Error(updateError.message);
      }

      // 2. Send notification to assigned person (not self if self-requested)
      if (assessmentData.assigned_to && assessmentData.assigned_to !== employeeData?.id) {
        try {
          // Get requester details (current user)
          const requester = {
            id: employeeData?.id || '',
            first_name: employeeData?.firstName || '',
            last_name: employeeData?.lastName || '',
            email: employeeData?.email || ''
          };

          const notificationResult = await assessmentNotificationService.queueAssessmentReworkRequiredNotification(
            assessmentData,
            requester,
            reworkReason,
            employeeData
          );
          
          console.log('Assessment rework notification queued:', notificationResult);
        } catch (notificationError) {
          console.error('Error queueing assessment rework notification:', notificationError);
          // Don't fail the rework request if notification fails
        }
      }

      toast.success('Assessment sent for rework');
      // Handle success...
      
    } catch (error) {
      console.error('Error requesting assessment rework:', error);
      toast.error('Failed to request rework');
    }
  };
};
```

## 5. Reminder Notifications (Cron Job Implementation)

### For Assessment Due in 5 Days and Overdue Notifications

Create a cron job or edge function that runs daily:

```typescript
// supabase/functions/assessment-reminders/index.ts
import { assessmentNotificationService } from './path/to/assessmentNotificationService';

export const assessmentReminderCron = async () => {
  try {
    const today = new Date();
    const fiveDaysFromNow = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000);

    // 1. Find assessments due in 5 days
    const { data: dueAssessments } = await supabase
      .from('assessments')
      .select(`
        id, title, target_completion_date, assigned_to, created_by, client_id,
        assigned_employee:employees!assigned_to(id, first_name, last_name, email)
      `)
      .eq('status', 'assigned')
      .gte('target_completion_date', fiveDaysFromNow.toISOString().split('T')[0])
      .lt('target_completion_date', new Date(fiveDaysFromNow.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    // Send due reminders
    for (const assessment of dueAssessments || []) {
      if (assessment.assigned_employee) {
        await assessmentNotificationService.queueAssessmentDueReminderNotification(
          assessment,
          assessment.assigned_employee
        );
      }
    }

    // 2. Find overdue assessments
    const { data: overdueAssessments } = await supabase
      .from('assessments')
      .select(`
        id, title, target_completion_date, assigned_to, created_by, client_id,
        assigned_employee:employees!assigned_to(id, first_name, last_name, email)
      `)
      .eq('status', 'assigned')
      .lt('target_completion_date', today.toISOString().split('T')[0]);

    // Send overdue notifications
    for (const assessment of overdueAssessments || []) {
      if (assessment.assigned_employee && assessment.target_completion_date) {
        const dueDate = new Date(assessment.target_completion_date);
        const overdueDays = Math.floor((today.getTime() - dueDate.getTime()) / (24 * 60 * 60 * 1000));
        
        await assessmentNotificationService.queueAssessmentOverdueNotification(
          assessment,
          assessment.assigned_employee,
          overdueDays
        );
      }
    }

    console.log('Assessment reminders processed successfully');
  } catch (error) {
    console.error('Error processing assessment reminders:', error);
  }
};
```

## 6. Self-Action Skip Logic

The notification service automatically skips notifications when:

1. **Self-Assignment**: Creator assigns assessment to themselves
2. **Self-Submission**: Assigned person submits their own assessment  
3. **Self-Completion**: User marks their own assessment as complete
4. **Self-Rework**: User requests rework on their own assessment

This is handled by the `currentEmployeeData` parameter passed to each notification method and the skip conditions in the notification rules.

## 7. Template Variables

Each notification type uses these variables:

- **Assessment_ID**: The assessment identifier
- **Assessment_Title**: The assessment title
- **User_Name**: Recipient's full name
- **Assessment_URL**: Direct link to the assessment
- **Assigned_Date**: When the assessment was assigned
- **Due_Date**: When the assessment is due
- **Submitted_By**: Who submitted the assessment
- **Completed_By**: Who marked it as complete
- **Requested_By**: Who requested rework
- **Rework_Reason**: Why rework is needed
- **Overdue_Days**: How many days overdue

All variables are automatically populated by the notification service based on the assessment data and current user context. 