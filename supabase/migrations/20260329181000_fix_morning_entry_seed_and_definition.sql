-- Fix Morning Entry: ensure all expected groups and lookup values exist and are active

WITH morning_definition AS (
  SELECT jsonb_build_array(
    jsonb_build_object('type', 'morning_entry', 'table', 'child_audit_look_up', 'condition', 'item_group = ''physical_condition'' AND type = ''morning_entry'' AND active = true', 'item_group', 'Physical Condition'),
    jsonb_build_object('type', 'morning_entry', 'table', 'child_audit_look_up', 'condition', 'item_group = ''incidents_at_home'' AND type = ''morning_entry'' AND active = true', 'item_group', 'Incidents at Home'),
    jsonb_build_object('type', 'morning_entry', 'table', 'child_audit_look_up', 'condition', 'item_group = ''sleep_quality_home'' AND type = ''morning_entry'' AND active = true', 'item_group', 'Sleep Quality (Home)'),
    jsonb_build_object('type', 'morning_entry', 'table', 'child_audit_look_up', 'condition', 'item_group = ''morning_behaviour_home'' AND type = ''morning_entry'' AND active = true', 'item_group', 'Morning Behaviour at Home'),
    jsonb_build_object('type', 'morning_entry', 'table', 'child_audit_look_up', 'condition', 'item_group = ''health_medical'' AND type = ''morning_entry'' AND active = true', 'item_group', 'Health / Medical')
  ) AS alt_definition
)
UPDATE public.child_audit_check_type ct
SET
  alt_definition = md.alt_definition,
  active = true,
  updated_at = now()
FROM morning_definition md
WHERE ct.key = 'morning_entry';

WITH morning_lookup_seed(type, item_group, label) AS (
  VALUES
    ('morning_entry', 'physical_condition', 'Scratch'),
    ('morning_entry', 'physical_condition', 'Bruise'),
    ('morning_entry', 'physical_condition', 'Swelling'),
    ('morning_entry', 'physical_condition', 'Bite mark'),
    ('morning_entry', 'physical_condition', 'Redness'),
    ('morning_entry', 'physical_condition', 'Cut'),
    ('morning_entry', 'physical_condition', 'Bandage present'),
    ('morning_entry', 'physical_condition', 'Burn'),
    ('morning_entry', 'physical_condition', 'Rash'),

    ('morning_entry', 'incidents_at_home', 'Fell from bed'),
    ('morning_entry', 'incidents_at_home', 'Hit against furniture'),
    ('morning_entry', 'incidents_at_home', 'Self-injury'),
    ('morning_entry', 'incidents_at_home', 'Burn (hot water/food)'),
    ('morning_entry', 'incidents_at_home', 'Seizure episode'),
    ('morning_entry', 'incidents_at_home', 'Fell while walking/running'),
    ('morning_entry', 'incidents_at_home', 'Sibling conflict'),
    ('morning_entry', 'incidents_at_home', 'Insect bite'),
    ('morning_entry', 'incidents_at_home', 'Scratch from nail'),

    ('morning_entry', 'sleep_quality_home', 'Poor sleep'),
    ('morning_entry', 'sleep_quality_home', 'Slept late'),
    ('morning_entry', 'sleep_quality_home', 'No sleep'),
    ('morning_entry', 'sleep_quality_home', 'Woke multiple times'),
    ('morning_entry', 'sleep_quality_home', 'Very early waking'),
    ('morning_entry', 'sleep_quality_home', 'Nightmares'),

    ('morning_entry', 'morning_behaviour_home', 'Refused to come to school'),
    ('morning_entry', 'morning_behaviour_home', 'Aggressive'),
    ('morning_entry', 'morning_behaviour_home', 'Withdrawn'),
    ('morning_entry', 'morning_behaviour_home', 'Crying'),
    ('morning_entry', 'morning_behaviour_home', 'Hyperactive'),
    ('morning_entry', 'morning_behaviour_home', 'Tantrum before leaving'),

    ('morning_entry', 'health_medical', 'Fever'),
    ('morning_entry', 'health_medical', 'Medication given'),
    ('morning_entry', 'health_medical', 'Vomiting'),
    ('morning_entry', 'health_medical', 'Low appetite'),
    ('morning_entry', 'health_medical', 'Ear pain'),
    ('morning_entry', 'health_medical', 'Cold / cough'),
    ('morning_entry', 'health_medical', 'Constipation'),
    ('morning_entry', 'health_medical', 'Not eaten breakfast'),
    ('morning_entry', 'health_medical', 'Diarrhea'),
    ('morning_entry', 'health_medical', 'Headache')
)
INSERT INTO public.child_audit_look_up (client_id, type, item_group, label, active)
SELECT c.id, s.type, s.item_group, s.label, true
FROM public.clients c
CROSS JOIN morning_lookup_seed s
ON CONFLICT (client_id, type, item_group, label) DO UPDATE
SET
  active = EXCLUDED.active,
  updated_at = now();
