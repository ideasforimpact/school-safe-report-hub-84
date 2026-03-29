-- Child Audit v2 schema (client-scoped):
-- - child_audit_check_type (check types with dynamic lookup definitions)
-- - child_audit_look_up (all lookup values by type + group)
-- - RLS aligned to committees migration style
-- - Public storage bucket for child audit attachments

-- ---------------------------------------------------------------------------
-- 1) child_audit_check_type
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'child_audit_check_type'
  ) THEN
    CREATE TABLE public.child_audit_check_type (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
      type text NOT NULL,
      key text NOT NULL,
      alt_definition jsonb NOT NULL DEFAULT '[]'::jsonb,
      active boolean NOT NULL DEFAULT true,
      attachements jsonb NOT NULL DEFAULT '[]'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    COMMENT ON TABLE public.child_audit_check_type IS 'Child Audit check type master with dynamic lookup-definition metadata';
    COMMENT ON COLUMN public.child_audit_check_type.type IS 'Actual check type label shown in UI, e.g., Morning Entry';
    COMMENT ON COLUMN public.child_audit_check_type.key IS 'Stable key used for lookups, e.g., morning_entry';
    COMMENT ON COLUMN public.child_audit_check_type.alt_definition IS 'Array of objects: [{type, table, condition, item_group}]';
    COMMENT ON COLUMN public.child_audit_check_type.attachements IS 'Attachment metadata template (jsonb array), file references are stored here when needed';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS child_audit_check_type_client_key_unique_idx
  ON public.child_audit_check_type (client_id, key);

CREATE INDEX IF NOT EXISTS child_audit_check_type_client_id_idx
  ON public.child_audit_check_type (client_id);

DROP TRIGGER IF EXISTS set_updated_at_child_audit_check_type ON public.child_audit_check_type;
CREATE TRIGGER set_updated_at_child_audit_check_type
  BEFORE UPDATE ON public.child_audit_check_type
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 2) child_audit_look_up
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'child_audit_look_up'
  ) THEN
    CREATE TABLE public.child_audit_look_up (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
      item_group text NOT NULL,
      type text NOT NULL,
      label text NOT NULL,
      active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    COMMENT ON TABLE public.child_audit_look_up IS 'Child Audit dynamic lookup values partitioned by check type and item group';
    COMMENT ON COLUMN public.child_audit_look_up.item_group IS 'Logical lookup section, e.g., physical_condition, behaviour_mood';
    COMMENT ON COLUMN public.child_audit_look_up.type IS 'Check type key, e.g., morning_entry, in_school, evening_exit';
    COMMENT ON COLUMN public.child_audit_look_up.label IS 'Display label shown in UI';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS child_audit_look_up_client_type_group_label_unique_idx
  ON public.child_audit_look_up (client_id, type, item_group, label);

CREATE INDEX IF NOT EXISTS idx_child_audit_look_up_client_type_group_active
  ON public.child_audit_look_up (client_id, type, item_group, active);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'child_audit_look_up'
      AND constraint_name = 'child_audit_look_up_client_type_fkey'
  ) THEN
    ALTER TABLE public.child_audit_look_up
      ADD CONSTRAINT child_audit_look_up_client_type_fkey
      FOREIGN KEY (client_id, type)
      REFERENCES public.child_audit_check_type (client_id, key)
      ON DELETE CASCADE;
  END IF;
END $$;

