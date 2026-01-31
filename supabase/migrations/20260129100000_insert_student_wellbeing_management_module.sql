-- Insert Student Well-Being Management module for user level
-- This migration adds the Student Well-Being Management module with order immediately after the SOP module

DO $$
DECLARE
  existing_count integer;
  sop_order integer;
  new_order integer;
BEGIN
  -- Check if modules table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'modules'
  ) THEN
    
    -- Check if Student Well-Being Management module already exists
    SELECT COUNT(*) INTO existing_count 
    FROM public.modules 
    WHERE level = 'user' AND name = 'Student Well-Being Management';
    
    IF existing_count = 0 THEN
      -- Get the order of the SOP module (user level)
      SELECT "order" INTO sop_order
      FROM public.modules
      WHERE level = 'user' AND name = 'SOP'
      LIMIT 1;
      
      -- If SOP exists, place new module right after it; otherwise use max order + 1
      IF sop_order IS NOT NULL THEN
        new_order := sop_order + 1;
        -- Shift orders of user modules that are at or after new_order
        UPDATE public.modules
        SET "order" = "order" + 1
        WHERE level = 'user' AND "order" >= new_order;
      ELSE
        -- SOP not found, use next available order
        SELECT COALESCE(MAX("order"), 0) + 1 INTO new_order
        FROM public.modules
        WHERE level = 'user' AND "order" IS NOT NULL;
      END IF;
      
      -- Insert the Student Well-Being Management module
      INSERT INTO public.modules (name, level, icon, created_at, updated_at, "order", url, active)
      VALUES (
        'Student Well-Being Management', 
        'user', 
        'Heart', 
        NOW(), 
        NOW(), 
        new_order, 
        '/student-well-begin-management', 
        true
      );
      
      RAISE NOTICE 'Student Well-Being Management module inserted with order %', new_order;
    ELSE
      RAISE NOTICE 'Student Well-Being Management module already exists, skipping insertion';
    END IF;
  ELSE
    RAISE NOTICE 'modules table does not exist yet, skipping Student Well-Being Management module insertion';
  END IF;
END $$;
