

-- 6) Register user-level module
DO $$
DECLARE
  existing_count integer;
  max_order integer;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'modules'
  ) THEN
    SELECT COUNT(*) INTO existing_count
    FROM public.modules
    WHERE level = 'user' AND name = 'Child Audit';

    IF existing_count = 0 THEN
      SELECT COALESCE(MAX("order"), 0) + 1 INTO max_order
      FROM public.modules
      WHERE level = 'user';

      INSERT INTO public.modules (name, level, icon, created_at, updated_at, "order", url, active)
      VALUES (
        'Child Audit',
        'user',
        'ClipboardList',
        NOW(),
        NOW(),
        max_order,
        '/child-audit',
        true
      );
      RAISE NOTICE 'Child Audit module inserted at order %', max_order;
    ELSE
      RAISE NOTICE 'Child Audit module already exists, skipping insertion';
    END IF;
  ELSE
    RAISE NOTICE 'modules table does not exist yet, skipping Child Audit module insertion';
  END IF;
END $$;