DROP TRIGGER IF EXISTS set_updated_at_child_audit_look_up ON public.child_audit_look_up;
CREATE TRIGGER set_updated_at_child_audit_look_up
  BEFORE UPDATE ON public.child_audit_look_up
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3) Seed child_audit_check_type defaults for all clients
-- ---------------------------------------------------------------------------
WITH check_type_seed AS (
  SELECT *
  FROM (
    VALUES
      (
        'Morning Entry'::text,
        'morning_entry'::text,
        jsonb_build_array(
          jsonb_build_object('type', 'morning_entry', 'table', 'child_audit_look_up', 'condition', 'item_group = ''physical_condition'' AND type = ''morning_entry'' AND active = true', 'item_group', 'Physical Condition'),
          jsonb_build_object('type', 'morning_entry', 'table', 'child_audit_look_up', 'condition', 'item_group = ''incidents_at_home'' AND type = ''morning_entry'' AND active = true', 'item_group', 'Incidents at Home'),
          jsonb_build_object('type', 'morning_entry', 'table', 'child_audit_look_up', 'condition', 'item_group = ''sleep_quality_home'' AND type = ''morning_entry'' AND active = true', 'item_group', 'Sleep Quality (Home)'),
          jsonb_build_object('type', 'morning_entry', 'table', 'child_audit_look_up', 'condition', 'item_group = ''morning_behaviour_home'' AND type = ''morning_entry'' AND active = true', 'item_group', 'Morning Behaviour at Home'),
          jsonb_build_object('type', 'morning_entry', 'table', 'child_audit_look_up', 'condition', 'item_group = ''health_medical'' AND type = ''morning_entry'' AND active = true', 'item_group', 'Health / Medical')
        )
      ),
      (
        'In School'::text,
        'in_school'::text,
        jsonb_build_array(
          jsonb_build_object('type', 'in_school', 'table', 'child_audit_look_up', 'condition', 'item_group = ''behaviour_mood'' AND type = ''in_school'' AND active = true', 'item_group', 'Behaviour / Mood'),
          jsonb_build_object('type', 'in_school', 'table', 'child_audit_look_up', 'condition', 'item_group = ''meltdown'' AND type = ''in_school'' AND active = true', 'item_group', 'Meltdown'),
          jsonb_build_object('type', 'in_school', 'table', 'child_audit_look_up', 'condition', 'item_group = ''aggression'' AND type = ''in_school'' AND active = true', 'item_group', 'Aggression'),
          jsonb_build_object('type', 'in_school', 'table', 'child_audit_look_up', 'condition', 'item_group = ''school_incidents'' AND type = ''in_school'' AND active = true', 'item_group', 'School Incidents')
        )
      ),
      (
        'Evening Exit'::text,
        'evening_exit'::text,
        jsonb_build_array(
          jsonb_build_object('type', 'evening_exit', 'table', 'child_audit_look_up', 'condition', 'item_group = ''physical_condition'' AND type = ''evening_exit'' AND active = true', 'item_group', 'Physical Condition')
        )
      ),
      (
        'Hostel Entry'::text,
        'hostel_entry'::text,
        jsonb_build_array(
          jsonb_build_object('type', 'hostel_entry', 'table', 'child_audit_look_up', 'condition', 'item_group = ''physical_condition'' AND type = ''hostel_entry'' AND active = true', 'item_group', 'Physical Condition'),
          jsonb_build_object('type', 'hostel_entry', 'table', 'child_audit_look_up', 'condition', 'item_group = ''health_medical'' AND type = ''hostel_entry'' AND active = true', 'item_group', 'Health / Medical')
        )
      ),
      (
        'In Hostel'::text,
        'in_hostel'::text,
        jsonb_build_array(
          jsonb_build_object('type', 'in_hostel', 'table', 'child_audit_look_up', 'condition', 'item_group = ''behaviour_mood'' AND type = ''in_hostel'' AND active = true', 'item_group', 'Behaviour / Mood'),
          jsonb_build_object('type', 'in_hostel', 'table', 'child_audit_look_up', 'condition', 'item_group = ''meltdown'' AND type = ''in_hostel'' AND active = true', 'item_group', 'Meltdown'),
          jsonb_build_object('type', 'in_hostel', 'table', 'child_audit_look_up', 'condition', 'item_group = ''aggression'' AND type = ''in_hostel'' AND active = true', 'item_group', 'Aggression'),
          jsonb_build_object('type', 'in_hostel', 'table', 'child_audit_look_up', 'condition', 'item_group = ''hostel_incidents'' AND type = ''in_hostel'' AND active = true', 'item_group', 'Hostel Incidents'),
          jsonb_build_object('type', 'in_hostel', 'table', 'child_audit_look_up', 'condition', 'item_group = ''sleep_hostel'' AND type = ''in_hostel'' AND active = true', 'item_group', 'Sleep (Hostel)'),
          jsonb_build_object('type', 'in_hostel', 'table', 'child_audit_look_up', 'condition', 'item_group = ''night_behaviour'' AND type = ''in_hostel'' AND active = true', 'item_group', 'Night Behaviour'),
          jsonb_build_object('type', 'in_hostel', 'table', 'child_audit_look_up', 'condition', 'item_group = ''daily_living'' AND type = ''in_hostel'' AND active = true', 'item_group', 'Daily Living'),
          jsonb_build_object('type', 'in_hostel', 'table', 'child_audit_look_up', 'condition', 'item_group = ''safety_observations'' AND type = ''in_hostel'' AND active = true', 'item_group', 'Safety Observations')
        )
      ),
      (
        'Hostel Exit'::text,
        'hostel_exit'::text,
        jsonb_build_array(
          jsonb_build_object('type', 'hostel_exit', 'table', 'child_audit_look_up', 'condition', 'item_group = ''physical_condition'' AND type = ''hostel_exit'' AND active = true', 'item_group', 'Physical Condition')
        )
      )
  ) AS t(type, key, alt_definition)
)
INSERT INTO public.child_audit_check_type (client_id, type, key, alt_definition, active, attachements)
SELECT c.id, s.type, s.key, s.alt_definition, true, '[]'::jsonb
FROM public.clients c
CROSS JOIN check_type_seed s
ON CONFLICT (client_id, key) DO UPDATE
SET
  type = EXCLUDED.type,
  alt_definition = EXCLUDED.alt_definition,
  active = EXCLUDED.active,
  attachements = EXCLUDED.attachements,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- 4) Seed child_audit_look_up defaults for all clients
