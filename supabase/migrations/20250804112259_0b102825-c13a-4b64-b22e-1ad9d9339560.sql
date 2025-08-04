-- Enable realtime for employee_modules table to support real-time module synchronization
-- This allows the application to listen for changes when Super Admins modify employee permissions

-- Set replica identity to FULL to capture complete row data during updates
ALTER TABLE public.employee_modules REPLICA IDENTITY FULL;

-- Add the table to the supabase_realtime publication to activate real-time functionality
ALTER PUBLICATION supabase_realtime ADD TABLE public.employee_modules;