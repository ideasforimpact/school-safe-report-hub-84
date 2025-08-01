-- Enable real-time for employee_modules table
ALTER TABLE public.employee_modules REPLICA IDENTITY FULL;

-- Add employee_modules table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.employee_modules;