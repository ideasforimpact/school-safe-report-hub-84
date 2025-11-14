-- Rename EduSafe category 'procedures' to 'policy' in backoffice_edusafe_resource
-- Generated on 2025-10-08
-- This migration is conditional to avoid errors if the table doesn't exist yet

DO $$
BEGIN
  -- Check if the backoffice_edusafe_resource table exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'backoffice_edusafe_resource'
  ) THEN
    UPDATE backoffice_edusafe_resource
    SET category = 'policy'
    WHERE category = 'procedures';
  END IF;
END $$;


