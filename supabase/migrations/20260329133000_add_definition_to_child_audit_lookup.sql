-- Add optional definition column to child_audit_look_up.
-- Used for section-specific metadata (e.g., "Where?" options for physical_condition).

ALTER TABLE public.child_audit_look_up
  ADD COLUMN IF NOT EXISTS definition text NULL DEFAULT NULL;

COMMENT ON COLUMN public.child_audit_look_up.definition IS
  'Optional metadata for lookup row. Supports JSON array or comma-separated values.';

-- Seed default "Where?" options for physical_condition rows where definition is missing.
UPDATE public.child_audit_look_up
SET definition = '["Head","Face","Neck","Left Arm","Right Arm","Left Hand","Right Hand","Chest","Back","Stomach","Left Leg","Right Leg","Left Foot","Right Foot"]'
WHERE item_group = 'physical_condition'
  AND (definition IS NULL OR trim(definition) = '');
