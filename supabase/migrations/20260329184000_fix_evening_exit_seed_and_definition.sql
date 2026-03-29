-- Fix Evening Exit: ensure expected groups and lookup values exist and are active

WITH evening_exit_definition AS (
  SELECT jsonb_build_array(
    jsonb_build_object(
      'type', 'evening_exit',
      'table', 'child_audit_look_up',
      'condition', 'item_group = ''physical_condition'' AND type = ''evening_exit'' AND active = true',
      'item_group', 'Physical Condition'
    )
  ) AS alt_definition
)
UPDATE public.child_audit_check_type ct
SET
  alt_definition = d.alt_definition,
  active = true,
  updated_at = now()
FROM evening_exit_definition d
WHERE ct.key = 'evening_exit';

WITH evening_exit_lookup_seed(type, item_group, label) AS (
  VALUES
    ('evening_exit', 'physical_condition', 'Scratch'),
    ('evening_exit', 'physical_condition', 'Bruise'),
    ('evening_exit', 'physical_condition', 'Swelling'),
    ('evening_exit', 'physical_condition', 'Bite mark'),
    ('evening_exit', 'physical_condition', 'Redness'),
    ('evening_exit', 'physical_condition', 'Cut'),
    ('evening_exit', 'physical_condition', 'Bandage present'),
    ('evening_exit', 'physical_condition', 'Burn'),
    ('evening_exit', 'physical_condition', 'Rash')
)
INSERT INTO public.child_audit_look_up (client_id, type, item_group, label, active)
SELECT c.id, s.type, s.item_group, s.label, true
FROM public.clients c
CROSS JOIN evening_exit_lookup_seed s
ON CONFLICT (client_id, type, item_group, label) DO UPDATE
SET
  active = EXCLUDED.active,
  updated_at = now();