-- ---------------------------------------------------------------------------
WITH lookup_seed AS (
  SELECT *
  FROM (
    VALUES
      -- Morning Entry: Physical Condition
      ('morning_entry', 'physical_condition', 'Scratch'),
      ('morning_entry', 'physical_condition', 'Bruise'),
      ('morning_entry', 'physical_condition', 'Swelling'),
      ('morning_entry', 'physical_condition', 'Bite mark'),
      ('morning_entry', 'physical_condition', 'Redness'),
      ('morning_entry', 'physical_condition', 'Cut'),
      ('morning_entry', 'physical_condition', 'Bandage present'),
      ('morning_entry', 'physical_condition', 'Burn'),
      ('morning_entry', 'physical_condition', 'Rash'),

      -- Evening Exit: same Physical Condition values
      ('evening_exit', 'physical_condition', 'Scratch'),
      ('evening_exit', 'physical_condition', 'Bruise'),
      ('evening_exit', 'physical_condition', 'Swelling'),
      ('evening_exit', 'physical_condition', 'Bite mark'),
      ('evening_exit', 'physical_condition', 'Redness'),
      ('evening_exit', 'physical_condition', 'Cut'),
      ('evening_exit', 'physical_condition', 'Bandage present'),
      ('evening_exit', 'physical_condition', 'Burn'),
      ('evening_exit', 'physical_condition', 'Rash'),

      -- Hostel Entry: same Physical Condition values
      ('hostel_entry', 'physical_condition', 'Scratch'),
      ('hostel_entry', 'physical_condition', 'Bruise'),
      ('hostel_entry', 'physical_condition', 'Swelling'),
      ('hostel_entry', 'physical_condition', 'Bite mark'),
      ('hostel_entry', 'physical_condition', 'Redness'),
      ('hostel_entry', 'physical_condition', 'Cut'),
      ('hostel_entry', 'physical_condition', 'Bandage present'),
      ('hostel_entry', 'physical_condition', 'Burn'),
      ('hostel_entry', 'physical_condition', 'Rash'),

      -- Hostel Exit: same Physical Condition values
      ('hostel_exit', 'physical_condition', 'Scratch'),
      ('hostel_exit', 'physical_condition', 'Bruise'),
      ('hostel_exit', 'physical_condition', 'Swelling'),
      ('hostel_exit', 'physical_condition', 'Bite mark'),
      ('hostel_exit', 'physical_condition', 'Redness'),
      ('hostel_exit', 'physical_condition', 'Cut'),
      ('hostel_exit', 'physical_condition', 'Bandage present'),
      ('hostel_exit', 'physical_condition', 'Burn'),
      ('hostel_exit', 'physical_condition', 'Rash'),

      -- Morning Entry: Incidents at Home
      ('morning_entry', 'incidents_at_home', 'Fell from bed'),
      ('morning_entry', 'incidents_at_home', 'Hit against furniture'),
      ('morning_entry', 'incidents_at_home', 'Self-injury'),
      ('morning_entry', 'incidents_at_home', 'Burn (hot water/food)'),
      ('morning_entry', 'incidents_at_home', 'Seizure episode'),
      ('morning_entry', 'incidents_at_home', 'Fell while walking/running'),
      ('morning_entry', 'incidents_at_home', 'Sibling conflict'),
      ('morning_entry', 'incidents_at_home', 'Insect bite'),
      ('morning_entry', 'incidents_at_home', 'Scratch from nail'),

      -- Morning Entry: Sleep Quality (Home)
      ('morning_entry', 'sleep_quality_home', 'Poor sleep'),
      ('morning_entry', 'sleep_quality_home', 'Slept late'),
      ('morning_entry', 'sleep_quality_home', 'No sleep'),
      ('morning_entry', 'sleep_quality_home', 'Woke multiple times'),
      ('morning_entry', 'sleep_quality_home', 'Very early waking'),
      ('morning_entry', 'sleep_quality_home', 'Nightmares'),

      -- Morning Entry: Morning Behaviour at Home
      ('morning_entry', 'morning_behaviour_home', 'Refused to come to school'),
      ('morning_entry', 'morning_behaviour_home', 'Aggressive'),
      ('morning_entry', 'morning_behaviour_home', 'Withdrawn'),
      ('morning_entry', 'morning_behaviour_home', 'Crying'),
      ('morning_entry', 'morning_behaviour_home', 'Hyperactive'),
      ('morning_entry', 'morning_behaviour_home', 'Tantrum before leaving'),

      -- Morning Entry: Health / Medical
      ('morning_entry', 'health_medical', 'Fever'),
      ('morning_entry', 'health_medical', 'Medication given'),
      ('morning_entry', 'health_medical', 'Vomiting'),
      ('morning_entry', 'health_medical', 'Low appetite'),
      ('morning_entry', 'health_medical', 'Ear pain'),
      ('morning_entry', 'health_medical', 'Cold / cough'),
      ('morning_entry', 'health_medical', 'Constipation'),
      ('morning_entry', 'health_medical', 'Not eaten breakfast'),
      ('morning_entry', 'health_medical', 'Diarrhea'),
      ('morning_entry', 'health_medical', 'Headache'),

      -- Hostel Entry: Health / Medical (same as morning)
      ('hostel_entry', 'health_medical', 'Fever'),
      ('hostel_entry', 'health_medical', 'Medication given'),
      ('hostel_entry', 'health_medical', 'Vomiting'),
      ('hostel_entry', 'health_medical', 'Low appetite'),
      ('hostel_entry', 'health_medical', 'Ear pain'),
      ('hostel_entry', 'health_medical', 'Cold / cough'),
      ('hostel_entry', 'health_medical', 'Constipation'),
      ('hostel_entry', 'health_medical', 'Not eaten breakfast'),
      ('hostel_entry', 'health_medical', 'Diarrhea'),
      ('hostel_entry', 'health_medical', 'Headache'),

      -- In School: Behaviour / Mood
      ('in_school', 'behaviour_mood', 'Anxious'),
      ('in_school', 'behaviour_mood', 'Withdrawn'),
      ('in_school', 'behaviour_mood', 'Hyperactive'),
      ('in_school', 'behaviour_mood', 'Irritable'),
      ('in_school', 'behaviour_mood', 'Aggressive'),
      ('in_school', 'behaviour_mood', 'Crying'),
      ('in_school', 'behaviour_mood', 'Sensory overload'),
      ('in_school', 'behaviour_mood', 'Restless'),

      -- In School: Meltdown
      ('in_school', 'meltdown', 'Meltdown occurred'),

      -- In School: Aggression
      ('in_school', 'aggression', 'Toward self'),
      ('in_school', 'aggression', 'Toward staff'),
      ('in_school', 'aggression', 'Biting'),
      ('in_school', 'aggression', 'Kicking'),
      ('in_school', 'aggression', 'Toward peers'),
      ('in_school', 'aggression', 'Throwing objects'),
      ('in_school', 'aggression', 'Hitting'),
      ('in_school', 'aggression', 'Spitting'),

      -- In School: School Incidents
      ('in_school', 'school_incidents', 'Fell in classroom'),
      ('in_school', 'school_incidents', 'Peer conflict'),
      ('in_school', 'school_incidents', 'Hit furniture/wall'),
      ('in_school', 'school_incidents', 'Threw objects'),
      ('in_school', 'school_incidents', 'Fell in playground'),
      ('in_school', 'school_incidents', 'Self-injury'),
      ('in_school', 'school_incidents', 'Ran out of class'),
      ('in_school', 'school_incidents', 'Toileting accident'),

      -- In Hostel: Behaviour / Mood
      ('in_hostel', 'behaviour_mood', 'Anxious'),
      ('in_hostel', 'behaviour_mood', 'Withdrawn'),
      ('in_hostel', 'behaviour_mood', 'Hyperactive'),
      ('in_hostel', 'behaviour_mood', 'Irritable'),
      ('in_hostel', 'behaviour_mood', 'Aggressive'),
      ('in_hostel', 'behaviour_mood', 'Crying'),
      ('in_hostel', 'behaviour_mood', 'Sensory overload'),
      ('in_hostel', 'behaviour_mood', 'Restless'),

      -- In Hostel: Meltdown
      ('in_hostel', 'meltdown', 'Meltdown occurred'),

      -- In Hostel: Aggression
      ('in_hostel', 'aggression', 'Toward self'),
      ('in_hostel', 'aggression', 'Toward staff'),
      ('in_hostel', 'aggression', 'Biting'),
      ('in_hostel', 'aggression', 'Kicking'),
      ('in_hostel', 'aggression', 'Toward peers'),
      ('in_hostel', 'aggression', 'Throwing objects'),
      ('in_hostel', 'aggression', 'Hitting'),
      ('in_hostel', 'aggression', 'Spitting'),

      -- In Hostel: Hostel Incidents
      ('in_hostel', 'hostel_incidents', 'Fell from bed'),
      ('in_hostel', 'hostel_incidents', 'Hit wall/furniture'),
      ('in_hostel', 'hostel_incidents', 'Self-injury'),
      ('in_hostel', 'hostel_incidents', 'Banged head'),
      ('in_hostel', 'hostel_incidents', 'Scratching'),
      ('in_hostel', 'hostel_incidents', 'Fell in bathroom'),
      ('in_hostel', 'hostel_incidents', 'Peer conflict'),
      ('in_hostel', 'hostel_incidents', 'Night wandering'),
      ('in_hostel', 'hostel_incidents', 'Bite (self/peer)'),

      -- In Hostel: Sleep (Hostel)
      ('in_hostel', 'sleep_hostel', 'Woke at night'),
      ('in_hostel', 'sleep_hostel', 'Night crying'),
      ('in_hostel', 'sleep_hostel', 'Restless sleep'),
      ('in_hostel', 'sleep_hostel', 'Nightmares'),
      ('in_hostel', 'sleep_hostel', 'Night meltdown'),
      ('in_hostel', 'sleep_hostel', 'Sleepwalking'),
      ('in_hostel', 'sleep_hostel', 'No sleep'),

      -- In Hostel: Night Behaviour
      ('in_hostel', 'night_behaviour', 'Aggression'),
      ('in_hostel', 'night_behaviour', 'Tantrum'),
      ('in_hostel', 'night_behaviour', 'Withdrawn'),
      ('in_hostel', 'night_behaviour', 'Self harm'),
      ('in_hostel', 'night_behaviour', 'Sensory overload'),
      ('in_hostel', 'night_behaviour', 'Crying'),

      -- In Hostel: Daily Living
      ('in_hostel', 'daily_living', 'Refused dinner'),
      ('in_hostel', 'daily_living', 'Bed wetting'),
      ('in_hostel', 'daily_living', 'Vomited'),
      ('in_hostel', 'daily_living', 'Refused bath'),
      ('in_hostel', 'daily_living', 'Toileting accident'),
      ('in_hostel', 'daily_living', 'Refused medication'),
      ('in_hostel', 'daily_living', 'Constipation'),
      ('in_hostel', 'daily_living', 'Refused to change clothes'),

      -- In Hostel: Safety Observations
      ('in_hostel', 'safety_observations', 'Climbed bed railing'),
      ('in_hostel', 'safety_observations', 'Removed clothes'),
      ('in_hostel', 'safety_observations', 'Repetitive behavior increased'),
      ('in_hostel', 'safety_observations', 'Climbed furniture'),
      ('in_hostel', 'safety_observations', 'Tried to run away'),
      ('in_hostel', 'safety_observations', 'Hit head repeatedly'),
      ('in_hostel', 'safety_observations', 'Put objects in mouth')
  ) AS t(type, item_group, label)
)
INSERT INTO public.child_audit_look_up (client_id, type, item_group, label, active)
SELECT c.id, s.type, s.item_group, s.label, true
FROM public.clients c
CROSS JOIN lookup_seed s
ON CONFLICT (client_id, type, item_group, label) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5) RLS policies (aligned to committees pattern)
-- ---------------------------------------------------------------------------
ALTER TABLE public.child_audit_check_type ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view child audit check type from their client" ON public.child_audit_check_type;
CREATE POLICY "Users can view child audit check type from their client"
  ON public.child_audit_check_type
  FOR SELECT
  USING (client_id = public.get_current_user_client_id());

