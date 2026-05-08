import { NotificationModule, NotificationTemplate, NotificationType } from '@/types/notification';

// Frontend-managed assessment notification templates.
// Keep values as valid HTML; placeholders like {{Assessment_ID}} will be replaced by NotificationService.
const assessmentBaseStyles = 'max-width:640px;margin:0 auto;padding:24px;font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#1f2937;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:8px;';
const assessmentHeaderStyles = 'text-align:center;background-color:#f9fafb;padding:20px;margin:-24px -24px 24px -24px;border-bottom:1px solid #e5e7eb;border-radius:8px 8px 0 0;';
const assessmentContentStyles = 'text-align:left;';
const assessmentFooterStyles = 'text-align:center;margin-top:32px;padding-top:20px;border-top:1px solid #e5e7eb;color:#6b7280;';

const assessmentTemplates: Partial<Record<NotificationType, NotificationTemplate>> = {
  assessment_assigned: {
    id: 'frontend-assessment-assigned',
    module: 'assessment',
    type: 'assessment_assigned',
    subject: 'New Assessment Assigned – [Assessment ID: {{Assessment_ID}}]',
    body: `<div style="${assessmentBaseStyles}">
<div style="${assessmentHeaderStyles}">
<h2 style="margin:0;color:#1f2937;font-size:24px;">🎯 New Assessment Assigned</h2>
</div>
<div style="${assessmentContentStyles}">
<p style="margin:0 0 20px;font-size:16px;">Hello <strong>{{User_Name}}</strong>,</p>
<p style="margin:0 0 20px;font-size:16px;">A new assessment has been assigned to you.</p>
<div style="background-color:#dbeafe;padding:16px;border-radius:6px;border-left:4px solid #3b82f6;margin:20px 0;">
<h3 style="margin:0 0 12px;color:#1f2937;font-size:18px;">Assessment Details:</h3>
<p style="margin:6px 0;"><strong>Assessment ID:</strong> {{Assessment_ID}}</p>
<p style="margin:6px 0;"><strong>Title:</strong> {{Assessment_Title}}</p>
<p style="margin:6px 0;"><strong>Assigned On:</strong> {{Assigned_Date}}</p>
<p style="margin:6px 0;"><strong>Due Date:</strong> {{Due_Date}}</p>
</div>
<p style="margin:20px 0;font-size:16px;color:#6b7280;">Please review and complete it within the given timeline. <a href="{{Assessment_URL}}?search={{Assessment_Title}}" style="color:#3b82f6;text-decoration:none;"><strong>Click Here</strong></a></p>
</div>
<div style="${assessmentFooterStyles}">
<p style="margin:0;font-size:14px;">Regards,<br/><strong>Safe School Team</strong></p>
</div>
</div>`,
    variables: ['User_Name','Assessment_ID','Assessment_Title','Assigned_Date','Due_Date','Assessment_URL'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  assessment_submitted: {
    id: 'frontend-assessment-submitted',
    module: 'assessment',
    type: 'assessment_submitted',
    subject: 'Assessment Submitted – [Assessment ID: {{Assessment_ID}}]',
    body: `<div style="${assessmentBaseStyles}">
<div style="${assessmentHeaderStyles}">
<h2 style="margin:0;color:#1f2937;font-size:24px;">📝 Assessment Submitted</h2>
</div>
<div style="${assessmentContentStyles}">
<p style="margin:0 0 20px;font-size:16px;">Hello <strong>{{User_Name}}</strong>,</p>
<p style="margin:0 0 20px;font-size:16px;">The following assessment has been successfully submitted:</p>
<div style="background-color:#ecfccb;padding:16px;border-radius:6px;border-left:4px solid #65a30d;margin:20px 0;">
<h3 style="margin:0 0 12px;color:#1f2937;font-size:18px;">Submission Details:</h3>
<p style="margin:6px 0;"><strong>Assessment ID:</strong> {{Assessment_ID}}</p>
<p style="margin:6px 0;"><strong>Title:</strong> {{Assessment_Title}}</p>
<p style="margin:6px 0;"><strong>Submitted By:</strong> {{Submitted_By}}</p>
<p style="margin:6px 0;"><strong>Submission Date:</strong> {{Submitted_Date}}</p>
</div>
<p style="margin:20px 0;font-size:16px;color:#6b7280;">No further action is required unless notified. <a href="{{Assessment_URL}}" style="color:#3b82f6;text-decoration:none;"><strong>Click Here</strong></a></p>
</div>
<div style="${assessmentFooterStyles}">
<p style="margin:0;font-size:14px;">Regards,<br/><strong>Safe School Team</strong></p>
</div>
</div>`,
    variables: ['User_Name','Assessment_ID','Assessment_Title','Submitted_By','Submitted_Date','Assessment_URL'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  assessment_completed: {
    id: 'frontend-assessment-completed',
    module: 'assessment',
    type: 'assessment_completed',
    subject: 'Assessment Completed – [Assessment ID: {{Assessment_ID}}]',
    body: `<div style="${assessmentBaseStyles}">
<div style="${assessmentHeaderStyles}">
<h2 style="margin:0;color:#1f2937;font-size:24px;">✅ Assessment Completed</h2>
</div>
<div style="${assessmentContentStyles}">
<p style="margin:0 0 20px;font-size:16px;">Hello <strong>{{User_Name}}</strong>,</p>
<p style="margin:0 0 20px;font-size:16px;">The following assessment has been completed:</p>
<div style="background-color:#dcfce7;padding:16px;border-radius:6px;border-left:4px solid #16a34a;margin:20px 0;">
<h3 style="margin:0 0 12px;color:#1f2937;font-size:18px;">Completion Details:</h3>
<p style="margin:6px 0;"><strong>Assessment ID:</strong> {{Assessment_ID}}</p>
<p style="margin:6px 0;"><strong>Title:</strong> {{Assessment_Title}}</p>
<p style="margin:6px 0;"><strong>Completed By:</strong> {{Completed_By}}</p>
<p style="margin:6px 0;"><strong>Completion Date:</strong> {{Completed_Date}}</p>
</div>
<p style="margin:20px 0;font-size:16px;color:#6b7280;">This task is now complete. <a href="{{Assessment_URL}}" style="color:#3b82f6;text-decoration:none;"><strong>Click Here</strong></a></p>
</div>
<div style="${assessmentFooterStyles}">
<p style="margin:0;font-size:14px;">Regards,<br/><strong>Safe School Team</strong></p>
</div>
</div>`,
    variables: ['User_Name','Assessment_ID','Assessment_Title','Completed_By','Completed_Date','Assessment_URL'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  assessment_rework_required: {
    id: 'frontend-assessment-rework-required',
    module: 'assessment',
    type: 'assessment_rework_required',
    subject: 'Rework Required – [Assessment ID: {{Assessment_ID}}]',
    body: `<div style="${assessmentBaseStyles}">
<div style="${assessmentHeaderStyles}">
<h2 style="margin:0;color:#1f2937;font-size:24px;">🔄 Rework Required</h2>
</div>
<div style="${assessmentContentStyles}">
<p style="margin:0 0 20px;font-size:16px;">Hello <strong>{{User_Name}}</strong>,</p>
<p style="margin:0 0 20px;font-size:16px;">Your submitted assessment requires rework.</p>
<div style="background-color:#fef3c7;padding:16px;border-radius:6px;border-left:4px solid #f59e0b;margin:20px 0;">
<h3 style="margin:0 0 12px;color:#1f2937;font-size:18px;">Rework Details:</h3>
<p style="margin:6px 0;"><strong>Assessment ID:</strong> {{Assessment_ID}}</p>
<p style="margin:6px 0;"><strong>Title:</strong> {{Assessment_Title}}</p>
<p style="margin:6px 0;"><strong>Requested By:</strong> {{Requested_By}}</p>
<p style="margin:6px 0;"><strong>Reason:</strong> {{Rework_Reason}}</p>
</div>
<p style="margin:20px 0;font-size:16px;color:#6b7280;">Please make the necessary changes and resubmit. <a href="{{Assessment_URL}}" style="color:#3b82f6;text-decoration:none;"><strong>Click Here</strong></a></p>
</div>
<div style="${assessmentFooterStyles}">
<p style="margin:0;font-size:14px;">Regards,<br/><strong>Safe School Team</strong></p>
</div>
</div>`,
    variables: ['User_Name','Assessment_ID','Assessment_Title','Requested_By','Rework_Reason','Assessment_URL'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  assessment_due_5_days: {
    id: 'frontend-assessment-due-5-days',
    module: 'assessment',
    type: 'assessment_due_5_days',
    subject: 'Reminder – 5 Days Left for Assessment Due Date [Assessment ID: {{Assessment_ID}}]',
    body: `<div style="${assessmentBaseStyles}">
<div style="${assessmentHeaderStyles}">
<h2 style="margin:0;color:#1f2937;font-size:24px;">⏰ Assessment Due Reminder</h2>
</div>
<div style="${assessmentContentStyles}">
<p style="margin:0 0 20px;font-size:16px;">Hello <strong>{{User_Name}}</strong>,</p>
<p style="margin:0 0 20px;font-size:16px;">This is a reminder that your assessment is due in <strong>5 days</strong>.</p>
<div style="background-color:#fef3c7;padding:16px;border-radius:6px;border-left:4px solid #f59e0b;margin:20px 0;">
<h3 style="margin:0 0 12px;color:#1f2937;font-size:18px;">Assessment Details:</h3>
<p style="margin:6px 0;"><strong>Assessment ID:</strong> {{Assessment_ID}}</p>
<p style="margin:6px 0;"><strong>Title:</strong> {{Assessment_Title}}</p>
<p style="margin:6px 0;"><strong>Due Date:</strong> {{Due_Date}}</p>
</div>
<p style="margin:20px 0;font-size:16px;color:#6b7280;">Kindly complete and submit it on time. <a href="{{Assessment_URL}}" style="color:#3b82f6;text-decoration:none;"><strong>Click Here</strong></a></p>
</div>
<div style="${assessmentFooterStyles}">
<p style="margin:0;font-size:14px;">Regards,<br/><strong>Safe School Team</strong></p>
</div>
</div>`,
    variables: ['User_Name','Assessment_ID','Assessment_Title','Due_Date','Assessment_URL'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  assessment_overdue: {
    id: 'frontend-assessment-overdue',
    module: 'assessment',
    type: 'assessment_overdue',
    subject: 'Assessment Overdue by {{Overdue_Days}} Days – [Assessment ID: {{Assessment_ID}}]',
    body: `<div style="${assessmentBaseStyles}">
<div style="${assessmentHeaderStyles}">
<h2 style="margin:0;color:#1f2937;font-size:24px;">🚨 Assessment Overdue</h2>
</div>
<div style="${assessmentContentStyles}">
<p style="margin:0 0 20px;font-size:16px;">Hello <strong>{{User_Name}}</strong>,</p>
<p style="margin:0 0 20px;font-size:16px;">The following assessment is overdue by <strong>{{Overdue_Days}} days</strong> and requires immediate attention.</p>
<div style="background-color:#fee2e2;padding:16px;border-radius:6px;border-left:4px solid #dc2626;margin:20px 0;">
<h3 style="margin:0 0 12px;color:#1f2937;font-size:18px;">Overdue Assessment:</h3>
<p style="margin:6px 0;"><strong>Assessment ID:</strong> {{Assessment_ID}}</p>
<p style="margin:6px 0;"><strong>Title:</strong> {{Assessment_Title}}</p>
<p style="margin:6px 0;"><strong>Due Date:</strong> {{Due_Date}}</p>
<p style="margin:6px 0;"><strong>Days Overdue:</strong> {{Overdue_Days}}</p>
</div>
<p style="margin:20px 0;font-size:16px;color:#6b7280;">Please submit it at the earliest to avoid escalation. <a href="{{Assessment_URL}}" style="color:#3b82f6;text-decoration:none;"><strong>Click Here</strong></a></p>
</div>
<div style="${assessmentFooterStyles}">
<p style="margin:0;font-size:14px;">Regards,<br/><strong>Safe School Team</strong></p>
</div>
</div>`,
    variables: ['User_Name','Assessment_ID','Assessment_Title','Due_Date','Overdue_Days','Assessment_URL'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
};

/**
 * Get assessment template by type
 */
export function getAssessmentTemplate(type: NotificationType): NotificationTemplate | null {
  return assessmentTemplates[type] || null;
}

/**
 * Get all assessment templates
 */
export function getAllAssessmentTemplates(): NotificationTemplate[] {
  return Object.values(assessmentTemplates).filter(Boolean) as NotificationTemplate[];
} 