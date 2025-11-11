-- Add recommended_action column to incidents table
-- This column will store AI-generated recommendations as JSONB
-- This migration is conditional to avoid errors if the table doesn't exist yet

DO $$
BEGIN
  -- Check if the incidents table exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'incidents'
  ) THEN
    -- Add column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'incidents' 
      AND column_name = 'recommended_action'
    ) THEN
ALTER TABLE public.incidents 
      ADD COLUMN recommended_action JSONB NULL;

-- Add comment to describe the column structure
COMMENT ON COLUMN public.incidents.recommended_action IS 'AI-generated recommendations including summary, severity, immediate_actions, corrective_actions, preventive_actions, and policy_refs';
    END IF;
  END IF;
END $$;

