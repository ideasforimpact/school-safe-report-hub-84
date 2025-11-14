-- Enable realtime for employee_modules table to support real-time module synchronization
-- This allows the application to listen for changes when Super Admins modify employee permissions
-- This migration is conditional to avoid errors if the table doesn't exist yet

DO $$
BEGIN
  -- Check if the employee_modules table exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'employee_modules'
  ) THEN
    -- Set replica identity to FULL to capture complete row data during updates
    BEGIN
      ALTER TABLE public.employee_modules REPLICA IDENTITY FULL;
    EXCEPTION
      WHEN OTHERS THEN
        -- Ignore if already set or other error
        NULL;
    END;

    -- Add the table to the supabase_realtime publication to activate real-time functionality
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.employee_modules;
    EXCEPTION
      WHEN OTHERS THEN
        -- Ignore if already added or publication doesn't exist
        NULL;
    END;
  END IF;
END $$;