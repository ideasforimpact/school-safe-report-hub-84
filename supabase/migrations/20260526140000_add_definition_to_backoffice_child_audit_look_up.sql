-- Mirror the `definition` column that exists on public.child_audit_look_up
-- (added in 20260329133000_add_definition_to_child_audit_lookup.sql, then populated
-- by 20260329183000_set_meltdown_definition_options.sql and the per-check-type fix
-- migrations) onto the backoffice template table.
--
-- Why this matters: when sync-child-audit-template copies rows into a per-client
-- table, any column missing from the backoffice template ends up NULL on the
-- per-client side. The user-facing ChildAuditPage reads `definition` to decide
-- which chips to render under "Meltdown occurred" and under each Physical
-- Condition row. Without this column the synced client falls back to body parts
-- everywhere, which is why "Meltdown occurred" was showing Head/Face/Neck/... chips.
--
-- Values mirror the source-of-truth migrations:
--   physical_condition (any type)           → body parts JSON array
--   meltdown (in_school AND in_hostel)      → duration JSON array

ALTER TABLE public.backoffice_child_audit_look_up
  ADD COLUMN IF NOT EXISTS definition text NULL DEFAULT NULL;

COMMENT ON COLUMN public.backoffice_child_audit_look_up.definition IS
  'Optional metadata for lookup row. Supports JSON array or comma-separated values.';

-- Backfill physical_condition "Where?" body parts (covers morning_entry,
-- evening_exit, hostel_entry, hostel_exit — every type that has a
-- physical_condition group).
UPDATE public.backoffice_child_audit_look_up
SET definition = '["Head","Face","Neck","Left Arm","Right Arm","Left Hand","Right Hand","Chest","Back","Stomach","Left Leg","Right Leg","Left Foot","Right Foot"]',
    updated_at = now()
WHERE item_group = 'physical_condition'
  AND (definition IS NULL OR trim(definition) = '');

-- Backfill Meltdown duration chips. Source: 20260329183000_set_meltdown_definition_options.sql
UPDATE public.backoffice_child_audit_look_up
SET definition = '["< 5 minutes","5-15 minutes","15-30 minutes","> 30 minutes"]',
    updated_at = now()
WHERE item_group = 'meltdown'
  AND label = 'Meltdown occurred'
  AND type IN ('in_school', 'in_hostel');
