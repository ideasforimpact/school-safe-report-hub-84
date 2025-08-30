-- Insert assessment notification templates
INSERT INTO public.notification_templates (module, type, subject, body, variables) VALUES

-- 1. Assessment Assigned Template
('assessment', 'assessment_assigned', 
 'New Assessment Assigned – [Assessment ID: {{Assessment_ID}}]',
 'Hello {{User_Name}},

A new assessment has been assigned to you.

Details:

Assessment ID: {{Assessment_ID}}

Title: {{Assessment_Title}}

Assigned On: {{Assigned_Date}}

Due Date: {{Due_Date}}

Please review and complete it within the given timeline.

Regards,
Safe School Team',
 '["User_Name", "Assessment_ID", "Assessment_Title", "Assigned_Date", "Due_Date", "Assessment_URL"]'),

-- 2. Assessment Submitted Template
('assessment', 'assessment_submitted',
 'Assessment Submitted – [Assessment ID: {{Assessment_ID}}]',
 'Hello {{User_Name}},

The following assessment has been successfully submitted:

Details:

Assessment ID: {{Assessment_ID}}

Title: {{Assessment_Title}}

Submitted By: {{Submitted_By}}

Submission Date: {{Submitted_Date}}

No further action is required unless notified.

Regards,
Safe School Team',
 '["User_Name", "Assessment_ID", "Assessment_Title", "Submitted_By", "Submitted_Date", "Assessment_URL"]'),

-- 3. Assessment Completed Template
('assessment', 'assessment_completed',
 'Assessment Completed – [Assessment ID: {{Assessment_ID}}]',
 'Hello {{User_Name}},

The following assessment has been completed:

Details:

Assessment ID: {{Assessment_ID}}

Title: {{Assessment_Title}}

Completed By: {{Completed_By}}

Completion Date: {{Completed_Date}}

This task is now complete.

Regards,
Safe School Team',
 '["User_Name", "Assessment_ID", "Assessment_Title", "Completed_By", "Completed_Date", "Assessment_URL"]'),

-- 4. Assessment Rework Required Template
('assessment', 'assessment_rework_required',
 'Rework Required – [Assessment ID: {{Assessment_ID}}]',
 'Hello {{User_Name}},

Your submitted assessment requires rework.

Details:

Assessment ID: {{Assessment_ID}}

Title: {{Assessment_Title}}

Requested By: {{Requested_By}}

Reason: {{Rework_Reason}}

Please make the necessary changes and resubmit.

Regards,
Safe School Team',
 '["User_Name", "Assessment_ID", "Assessment_Title", "Requested_By", "Rework_Reason", "Assessment_URL"]'),

-- 5. Assessment Due in 5 Days Template
('assessment', 'assessment_due_5_days',
 'Reminder – 5 Days Left for Assessment Due Date [Assessment ID: {{Assessment_ID}}]',
 'Hello {{User_Name}},

This is a reminder that your assessment is due in 5 days.

Details:

Assessment ID: {{Assessment_ID}}

Title: {{Assessment_Title}}

Due Date: {{Due_Date}}

Kindly complete and submit it on time.

Regards,
Safe School Team',
 '["User_Name", "Assessment_ID", "Assessment_Title", "Due_Date", "Assessment_URL"]'),

-- 6. Assessment Overdue Template
('assessment', 'assessment_overdue',
 'Assessment Overdue by {{Overdue_Days}} Days – [Assessment ID: {{Assessment_ID}}]',
 'Hello {{User_Name}},

The following assessment is overdue by {{Overdue_Days}} days and requires immediate attention.

Details:

Assessment ID: {{Assessment_ID}}

Title: {{Assessment_Title}}

Due Date: {{Due_Date}}

Please submit it at the earliest to avoid escalation.

Regards,
Safe School Team',
 '["User_Name", "Assessment_ID", "Assessment_Title", "Due_Date", "Overdue_Days", "Assessment_URL"]');

-- Insert assessment notification rules
INSERT INTO public.notification_rules (module, type, name, description, skip_conditions) VALUES

-- 1. Assessment Assigned Rule
('assessment', 'assessment_assigned', 
 'Assessment Assigned Notification',
 'Send notification when an assessment is assigned to someone',
 '["self_action", "inactive_user", "no_email"]'),

-- 2. Assessment Submitted Rule
('assessment', 'assessment_submitted',
 'Assessment Submitted Notification',
 'Send notification when an assessment is submitted',
 '["self_action", "inactive_user", "no_email"]'),

-- 3. Assessment Completed Rule
('assessment', 'assessment_completed',
 'Assessment Completed Notification',
 'Send notification when an assessment is completed',
 '["self_action", "inactive_user", "no_email"]'),

-- 4. Assessment Rework Required Rule
('assessment', 'assessment_rework_required',
 'Assessment Rework Required Notification',
 'Send notification when assessment rework is required',
 '["self_action", "inactive_user", "no_email"]'),

-- 5. Assessment Due in 5 Days Rule
('assessment', 'assessment_due_5_days',
 'Assessment Due Reminder Notification',
 'Send reminder when assessment is due in 5 days',
 '["inactive_user", "no_email", "already_notified"]'),

-- 6. Assessment Overdue Rule
('assessment', 'assessment_overdue',
 'Assessment Overdue Notification',
 'Send notification when assessment is overdue',
 '["inactive_user", "no_email", "already_notified"]); 