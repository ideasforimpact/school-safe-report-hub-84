import { NotificationModule, NotificationTemplate, NotificationType } from '@/types/notification';
import { getAssessmentTemplate } from './assessmentTemplates';

// Frontend-managed notification templates.
// Keep values as valid HTML; placeholders like {{Incident_ID}} will be replaced by NotificationService.
const incidentBaseStyles = 'max-width:640px;margin:0 auto;padding:24px;font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#1f2937;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:8px;';
const incidentHeaderStyles = 'text-align:center;background-color:#f9fafb;padding:20px;margin:-24px -24px 24px -24px;border-bottom:1px solid #e5e7eb;border-radius:8px 8px 0 0;';
const incidentContentStyles = 'text-align:left;';
const incidentFooterStyles = 'text-align:center;margin-top:32px;padding-top:20px;border-top:1px solid #e5e7eb;color:#6b7280;';

const incidentTemplates: Partial<Record<NotificationType, NotificationTemplate>> = {
  incident_assigned: {
    id: 'frontend-incident-assigned',
    module: 'incident',
    type: 'incident_assigned',
    subject: 'New Incident Assigned – [Incident ID: {{Incident_ID}}]'
      .replace('[Incident ID: {{Incident_ID}}]', '[Incident ID: {{Incident_ID}}]'),
    body: `<div style="${incidentBaseStyles}">
<div style="${incidentHeaderStyles}">
<h2 style="margin:0;color:#1f2937;font-size:24px;">New Incident Assigned</h2>
</div>
<div style="${incidentContentStyles}">
<p style="margin:0 0 20px;font-size:16px;">Hello <strong>{{User_Name}}</strong>,</p>
<p style="margin:0 0 20px;font-size:16px;">A new incident has been created and assigned to you for follow-up.</p>
<div style="background-color:#f9fafb;padding:16px;border-radius:6px;border-left:4px solid #3b82f6;margin:20px 0;">
<h3 style="margin:0 0 12px;color:#1f2937;font-size:18px;">Details:</h3>
<p style="margin:6px 0;"><strong>Incident ID:</strong> {{Incident_ID}}</p>
<p style="margin:6px 0;"><strong>Title:</strong> {{Incident_Title}}</p>
<p style="margin:6px 0;"><strong>Reported On:</strong> {{Reported_Date}}</p>
</div>
<p style="margin:20px 0;font-size:16px;color:#6b7280;">Please review and take necessary action. <a href="{{Incident_URL}}" style="color:#3b82f6;text-decoration:none;"><strong>Click Here</strong></a></p>
</div>
<div style="${incidentFooterStyles}">
<p style="margin:0;font-size:14px;">Regards,<br/><strong>Safe School Team</strong></p>
</div>
</div>`,
    variables: ['User_Name','Incident_ID','Incident_Title','Reported_Date','Incident_URL'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  incident_updated: {
    id: 'frontend-incident-updated',
    module: 'incident',
    type: 'incident_updated',
    subject: 'Update on Incident – [Incident ID: {{Incident_ID}}]'
      .replace('[Incident ID: {{Incident_ID}}]', '[Incident ID: {{Incident_ID}}]'),
    body: `<div style="${incidentBaseStyles}">
<div style="${incidentHeaderStyles}">
<h2 style="margin:0;color:#1f2937;font-size:24px;">Incident Updated</h2>
</div>
<div style="${incidentContentStyles}">
<p style="margin:0 0 20px;font-size:16px;">Hello <strong>{{User_Name}}</strong>,</p>
<p style="margin:0 0 20px;font-size:16px;">The following incident has been updated:</p>
<div style="background-color:#f9fafb;padding:16px;border-radius:6px;border-left:4px solid #f59e0b;margin:20px 0;">
<h3 style="margin:0 0 12px;color:#1f2937;font-size:18px;">Details:</h3>
<p style="margin:6px 0;"><strong>Incident ID:</strong> {{Incident_ID}}</p>
<p style="margin:6px 0;"><strong>Title:</strong> {{Incident_Title}}</p>
<p style="margin:6px 0;"><strong>Updated By:</strong> {{Updated_By}}</p>
<p style="margin:6px 0;"><strong>Update Summary:</strong> {{Update_Notes}}</p>
</div>
<p style="margin:20px 0;font-size:16px;color:#6b7280;">Kindly review the changes and take necessary steps. <a href="{{Incident_URL}}" style="color:#f59e0b;text-decoration:none;"><strong>Click Here</strong></a></p>
</div>
<div style="${incidentFooterStyles}">
<p style="margin:0;font-size:14px;">Regards,<br/><strong>Safe School Team</strong></p>
</div>
</div>`,
    variables: ['User_Name','Incident_ID','Incident_Title','Updated_By','Update_Notes','Incident_URL'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  incident_closed: {
    id: 'frontend-incident-closed',
    module: 'incident',
    type: 'incident_closed',
    subject: 'Incident Closed – [Incident ID: {{Incident_ID}}]'
      .replace('[Incident ID: {{Incident_ID}}]', '[Incident ID: {{Incident_ID}}]'),
    body: `<div style="${incidentBaseStyles}">
<div style="${incidentHeaderStyles}">
<h2 style="margin:0;color:#1f2937;font-size:24px;">Incident Closed</h2>
</div>
<div style="${incidentContentStyles}">
<p style="margin:0 0 20px;font-size:16px;">Hello <strong>{{User_Name}}</strong>,</p>
<p style="margin:0 0 20px;font-size:16px;">The following incident has been successfully closed:</p>
<div style="background-color:#f9fafb;padding:16px;border-radius:6px;border-left:4px solid #10b981;margin:20px 0;">
<h3 style="margin:0 0 12px;color:#1f2937;font-size:18px;">Details:</h3>
<p style="margin:6px 0;"><strong>Incident ID:</strong> {{Incident_ID}}</p>
<p style="margin:6px 0;"><strong>Title:</strong> {{Incident_Title}}</p>
<p style="margin:6px 0;"><strong>Closed By:</strong> {{Closed_By}}</p>
<p style="margin:6px 0;"><strong>Closure Date:</strong> {{Closed_Date}}</p>
</div>
<p style="margin:20px 0;font-size:16px;color:#6b7280;">No further action is required. <a href="{{Incident_URL}}" style="color:#10b981;text-decoration:none;"><strong>Click Here</strong></a> to view the closed incident.</p>
</div>
<div style="${incidentFooterStyles}">
<p style="margin:0;font-size:14px;">Regards,<br/><strong>Safe School Team</strong></p>
</div>
</div>`,
    variables: ['User_Name','Incident_ID','Incident_Title','Closed_By','Closed_Date','Incident_URL'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  incident_reopened: {
    id: 'frontend-incident-reopened',
    module: 'incident',
    type: 'incident_reopened',
    subject: 'Incident Reopened – [Incident ID: {{Incident_ID}}]'
      .replace('[Incident ID: {{Incident_ID}}]', '[Incident ID: {{Incident_ID}}]'),
    body: `<div style="${incidentBaseStyles}">
<div style="${incidentHeaderStyles}">
<h2 style="margin:0;color:#1f2937;font-size:24px;">Incident Reopened</h2>
</div>
<div style="${incidentContentStyles}">
<p style="margin:0 0 20px;font-size:16px;">Hello <strong>{{User_Name}}</strong>,</p>
<p style="margin:0 0 20px;font-size:16px;">The following incident has been reopened and requires your attention:</p>
<div style="background-color:#f9fafb;padding:16px;border-radius:6px;border-left:4px solid #ef4444;margin:20px 0;">
<h3 style="margin:0 0 12px;color:#1f2937;font-size:18px;">Details:</h3>
<p style="margin:6px 0;"><strong>Incident ID:</strong> {{Incident_ID}}</p>
<p style="margin:6px 0;"><strong>Title:</strong> {{Incident_Title}}</p>
<p style="margin:6px 0;"><strong>Reopened By:</strong> {{Reopened_By}}</p>
<p style="margin:6px 0;"><strong>Reason:</strong> {{Reopen_Reason}}</p>
</div>
<p style="margin:20px 0;font-size:16px;color:#6b7280;">Please take appropriate action at the earliest. <a href="{{Incident_URL}}" style="color:#ef4444;text-decoration:none;"><strong>Click Here</strong></a></p>
</div>
<div style="${incidentFooterStyles}">
<p style="margin:0;font-size:14px;">Regards,<br/><strong>Safe School Team</strong></p>
</div>
</div>`,
    variables: ['User_Name','Incident_ID','Incident_Title','Reopened_By','Reopen_Reason','Incident_URL'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  incident_reminder_10_days: {
    id: 'frontend-incident-reminder',
    module: 'incident',
    type: 'incident_reminder_10_days',
    subject: 'Reminder – Incident Pending for More than 10 Days [Incident ID: {{Incident_ID}}]'
      .replace('[Incident ID: {{Incident_ID}}]', '[Incident ID: {{Incident_ID}}]'),
    body: `<div style="${incidentBaseStyles}">
<div style="${incidentHeaderStyles}">
<h2 style="margin:0;color:#1f2937;font-size:24px;">Incident Reminder</h2>
</div>
<div style="${incidentContentStyles}">
<p style="margin:0 0 20px;font-size:16px;">Hello <strong>{{User_Name}}</strong>,</p>
<p style="margin:0 0 20px;font-size:16px;">This is a reminder that the following incident has been open for more than 10 days:</p>
<div style="background-color:#f9fafb;padding:16px;border-radius:6px;border-left:4px solid #ef4444;margin:20px 0;">
<h3 style="margin:0 0 12px;color:#1f2937;font-size:18px;">Details:</h3>
<p style="margin:6px 0;"><strong>Incident ID:</strong> {{Incident_ID}}</p>
<p style="margin:6px 0;"><strong>Title:</strong> {{Incident_Title}}</p>
<p style="margin:6px 0;"><strong>Reported On:</strong> {{Reported_Date}}</p>
</div>
<p style="margin:20px 0;font-size:16px;color:#6b7280;">Kindly review and resolve this incident as soon as possible. <a href="{{Incident_URL}}" style="color:#ef4444;text-decoration:none;"><strong>Click Here</strong></a></p>
</div>
<div style="${incidentFooterStyles}">
<p style="margin:0;font-size:14px;">Regards,<br/><strong>Safe School Team</strong></p>
</div>
</div>`,
    variables: ['User_Name','Incident_ID','Incident_Title','Reported_Date','Incident_URL'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
};

export function getFrontendTemplate(module: NotificationModule, type: NotificationType): NotificationTemplate | null {
  if (module === 'incident') {
    // Only return templates for incident types that we have defined
    if (type === 'incident_assigned' || type === 'incident_updated' || type === 'incident_closed' || 
        type === 'incident_reopened' || type === 'incident_reminder_10_days') {
      return incidentTemplates[type] || null;
    }
  }
  
  if (module === 'assessment') {
    // Return assessment templates from separate file
    if (type === 'assessment_assigned' || type === 'assessment_submitted' || type === 'assessment_completed' || 
        type === 'assessment_rework_required' || type === 'assessment_due_5_days' || type === 'assessment_overdue') {
      return getAssessmentTemplate(type);
    }
  }
  
  return null;
} 