DROP POLICY IF EXISTS "Users can insert child audit check type for their client" ON public.child_audit_check_type;
CREATE POLICY "Users can insert child audit check type for their client"
  ON public.child_audit_check_type
  FOR INSERT
  WITH CHECK (client_id = public.get_current_user_client_id());

DROP POLICY IF EXISTS "Users can update child audit check type from their client" ON public.child_audit_check_type;
CREATE POLICY "Users can update child audit check type from their client"
  ON public.child_audit_check_type
  FOR UPDATE
  USING (client_id = public.get_current_user_client_id())
  WITH CHECK (client_id = public.get_current_user_client_id());

DROP POLICY IF EXISTS "Users can delete child audit check type from their client" ON public.child_audit_check_type;
CREATE POLICY "Users can delete child audit check type from their client"
  ON public.child_audit_check_type
  FOR DELETE
  USING (client_id = public.get_current_user_client_id());

ALTER TABLE public.child_audit_look_up ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view child audit look up from their client" ON public.child_audit_look_up;
CREATE POLICY "Users can view child audit look up from their client"
  ON public.child_audit_look_up
  FOR SELECT
  USING (client_id = public.get_current_user_client_id());

DROP POLICY IF EXISTS "Users can insert child audit look up for their client" ON public.child_audit_look_up;
CREATE POLICY "Users can insert child audit look up for their client"
  ON public.child_audit_look_up
  FOR INSERT
  WITH CHECK (client_id = public.get_current_user_client_id());

