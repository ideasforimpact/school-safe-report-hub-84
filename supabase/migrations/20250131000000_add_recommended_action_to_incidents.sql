-- Add recommended_action column to incidents table
-- This column will store AI-generated recommendations as JSONB
ALTER TABLE public.incidents 
ADD COLUMN IF NOT EXISTS recommended_action JSONB NULL;

-- Add comment to describe the column structure
COMMENT ON COLUMN public.incidents.recommended_action IS 'AI-generated recommendations including summary, severity, immediate_actions, corrective_actions, preventive_actions, and policy_refs';

