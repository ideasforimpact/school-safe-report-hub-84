-- Insert Integration module for backoffice
-- This migration adds the Integration module with the last order for backoffice modules

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
    
    -- Check if Integration module already exists
    SELECT COUNT(*) INTO existing_count 
    FROM public.modules 
    WHERE level = 'backoffice' AND name = 'Integration';
    
    IF existing_count = 0 THEN
      -- Get the maximum order for backoffice modules
      SELECT COALESCE(MAX("order"), 0) INTO max_order
      FROM public.modules
      WHERE level = 'backoffice' AND "order" IS NOT NULL;
      
      -- Set new order to max_order + 1
      new_order := max_order + 1;
      
      -- Insert the Integration module
      INSERT INTO public.modules (name, level, icon, created_at, updated_at, "order", url, active)
      VALUES (
        'Integration', 
        'backoffice', 
        'Plug', 
        NOW(), 
        NOW(), 
        new_order, 
        '/backoffice/integration', 
        true
      );
      
      RAISE NOTICE 'Integration module inserted with order %', new_order;
    ELSE
      RAISE NOTICE 'Integration module already exists, skipping insertion';
    END IF;
  END IF;
END $$;

