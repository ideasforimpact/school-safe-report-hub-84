-- Register the Child Audit backoffice module so it appears in the SaaS-admin sidebar.
-- Order 8 places it after the current last backoffice item (Verification = 7).
DO $$
DECLARE
  existing_count integer;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'modules'
  ) THEN
    SELECT COUNT(*) INTO existing_count
    FROM public.modules
    WHERE level = 'backoffice' AND name = 'Child Audit';

    IF existing_count = 0 THEN
      INSERT INTO public.modules (name, level, icon, created_at, updated_at, "order", url, active)
      VALUES (
        'Child Audit',
        'backoffice',
        'ClipboardList',
        now(),
        now(),
        8,
        '/backoffice/child-audit',
        true
      );
    END IF;
  END IF;
END $$;
