-- Fix Hostel Entry: ensure expected groups and lookup values exist and are active

WITH hostel_entry_definition AS (
  SELECT jsonb_build_array(
    jsonb_build_object(
      'type', 'hostel_entry',
      'table', 'child_audit_look_up',
      'condition', 'item_group = ''physical_condition'' AND type = ''hostel_entry'' AND active = true',
      'item_group', 'Physical Condition'
    ),
    jsonb_build_object(
      'type', 'hostel_entry',
      'table', 'child_audit_look_up',
      'condition', 'item_group = ''health_medical'' AND type = ''hostel_entry'' AND active = true',
      'item_group', 'Health / Medical'
    )
  ) AS alt_definition
)
UPDATE public.child_audit_check_type ct
SET
  alt_definition = d.alt_definition,
  active = true,
  updated_at = now()
FROM hostel_entry_definition d
WHERE ct.key = 'hostel_entry';

WITH hostel_entry_lookup_seed(type, item_group, label) AS (
  VALUES
    ('hostel_entry', 'physical_condition', 'Scratch'),
    ('hostel_entry', 'physical_condition', 'Bruise'),
    ('hostel_entry', 'physical_condition', 'Swelling'),
    ('hostel_entry', 'physical_condition', 'Bite mark'),
    ('hostel_entry', 'physical_condition', 'Redness'),
    ('hostel_entry', 'physical_condition', 'Cut'),
    ('hostel_entry', 'physical_condition', 'Bandage present'),
    ('hostel_entry', 'physical_condition', 'Burn'),
    ('hostel_entry', 'physical_condition', 'Rash'),

    ('hostel_entry', 'health_medical', 'Fever'),
    ('hostel_entry', 'health_medical', 'Medication given'),
    ('hostel_entry', 'health_medical', 'Vomiting'),
    ('hostel_entry', 'health_medical', 'Low appetite'),
    ('hostel_entry', 'health_medical', 'Ear pain'),
    ('hostel_entry', 'health_medical', 'Cold / cough'),
    ('hostel_entry', 'health_medical', 'Constipation'),
    ('hostel_entry', 'health_medical', 'Not eaten breakfast'),
    ('hostel_entry', 'health_medical', 'Diarrhea'),
    ('hostel_entry', 'health_medical', 'Headache')
)
INSERT INTO public.child_audit_look_up (client_id, type, item_group, label, active)
SELECT c.id, s.type, s.item_group, s.label, true
FROM public.clients c
CROSS JOIN hostel_entry_lookup_seed s
ON CONFLICT (client_id, type, item_group, label) DO UPDATE
SET
  active = EXCLUDED.active,
  updated_at = now();
