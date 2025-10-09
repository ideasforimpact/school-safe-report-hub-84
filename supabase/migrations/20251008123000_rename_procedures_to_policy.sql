-- Rename EduSafe category 'procedures' to 'policy' in backoffice_edusafe_resource
-- Generated on 2025-10-08

BEGIN;

UPDATE backoffice_edusafe_resource
SET category = 'policy'
WHERE category = 'procedures';

COMMIT;

