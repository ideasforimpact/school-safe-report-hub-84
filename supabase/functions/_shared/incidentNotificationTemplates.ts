// Mirrors the incident-related entries of src/services/notification/templates.ts
// (incidentTemplates) verbatim — kept in sync manually since this runs in Deno,
// not the browser bundle. Only the 4 types reachable from create/edit/close/reopen
// incident flows are included; incident_reminder_10_days still goes through the
// existing client-side notificationService (cron-triggered, not part of this).

const incidentBaseStyles = 'max-width:640px;margin:0 auto;padding:24px;font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#1f2937;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:8px;';
const incidentHeaderStyles = 'text-align:center;background-color:#f9fafb;padding:20px;margin:-24px -24px 24px -24px;border-bottom:1px solid #e5e7eb;border-radius:8px 8px 0 0;';
const incidentContentStyles = 'text-align:left;';
const incidentFooterStyles = 'text-align:center;margin-top:32px;padding-top:20px;border-top:1px solid #e5e7eb;color:#6b7280;';

export type IncidentNotificationType = 'incident_assigned' | 'incident_updated' | 'incident_closed' | 'incident_reopened';

interface Template {
  id: string;
  subject: string;
  body: string;
}

export const incidentNotificationTemplates: Record<IncidentNotificationType, Template> = {
  incident_assigned: {
    id: 'frontend-incident-assigned',
    subject: 'New Incident Assigned – [Incident ID: {{Incident_ID}}]',
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
  },
  incident_updated: {
    id: 'frontend-incident-updated',
    subject: 'Update on Incident – [Incident ID: {{Incident_ID}}]',
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
  },
  incident_closed: {
    id: 'frontend-incident-closed',
    subject: 'Incident Closed – [Incident ID: {{Incident_ID}}]',
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
  },
  incident_reopened: {
    id: 'frontend-incident-reopened',
    subject: 'Incident Reopened – [Incident ID: {{Incident_ID}}]',
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
  },
};

export function renderIncidentTemplate(type: IncidentNotificationType, variables: Record<string, string>): { subject: string; body: string } {
  const template = incidentNotificationTemplates[type];
  let subject = template.subject;
  let body = template.body;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    subject = subject.replace(placeholder, value);
    body = body.replace(placeholder, value);
  }

  return { subject, body };
}
