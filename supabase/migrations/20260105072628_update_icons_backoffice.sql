BEGIN;

-- Clients
UPDATE public.modules
SET icon = 'Users',
    updated_at = NOW()
WHERE level = 'backoffice'
  AND name = 'Clients'
  AND icon IS DISTINCT FROM 'Users';

-- EduSafe Resources
UPDATE public.modules
SET icon = 'BookOpen',
    updated_at = NOW()
WHERE level = 'backoffice'
  AND name = 'EduSafe Resources'
  AND icon IS DISTINCT FROM 'BookOpen';

-- Modules
UPDATE public.modules
SET icon = 'Box',
    updated_at = NOW()
WHERE level = 'backoffice'
  AND name = 'Modules'
  AND icon IS DISTINCT FROM 'Box';

-- Verification
UPDATE public.modules
SET icon = 'ClipboardCheck',
    updated_at = NOW()
WHERE level = 'backoffice'
  AND name = 'Verification'
  AND icon IS DISTINCT FROM 'ClipboardCheck';

-- Forms
UPDATE public.modules
SET icon = 'FileText',
    updated_at = NOW()
WHERE level = 'backoffice'
  AND name = 'Forms'
  AND icon IS DISTINCT FROM 'FileText';

-- Import Configuration
UPDATE public.modules
SET icon = 'Download',
    updated_at = NOW()
WHERE level = 'backoffice'
  AND name = 'Import Configuration'
  AND icon IS DISTINCT FROM 'Download';

COMMIT;
