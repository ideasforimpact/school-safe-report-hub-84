import { NotificationTemplate, NotificationType } from '@/types/notification';

export const grievanceTemplates: Partial<Record<NotificationType, Partial<NotificationTemplate>>> = {
  grievance_submitted: {
    subject: 'Grievance Submitted – [{{Grievance_Title}}]',
    body: `
      <div style="max-width:640px;margin:0 auto;padding:24px;font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#1f2937;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:8px;">
        <div style="text-align:center;background-color:#f9fafb;padding:20px;margin:-24px -24px 24px -24px;border-bottom:1px solid #e5e7eb;border-radius:8px 8px 0 0;">
          <h2 style="margin:0;color:#1f2937;font-size:24px;">📝 Grievance Submitted</h2>
        </div>
        <div style="text-align:left;">
          <p style="margin:0 0 20px;font-size:16px;">Hello <strong>{{User_Name}}</strong>,</p>
          <p style="margin:0 0 20px;font-size:16px;">Your grievance has been successfully submitted. Our team will review it and take the necessary action.</p>
          <div style="background-color:#f3f4f6;padding:16px;border-radius:6px;border-left:4px solid #6b7280;margin:20px 0;">
            <h3 style="margin:0 0 12px;color:#1f2937;font-size:18px;">Details:</h3>
            <p style="margin:6px 0;"><strong>Title:</strong> {{Grievance_Title}}</p>
            <p style="margin:6px 0;"><strong>Description:</strong> {{Grievance_Description}}</p>
            <p style="margin:6px 0;"><strong>Submitted On:</strong> {{Submitted_Date}}</p>
          </div>
          <p style="margin:20px 0;font-size:16px;color:#6b7280;">You will be notified of any updates regarding this grievance.</p>
        </div>
        <div style="text-align:center;margin-top:32px;padding-top:20px;border-top:1px solid #e5e7eb;color:#6b7280;">
          <p style="margin:0;font-size:14px;">Regards,<br/><strong>Safe School Team</strong></p>
        </div>
      </div>
    `,
    variables: [
      'User_Name',
      'Grievance_ID', 
      'Grievance_Title',
      'Grievance_Description',
      'Submitted_Date'
    ]
  }
};

export const getGrievanceTemplate = (type: NotificationType): Partial<NotificationTemplate> | null => {
  return grievanceTemplates[type] || null;
}; 