-- Fix In Hostel: ensure expected groups and lookup values exist and are active

WITH in_hostel_definition AS (
  SELECT jsonb_build_array(
    jsonb_build_object('type', 'in_hostel', 'table', 'child_audit_look_up', 'condition', 'item_group = ''behaviour_mood'' AND type = ''in_hostel'' AND active = true', 'item_group', 'Behaviour / Mood'),
    jsonb_build_object('type', 'in_hostel', 'table', 'child_audit_look_up', 'condition', 'item_group = ''meltdown'' AND type = ''in_hostel'' AND active = true', 'item_group', 'Meltdown'),
    jsonb_build_object('type', 'in_hostel', 'table', 'child_audit_look_up', 'condition', 'item_group = ''aggression'' AND type = ''in_hostel'' AND active = true', 'item_group', 'Aggression'),
    jsonb_build_object('type', 'in_hostel', 'table', 'child_audit_look_up', 'condition', 'item_group = ''hostel_incidents'' AND type = ''in_hostel'' AND active = true', 'item_group', 'Hostel Incidents'),
    jsonb_build_object('type', 'in_hostel', 'table', 'child_audit_look_up', 'condition', 'item_group = ''sleep_hostel'' AND type = ''in_hostel'' AND active = true', 'item_group', 'Sleep (Hostel)'),
    jsonb_build_object('type', 'in_hostel', 'table', 'child_audit_look_up', 'condition', 'item_group = ''night_behaviour'' AND type = ''in_hostel'' AND active = true', 'item_group', 'Night Behaviour'),
    jsonb_build_object('type', 'in_hostel', 'table', 'child_audit_look_up', 'condition', 'item_group = ''daily_living'' AND type = ''in_hostel'' AND active = true', 'item_group', 'Daily Living'),
    jsonb_build_object('type', 'in_hostel', 'table', 'child_audit_look_up', 'condition', 'item_group = ''safety_observations'' AND type = ''in_hostel'' AND active = true', 'item_group', 'Safety Observations')
  ) AS alt_definition
)
UPDATE public.child_audit_check_type ct
SET
  alt_definition = d.alt_definition,
  active = true,
  updated_at = now()
FROM in_hostel_definition d
WHERE ct.key = 'in_hostel';

WITH in_hostel_lookup_seed(type, item_group, label) AS (
  VALUES
    ('in_hostel', 'behaviour_mood', 'Anxious'),
    ('in_hostel', 'behaviour_mood', 'Withdrawn'),
    ('in_hostel', 'behaviour_mood', 'Hyperactive'),
    ('in_hostel', 'behaviour_mood', 'Irritable'),
    ('in_hostel', 'behaviour_mood', 'Aggressive'),
    ('in_hostel', 'behaviour_mood', 'Crying'),
    ('in_hostel', 'behaviour_mood', 'Sensory overload'),
    ('in_hostel', 'behaviour_mood', 'Restless'),

    ('in_hostel', 'meltdown', 'Meltdown occurred'),

    ('in_hostel', 'aggression', 'Toward self'),
    ('in_hostel', 'aggression', 'Toward staff'),
    ('in_hostel', 'aggression', 'Biting'),
    ('in_hostel', 'aggression', 'Kicking'),
    ('in_hostel', 'aggression', 'Toward peers'),
    ('in_hostel', 'aggression', 'Throwing objects'),
    ('in_hostel', 'aggression', 'Hitting'),
    ('in_hostel', 'aggression', 'Spitting'),

    ('in_hostel', 'hostel_incidents', 'Fell from bed'),
    ('in_hostel', 'hostel_incidents', 'Hit wall/furniture'),
    ('in_hostel', 'hostel_incidents', 'Self-injury'),
    ('in_hostel', 'hostel_incidents', 'Banged head'),
    ('in_hostel', 'hostel_incidents', 'Scratching'),
    ('in_hostel', 'hostel_incidents', 'Fell in bathroom'),
    ('in_hostel', 'hostel_incidents', 'Peer conflict'),
    ('in_hostel', 'hostel_incidents', 'Night wandering'),
    ('in_hostel', 'hostel_incidents', 'Bite (self/peer)'),

    ('in_hostel', 'sleep_hostel', 'Woke at night'),
    ('in_hostel', 'sleep_hostel', 'Night crying'),
    ('in_hostel', 'sleep_hostel', 'Restless sleep'),
    ('in_hostel', 'sleep_hostel', 'Nightmares'),
    ('in_hostel', 'sleep_hostel', 'Night meltdown'),
    ('in_hostel', 'sleep_hostel', 'Sleepwalking'),
    ('in_hostel', 'sleep_hostel', 'No sleep'),

    ('in_hostel', 'night_behaviour', 'Aggression'),
    ('in_hostel', 'night_behaviour', 'Tantrum'),
    ('in_hostel', 'night_behaviour', 'Withdrawn'),
    ('in_hostel', 'night_behaviour', 'Self harm'),
    ('in_hostel', 'night_behaviour', 'Sensory overload'),
    ('in_hostel', 'night_behaviour', 'Crying'),

    ('in_hostel', 'daily_living', 'Refused dinner'),
    ('in_hostel', 'daily_living', 'Bed wetting'),
    ('in_hostel', 'daily_living', 'Vomited'),
    ('in_hostel', 'daily_living', 'Refused bath'),
    ('in_hostel', 'daily_living', 'Toileting accident'),
    ('in_hostel', 'daily_living', 'Refused medication'),
    ('in_hostel', 'daily_living', 'Constipation'),
    ('in_hostel', 'daily_living', 'Refused to change clothes'),

    ('in_hostel', 'safety_observations', 'Climbed bed railing'),
    ('in_hostel', 'safety_observations', 'Removed clothes'),
    ('in_hostel', 'safety_observations', 'Repetitive behavior increased'),
    ('in_hostel', 'safety_observations', 'Climbed furniture'),
    ('in_hostel', 'safety_observations', 'Tried to run away'),
    ('in_hostel', 'safety_observations', 'Hit head repeatedly'),
    ('in_hostel', 'safety_observations', 'Put objects in mouth')
)
INSERT INTO public.child_audit_look_up (client_id, type, item_group, label, active)
SELECT c.id, s.type, s.item_group, s.label, true
FROM public.clients c
CROSS JOIN in_hostel_lookup_seed s
ON CONFLICT (client_id, type, item_group, label) DO UPDATE
SET
  active = EXCLUDED.active,
  updated_at = now();

UPDATE public.child_audit_look_up
SET
  definition = '["< 5 minutes","5-15 minutes","15-30 minutes","> 30 minutes"]',
  updated_at = now()
WHERE type = 'in_hostel'
  AND item_group = 'meltdown'
  AND label = 'Meltdown occurred';
