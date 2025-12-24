-- Insert Visitor module
-- This migration inserts the Visitor module, checking if a module with the same name already exists

DO $$
DECLARE
  existing_count integer;
BEGIN
  -- Check if modules table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'modules'
  ) THEN
    
    -- Check if a module with name 'Visitor' already exists
    SELECT COUNT(*) INTO existing_count 
    FROM public.modules 
    WHERE name = 'Visitor';
    
    -- Only insert if the module doesn't exist
    IF existing_count = 0 THEN
      INSERT INTO public.modules (name, level, icon, created_at, updated_at, "order", active)
      VALUES ('Visitor', 'user', 'DoorOpen', now(), now(), 12, true);
      
      RAISE NOTICE 'Visitor module inserted successfully';
    ELSE
      RAISE NOTICE 'Visitor module already exists, skipping insertion';
    END IF;
    
  ELSE
    RAISE NOTICE 'modules table does not exist yet, skipping Visitor module insertion';
  END IF;
END $$;

