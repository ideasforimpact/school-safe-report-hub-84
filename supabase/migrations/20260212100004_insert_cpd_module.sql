-- Insert CPD (Continuing Professional Development) module for user level
-- This migration adds the CPD module with order immediately after the
-- existing Student Well-Being Management module.

DO $$
DECLARE
  existing_count integer;
  swbm_order integer;
  new_order integer;
BEGIN
  -- Check if modules table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'modules'
  ) THEN
    
    -- Check if CPD module already exists
    SELECT COUNT(*) INTO existing_count 
    FROM public.modules 
    WHERE level = 'user' AND name = 'CPD';
    
    IF existing_count = 0 THEN
      -- Get the order of the Student Well-Being Management module (user level)
      SELECT "order" INTO swbm_order
      FROM public.modules
      WHERE level = 'user' AND name = 'Student Well-Being Management'
      LIMIT 1;
      
      -- If Student Well-Being Management exists, place new module right after it;
      -- otherwise use max order + 1
      IF swbm_order IS NOT NULL THEN
        new_order := swbm_order + 1;
        -- Shift orders of user modules that are at or after new_order
        UPDATE public.modules
        SET "order" = "order" + 1
        WHERE level = 'user' AND "order" >= new_order;
      ELSE
        -- Student Well-Being Management not found, use next available order
        SELECT COALESCE(MAX("order"), 0) + 1 INTO new_order
        FROM public.modules
        WHERE level = 'user' AND "order" IS NOT NULL;
      END IF;
      
      -- Insert the CPD module
      INSERT INTO public.modules (name, level, icon, created_at, updated_at, "order", url, active)
      VALUES (
        'CPD', 
        'user', 
        'BookOpen', -- Unique icon for Continuing Professional Development
        NOW(), 
        NOW(), 
        new_order, 
        '/cpd_overview', 
        true
      );
      
      RAISE NOTICE 'CPD module inserted with order %', new_order;
    ELSE
      RAISE NOTICE 'CPD module already exists, skipping insertion';
    END IF;
  ELSE
    RAISE NOTICE 'modules table does not exist yet, skipping CPD module insertion';
  END IF;
END $$;

