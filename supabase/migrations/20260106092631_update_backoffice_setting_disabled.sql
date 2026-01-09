BEGIN;

UPDATE public.modules
SET
  active = FALSE,
  updated_at = NOW()
WHERE level = 'backoffice'
  AND name = 'Settings';

COMMIT;
