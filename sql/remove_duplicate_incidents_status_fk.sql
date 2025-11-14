-- Remove duplicate foreign key constraint for incidents.status_id
-- Production only has 'fk_incident_status', not 'incidents_status_id_fkey'
-- This script removes the duplicate to fix PostgREST relationship conflicts

DO $$
BEGIN
  -- Check if the duplicate FK exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'incidents_status_id_fkey'
    AND conrelid = 'public.incidents'::regclass
  ) THEN
    -- Drop the duplicate FK constraint
    ALTER TABLE public.incidents
      DROP CONSTRAINT incidents_status_id_fkey;
    
    RAISE NOTICE 'Removed duplicate FK constraint: incidents_status_id_fkey';
  ELSE
    RAISE NOTICE 'Duplicate FK constraint incidents_status_id_fkey does not exist';
  END IF;

  -- Verify that the correct FK exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_incident_status'
    AND conrelid = 'public.incidents'::regclass
  ) THEN
    RAISE NOTICE 'Correct FK constraint fk_incident_status exists';
  ELSE
    RAISE WARNING 'Correct FK constraint fk_incident_status does not exist!';
  END IF;
END $$;

