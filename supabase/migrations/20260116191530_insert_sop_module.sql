-- Insert SOP (Standard Operating Procedures) module for user level
-- This migration adds the SOP module with the last order for user level modules

DO $$
DECLARE
  existing_count integer;
  max_order integer;
  new_order integer;
BEGIN
  -- Check if modules table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'modules'
  ) THEN
    
    -- Check if SOP module already exists
    SELECT COUNT(*) INTO existing_count 
    FROM public.modules 
    WHERE level = 'user' AND name = 'SOP';
    
    IF existing_count = 0 THEN
      -- Get the maximum order for user level modules
      SELECT COALESCE(MAX("order"), 0) INTO max_order
      FROM public.modules
      WHERE level = 'user' AND "order" IS NOT NULL;
      
      -- Set new order to max_order + 1
      new_order := max_order + 1;
      
      -- Insert the SOP module
      INSERT INTO public.modules (name, level, icon, created_at, updated_at, "order", url, active)
      VALUES (
        'SOP', 
        'user', 
        'BookOpen', 
        NOW(), 
        NOW(), 
        new_order, 
        '/sops', 
        true
      );
      
      RAISE NOTICE 'SOP module inserted with order %', new_order;
    ELSE
      RAISE NOTICE 'SOP module already exists, skipping insertion';
    END IF;
  ELSE
    RAISE NOTICE 'modules table does not exist yet, skipping SOP module insertion';
  END IF;
END $$;



