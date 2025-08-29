-- Create notification system tables

-- 1. Notification Templates Table
CREATE TABLE public.notification_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module TEXT NOT NULL,
  type TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Notification Rules Table
CREATE TABLE public.notification_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module TEXT NOT NULL,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  skip_conditions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Notification Logs Table
CREATE TABLE public.notification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module TEXT NOT NULL,
  type TEXT NOT NULL,
  recipient_id UUID NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better performance
CREATE INDEX idx_notification_templates_module_type ON public.notification_templates(module, type);
CREATE INDEX idx_notification_templates_active ON public.notification_templates(is_active);
CREATE INDEX idx_notification_rules_module_type ON public.notification_rules(module, type);
CREATE INDEX idx_notification_rules_active ON public.notification_rules(is_active);
CREATE INDEX idx_notification_logs_recipient ON public.notification_logs(recipient_id);
CREATE INDEX idx_notification_logs_status ON public.notification_logs(status);
CREATE INDEX idx_notification_logs_created_at ON public.notification_logs(created_at DESC);
CREATE INDEX idx_notification_logs_module_type ON public.notification_logs(module, type);

-- Add foreign key constraints
ALTER TABLE public.notification_logs 
ADD CONSTRAINT fk_notification_logs_recipient 
FOREIGN KEY (recipient_id) REFERENCES public.employees(id) ON DELETE CASCADE;

-- Insert default notification templates for incident module
INSERT INTO public.notification_templates (module, type, subject, body, variables) VALUES
-- Incident Assigned Template
('incident', 'incident_assigned', 
 'New Incident Assigned – [Incident ID: {{Incident_ID}}]',
 'Hello {{User_Name}},

A new incident has been created and assigned to you for follow-up.

Details:

Incident ID: {{Incident_ID}}

Title: {{Incident_Title}}

Reported On: {{Reported_Date}}

Please review and take necessary action.

Regards,
Safe School Team',
 '["User_Name", "Incident_ID", "Incident_Title", "Reported_Date"]'),

-- Incident Updated Template
('incident', 'incident_updated',
 'Update on Incident – [Incident ID: {{Incident_ID}}]',
 'Hello {{User_Name}},

The following incident has been updated:

Details:

Incident ID: {{Incident_ID}}

Title: {{Incident_Title}}

Updated By: {{Updated_By}}

Update Summary: {{Update_Notes}}

Kindly review the changes and take necessary steps.

Regards,
Safe School Team',
 '["User_Name", "Incident_ID", "Incident_Title", "Updated_By", "Update_Notes"]'),

-- Incident Closed Template
('incident', 'incident_closed',
 'Incident Closed – [Incident ID: {{Incident_ID}}]',
 'Hello {{User_Name}},

The following incident has been successfully closed:

Details:

Incident ID: {{Incident_ID}}

Title: {{Incident_Title}}

Closed By: {{Closed_By}}

Closure Date: {{Closed_Date}}

No further action is required.

Regards,
Safe School Team',
 '["User_Name", "Incident_ID", "Incident_Title", "Closed_By", "Closed_Date"]'),

-- Incident Reopened Template
('incident', 'incident_reopened',
 'Incident Reopened – [Incident ID: {{Incident_ID}}]',
 'Hello {{User_Name}},

The following incident has been reopened and requires your attention:

Details:

Incident ID: {{Incident_ID}}

Title: {{Incident_Title}}

Reopened By: {{Reopened_By}}

Reason: {{Reopen_Reason}}

Please take appropriate action at the earliest.

Regards,
Safe School Team',
 '["User_Name", "Incident_ID", "Incident_Title", "Reopened_By", "Reopen_Reason"]'),

-- Incident Reminder Template
('incident', 'incident_reminder_10_days',
 'Reminder – Incident Pending for More than 10 Days [Incident ID: {{Incident_ID}}]',
 'Hello {{User_Name}},

This is a reminder that the following incident has been open for more than 10 days:

Details:

Incident ID: {{Incident_ID}}

Title: {{Incident_Title}}

Reported On: {{Reported_Date}}

Kindly review and resolve this incident as soon as possible.

Regards,
Safe School Team',
 '["User_Name", "Incident_ID", "Incident_Title", "Reported_Date"]');

-- Insert default notification rules for incident module
INSERT INTO public.notification_rules (module, type, name, description, skip_conditions) VALUES
-- Incident Assigned Rule
('incident', 'incident_assigned', 
 'Incident Assigned Notification',
 'Send notification when an incident is assigned to someone',
 '["self_action", "inactive_user", "no_email"]'),

-- Incident Updated Rule
('incident', 'incident_updated',
 'Incident Updated Notification',
 'Send notification when an incident is updated',
 '["self_action", "inactive_user", "no_email"]'),

-- Incident Closed Rule
('incident', 'incident_closed',
 'Incident Closed Notification',
 'Send notification when an incident is closed',
 '["self_action", "inactive_user", "no_email"]'),

-- Incident Reopened Rule
('incident', 'incident_reopened',
 'Incident Reopened Notification',
 'Send notification when an incident is reopened',
 '["self_action", "inactive_user", "no_email"]'),

-- Incident Reminder Rule
('incident', 'incident_reminder_10_days',
 'Incident Reminder Notification',
 'Send reminder for incidents open for more than 10 days',
 '["inactive_user", "no_email", "already_notified"]');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_notification_templates_updated_at
  BEFORE UPDATE ON public.notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_rules_updated_at
  BEFORE UPDATE ON public.notification_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on notification tables
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notification_templates (read-only for authenticated users)
CREATE POLICY "Allow authenticated users to read notification templates"
ON public.notification_templates
FOR SELECT
USING (auth.role() = 'authenticated');

-- Create RLS policies for notification_rules (read-only for authenticated users)
CREATE POLICY "Allow authenticated users to read notification rules"
ON public.notification_rules
FOR SELECT
USING (auth.role() = 'authenticated');

-- Create RLS policies for notification_logs
CREATE POLICY "Allow users to read their own notification logs"
ON public.notification_logs
FOR SELECT
USING (auth.uid() = recipient_id);

CREATE POLICY "Allow service role to insert notification logs"
ON public.notification_logs
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Grant necessary permissions
GRANT SELECT ON public.notification_templates TO authenticated;
GRANT SELECT ON public.notification_rules TO authenticated;
GRANT SELECT, INSERT ON public.notification_logs TO authenticated;
GRANT ALL ON public.notification_templates TO service_role;
GRANT ALL ON public.notification_rules TO service_role;
GRANT ALL ON public.notification_logs TO service_role; 