DROP POLICY IF EXISTS "Users can update child audit look up from their client" ON public.child_audit_look_up;
CREATE POLICY "Users can update child audit look up from their client"
  ON public.child_audit_look_up
  FOR UPDATE
  USING (client_id = public.get_current_user_client_id())
  WITH CHECK (client_id = public.get_current_user_client_id());

DROP POLICY IF EXISTS "Users can delete child audit look up from their client" ON public.child_audit_look_up;
CREATE POLICY "Users can delete child audit look up from their client"
  ON public.child_audit_look_up
  FOR DELETE
  USING (client_id = public.get_current_user_client_id());

-- ---------------------------------------------------------------------------
-- 6) Storage bucket for child audit attachments
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'child_audit_attachements',
  'child_audit_attachements',
  true,
  52428800,
  ARRAY[
    'image/*',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $$
BEGIN
  BEGIN
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  DROP POLICY IF EXISTS "Allow public read child_audit_attachements" ON storage.objects;
  CREATE POLICY "Allow public read child_audit_attachements"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'child_audit_attachements');

  DROP POLICY IF EXISTS "Allow authenticated upload child_audit_attachements" ON storage.objects;
  CREATE POLICY "Allow authenticated upload child_audit_attachements"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'child_audit_attachements');

  DROP POLICY IF EXISTS "Allow authenticated update child_audit_attachements" ON storage.objects;
  CREATE POLICY "Allow authenticated update child_audit_attachements"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'child_audit_attachements');

  DROP POLICY IF EXISTS "Allow authenticated delete child_audit_attachements" ON storage.objects;
  CREATE POLICY "Allow authenticated delete child_audit_attachements"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'child_audit_attachements');
END $$;
