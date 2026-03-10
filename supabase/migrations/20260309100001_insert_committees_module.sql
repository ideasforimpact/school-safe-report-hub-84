-- Insert Committees module for client users
DO $$
DECLARE
  existing_count integer;
  max_order integer;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'modules'
  ) THEN
    SELECT COUNT(*) INTO existing_count
    FROM public.modules
    WHERE level = 'user'
      AND name = 'Committees';

    IF existing_count = 0 THEN
      SELECT COALESCE(MAX("order"), 0) + 1
      INTO max_order
      FROM public.modules
      WHERE level = 'user';

      INSERT INTO public.modules (name, level, icon, created_at, updated_at, "order", url, active)
      VALUES (
        'Committees',
        'user',
        'Users',
        NOW(),
        NOW(),
        max_order,
        '/committees',
        true
      );

      RAISE NOTICE 'Committees module inserted at order %', max_order;
    ELSE
      RAISE NOTICE 'Committees module already exists, skipping insertion';
    END IF;
  ELSE
    RAISE NOTICE 'modules table does not exist yet, skipping Committees module insertion';
  END IF;
END $$;
