
-- Insert notification rule for grievance submitted (no skip conditions - empty array)
INSERT INTO public.notification_rules (module, type, name, description, skip_conditions) 
VALUES 
('grievance', 'grievance_submitted', 
 'Grievance Submitted Notification',
 'Send notification when a grievance is submitted to all super admins and grievance admins',
 '[]'); 