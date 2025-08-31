

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
 '["inactive_user", "no_email", "already_notified"]'); 