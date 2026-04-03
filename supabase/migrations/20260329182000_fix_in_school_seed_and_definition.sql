-- Fix In School: ensure all expected groups and lookup values exist and are active

WITH in_school_definition AS (
  SELECT jsonb_build_array(
    jsonb_build_object('type', 'in_school', 'table', 'child_audit_look_up', 'condition', 'item_group = ''behaviour_mood'' AND type = ''in_school'' AND active = true', 'item_group', 'Behaviour / Mood'),
    jsonb_build_object('type', 'in_school', 'table', 'child_audit_look_up', 'condition', 'item_group = ''meltdown'' AND type = ''in_school'' AND active = true', 'item_group', 'Meltdown'),
    jsonb_build_object('type', 'in_school', 'table', 'child_audit_look_up', 'condition', 'item_group = ''aggression'' AND type = ''in_school'' AND active = true', 'item_group', 'Aggression'),
    jsonb_build_object('type', 'in_school', 'table', 'child_audit_look_up', 'condition', 'item_group = ''school_incidents'' AND type = ''in_school'' AND active = true', 'item_group', 'School Incidents')
  ) AS alt_definition
)
UPDATE public.child_audit_check_type ct
SET
  alt_definition = d.alt_definition,
  active = true,
  updated_at = now()
FROM in_school_definition d
WHERE ct.key = 'in_school';

WITH in_school_lookup_seed(type, item_group, label) AS (
  VALUES
    ('in_school', 'behaviour_mood', 'Anxious'),
    ('in_school', 'behaviour_mood', 'Withdrawn'),
    ('in_school', 'behaviour_mood', 'Hyperactive'),
    ('in_school', 'behaviour_mood', 'Irritable'),
    ('in_school', 'behaviour_mood', 'Aggressive'),
    ('in_school', 'behaviour_mood', 'Crying'),
    ('in_school', 'behaviour_mood', 'Sensory overload'),
    ('in_school', 'behaviour_mood', 'Restless'),

    ('in_school', 'meltdown', 'Meltdown occurred'),

    ('in_school', 'aggression', 'Toward self'),
    ('in_school', 'aggression', 'Toward staff'),
    ('in_school', 'aggression', 'Biting'),
    ('in_school', 'aggression', 'Kicking'),
    ('in_school', 'aggression', 'Toward peers'),
    ('in_school', 'aggression', 'Throwing objects'),
    ('in_school', 'aggression', 'Hitting'),
    ('in_school', 'aggression', 'Spitting'),

    ('in_school', 'school_incidents', 'Fell in classroom'),
    ('in_school', 'school_incidents', 'Peer conflict'),
    ('in_school', 'school_incidents', 'Hit furniture/wall'),
    ('in_school', 'school_incidents', 'Threw objects'),
    ('in_school', 'school_incidents', 'Fell in playground'),
    ('in_school', 'school_incidents', 'Self-injury'),
    ('in_school', 'school_incidents', 'Ran out of class'),
    ('in_school', 'school_incidents', 'Toileting accident')
)
INSERT INTO public.child_audit_look_up (client_id, type, item_group, label, active)
SELECT c.id, s.type, s.item_group, s.label, true
FROM public.clients c
CROSS JOIN in_school_lookup_seed s
ON CONFLICT (client_id, type, item_group, label) DO UPDATE
SET
  active = EXCLUDED.active,
  updated_at = now();

UPDATE public.child_audit_look_up
SET
  definition = '["< 5 minutes","5-15 minutes","15-30 minutes","> 30 minutes"]',
  updated_at = now()
WHERE type = 'in_school'
  AND item_group = 'meltdown'
  AND label = 'Meltdown occurred';
