BEGIN;

UPDATE public.modules
SET
  icon = 'MessageSquareWarning',
  updated_at = NOW()
WHERE
  level = 'user'
  AND name = 'Grievances'
  AND icon IS DISTINCT FROM 'MessageSquareWarning';

COMMIT;
