-- Fix Hostel Exit: ensure expected groups and lookup values exist and are active

WITH hostel_exit_definition AS (
  SELECT jsonb_build_array(
    jsonb_build_object(
      'type', 'hostel_exit',
      'table', 'child_audit_look_up',
      'condition', 'item_group = ''physical_condition'' AND type = ''hostel_exit'' AND active = true',
      'item_group', 'Physical Condition'
    )
  ) AS alt_definition
)
UPDATE public.child_audit_check_type ct
SET
  alt_definition = d.alt_definition,
  active = true,
  updated_at = now()
FROM hostel_exit_definition d
WHERE ct.key = 'hostel_exit';

WITH hostel_exit_lookup_seed(type, item_group, label) AS (
  VALUES
    ('hostel_exit', 'physical_condition', 'Scratch'),
    ('hostel_exit', 'physical_condition', 'Bruise'),
    ('hostel_exit', 'physical_condition', 'Swelling'),
    ('hostel_exit', 'physical_condition', 'Bite mark'),
    ('hostel_exit', 'physical_condition', 'Redness'),
    ('hostel_exit', 'physical_condition', 'Cut'),
    ('hostel_exit', 'physical_condition', 'Bandage present'),
    ('hostel_exit', 'physical_condition', 'Burn'),
    ('hostel_exit', 'physical_condition', 'Rash')
)
INSERT INTO public.child_audit_look_up (client_id, type, item_group, label, active)
SELECT c.id, s.type, s.item_group, s.label, true
FROM public.clients c
CROSS JOIN hostel_exit_lookup_seed s
ON CONFLICT (client_id, type, item_group, label) DO UPDATE
SET
  active = EXCLUDED.active,
  updated_at = now();
