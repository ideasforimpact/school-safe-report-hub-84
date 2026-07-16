// Server-side mirror of src/services/notification/assessmentTemplates.ts.
// Edge functions that queue assessment emails directly (create-assessment,
// save-assessment-draft, reassign-assessment) must render subject/body here
// before inserting into email_queue — send-notification-email requires a
// non-empty body and does no template rendering of its own.
// Keep content in sync with the frontend copy; both must stay identical.

export type AssessmentNotificationType =
  | 'assessment_assigned'
  | 'assessment_reassigned'
  | 'assessment_submitted'
  | 'assessment_completed'
  | 'assessment_rework_required';

interface Template {
  subject: string;
  body: string;
}

const baseStyles = 'max-width:640px;margin:0 auto;padding:24px;font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#1f2937;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:8px;';
const headerStyles = 'text-align:center;background-color:#f9fafb;padding:20px;margin:-24px -24px 24px -24px;border-bottom:1px solid #e5e7eb;border-radius:8px 8px 0 0;';
const contentStyles = 'text-align:left;';
const footerStyles = 'text-align:center;margin-top:32px;padding-top:20px;border-top:1px solid #e5e7eb;color:#6b7280;';

const templates: Record<AssessmentNotificationType, Template> = {
  assessment_assigned: {
    subject: 'New Assessment Assigned – [{{Assessment_Title}}]',
    body: `<div style="${baseStyles}">
<div style="${headerStyles}">
<h2 style="margin:0;color:#1f2937;font-size:24px;">🎯 New Assessment Assigned</h2>
</div>
<div style="${contentStyles}">
<p style="margin:0 0 20px;font-size:16px;">Hello <strong>{{User_Name}}</strong>,</p>
<p style="margin:0 0 20px;font-size:16px;">A new assessment has been assigned to you.</p>
<div style="background-color:#dbeafe;padding:16px;border-radius:6px;border-left:4px solid #3b82f6;margin:20px 0;">
<h3 style="margin:0 0 12px;color:#1f2937;font-size:18px;">Assessment Details:</h3>
<p style="margin:6px 0;"><strong>Assessment Name:</strong> {{Assessment_Title}}</p>
<p style="margin:6px 0;"><strong>Assigned On:</strong> {{Assigned_Date}}</p>
<p style="margin:6px 0;"><strong>Due Date:</strong> {{Due_Date}}</p>
</div>
<p style="margin:20px 0;font-size:16px;color:#6b7280;">Please review and complete it within the given timeline. <a href="{{Assessment_URL}}?assessmentId={{Assessment_ID}}" style="color:#3b82f6;text-decoration:none;"><strong>Click Here</strong></a></p>
</div>
<div style="${footerStyles}">
<p style="margin:0;font-size:14px;">Regards,<br/><strong>Safe School Team</strong></p>
</div>
</div>`,
  },

  assessment_reassigned: {
    subject: 'Assessment Reassigned to You – [{{Assessment_Title}}]',
    body: `<div style="${baseStyles}">
<div style="${headerStyles}">
<h2 style="margin:0;color:#1f2937;font-size:24px;">🔄 Assessment Reassigned</h2>
</div>
<div style="${contentStyles}">
<p style="margin:0 0 20px;font-size:16px;">Hello <strong>{{User_Name}}</strong>,</p>
<p style="margin:0 0 20px;font-size:16px;">This assessment has been reassigned to you.</p>
<div style="background-color:#dbeafe;padding:16px;border-radius:6px;border-left:4px solid #3b82f6;margin:20px 0;">
<h3 style="margin:0 0 12px;color:#1f2937;font-size:18px;">Assessment Details:</h3>
<p style="margin:6px 0;"><strong>Assessment Name:</strong> {{Assessment_Title}}</p>
<p style="margin:6px 0;"><strong>Reassigned On:</strong> {{Reassigned_Date}}</p>
<p style="margin:6px 0;"><strong>Due Date:</strong> {{Due_Date}}</p>
</div>
<p style="margin:20px 0;font-size:16px;color:#6b7280;">Please review and complete it within the given timeline. <a href="{{Assessment_URL}}?assessmentId={{Assessment_ID}}" style="color:#3b82f6;text-decoration:none;"><strong>Click Here</strong></a></p>
</div>
<div style="${footerStyles}">
<p style="margin:0;font-size:14px;">Regards,<br/><strong>Safe School Team</strong></p>
</div>
</div>`,
  },

  assessment_submitted: {
    subject: 'Assessment Submitted – [{{Assessment_Title}}]',
    body: `<div style="${baseStyles}">
<div style="${headerStyles}">
<h2 style="margin:0;color:#1f2937;font-size:24px;">📝 Assessment Submitted</h2>
</div>
<div style="${contentStyles}">
<p style="margin:0 0 20px;font-size:16px;">Hello <strong>{{User_Name}}</strong>,</p>
<p style="margin:0 0 20px;font-size:16px;">The following assessment has been successfully submitted:</p>
<div style="background-color:#ecfccb;padding:16px;border-radius:6px;border-left:4px solid #65a30d;margin:20px 0;">
<h3 style="margin:0 0 12px;color:#1f2937;font-size:18px;">Submission Details:</h3>
<p style="margin:6px 0;"><strong>Assessment Name:</strong> {{Assessment_Title}}</p>
<p style="margin:6px 0;"><strong>Submitted By:</strong> {{Submitted_By}}</p>
<p style="margin:6px 0;"><strong>Submission Date:</strong> {{Submitted_Date}}</p>
</div>
<p style="margin:20px 0;font-size:16px;color:#6b7280;">No further action is required unless notified. <a href="{{Assessment_URL}}" style="color:#3b82f6;text-decoration:none;"><strong>Click Here</strong></a></p>
</div>
<div style="${footerStyles}">
<p style="margin:0;font-size:14px;">Regards,<br/><strong>Safe School Team</strong></p>
</div>
</div>`,
  },

  assessment_completed: {
    subject: 'Assessment Completed – [{{Assessment_Title}}]',
    body: `<div style="${baseStyles}">
<div style="${headerStyles}">
<h2 style="margin:0;color:#1f2937;font-size:24px;">✅ Assessment Completed</h2>
</div>
<div style="${contentStyles}">
<p style="margin:0 0 20px;font-size:16px;">Hello <strong>{{User_Name}}</strong>,</p>
<p style="margin:0 0 20px;font-size:16px;">The following assessment has been completed:</p>
<div style="background-color:#dcfce7;padding:16px;border-radius:6px;border-left:4px solid #16a34a;margin:20px 0;">
<h3 style="margin:0 0 12px;color:#1f2937;font-size:18px;">Completion Details:</h3>
<p style="margin:6px 0;"><strong>Assessment Name:</strong> {{Assessment_Title}}</p>
<p style="margin:6px 0;"><strong>Completed By:</strong> {{Completed_By}}</p>
<p style="margin:6px 0;"><strong>Completion Date:</strong> {{Completed_Date}}</p>
</div>
<p style="margin:20px 0;font-size:16px;color:#6b7280;">This task is now complete. <a href="{{Assessment_URL}}" style="color:#3b82f6;text-decoration:none;"><strong>Click Here</strong></a></p>
</div>
<div style="${footerStyles}">
<p style="margin:0;font-size:14px;">Regards,<br/><strong>Safe School Team</strong></p>
</div>
</div>`,
  },

  assessment_rework_required: {
    subject: 'Rework Required – [{{Assessment_Title}}]',
    body: `<div style="${baseStyles}">
<div style="${headerStyles}">
<h2 style="margin:0;color:#1f2937;font-size:24px;">🔄 Rework Required</h2>
</div>
<div style="${contentStyles}">
<p style="margin:0 0 20px;font-size:16px;">Hello <strong>{{User_Name}}</strong>,</p>
<p style="margin:0 0 20px;font-size:16px;">Your submitted assessment requires rework.</p>
<div style="background-color:#fef3c7;padding:16px;border-radius:6px;border-left:4px solid #f59e0b;margin:20px 0;">
<h3 style="margin:0 0 12px;color:#1f2937;font-size:18px;">Rework Details:</h3>
<p style="margin:6px 0;"><strong>Assessment Name:</strong> {{Assessment_Title}}</p>
<p style="margin:6px 0;"><strong>Requested By:</strong> {{Requested_By}}</p>
<p style="margin:6px 0;"><strong>Reason:</strong> {{Rework_Reason}}</p>
</div>
<p style="margin:20px 0;font-size:16px;color:#6b7280;">Please make the necessary changes and resubmit. <a href="{{Assessment_URL}}" style="color:#3b82f6;text-decoration:none;"><strong>Click Here</strong></a></p>
</div>
<div style="${footerStyles}">
<p style="margin:0;font-size:14px;">Regards,<br/><strong>Safe School Team</strong></p>
</div>
</div>`,
  },
};

export function renderAssessmentTemplate(
  type: AssessmentNotificationType,
  variables: Record<string, string>,
): { subject: string; body: string } {
  const template = templates[type];
  let subject = template.subject;
  let body = template.body;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    subject = subject.replace(placeholder, String(value));
    body = body.replace(placeholder, String(value));
  }

  return { subject, body };
}
