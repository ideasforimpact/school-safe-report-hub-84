-- Committee members and MOM/Event records

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'committee_members'
  ) THEN
    CREATE TABLE public.committee_members (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      committee_id uuid NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
      client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
      employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
      role text NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS committee_members_unique_member_idx
  ON public.committee_members (committee_id, employee_id);

CREATE INDEX IF NOT EXISTS committee_members_client_id_idx
  ON public.committee_members (client_id);

DROP TRIGGER IF EXISTS set_updated_at_committee_members ON public.committee_members;
CREATE TRIGGER set_updated_at_committee_members
  BEFORE UPDATE ON public.committee_members
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.committee_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view committee members from their client" ON public.committee_members;
CREATE POLICY "Users can view committee members from their client"
  ON public.committee_members
  FOR SELECT
  USING (client_id = public.get_current_user_client_id());

DROP POLICY IF EXISTS "Users can insert committee members for their client" ON public.committee_members;
CREATE POLICY "Users can insert committee members for their client"
  ON public.committee_members
  FOR INSERT
  WITH CHECK (client_id = public.get_current_user_client_id());

DROP POLICY IF EXISTS "Users can update committee members from their client" ON public.committee_members;
CREATE POLICY "Users can update committee members from their client"
  ON public.committee_members
  FOR UPDATE
  USING (client_id = public.get_current_user_client_id())
  WITH CHECK (client_id = public.get_current_user_client_id());

DROP POLICY IF EXISTS "Users can delete committee members from their client" ON public.committee_members;
CREATE POLICY "Users can delete committee members from their client"
  ON public.committee_members
  FOR DELETE
  USING (client_id = public.get_current_user_client_id());

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'committee_events'
  ) THEN
    CREATE TABLE public.committee_events (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      committee_id uuid NOT NULL REFERENCES public.committees(id) ON DELETE CASCADE,
      client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
      event_type text NOT NULL CHECK (event_type IN ('mom', 'event')),
      description text NULL,
      event_date date NOT NULL,
      created_by uuid NULL REFERENCES public.employees(id) ON DELETE SET NULL,
      updated_by uuid NULL REFERENCES public.employees(id) ON DELETE SET NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS committee_events_committee_id_idx
  ON public.committee_events (committee_id);

CREATE INDEX IF NOT EXISTS committee_events_client_id_idx
  ON public.committee_events (client_id);

DROP TRIGGER IF EXISTS set_updated_at_committee_events ON public.committee_events;
CREATE TRIGGER set_updated_at_committee_events
  BEFORE UPDATE ON public.committee_events
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.committee_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view committee events from their client" ON public.committee_events;
CREATE POLICY "Users can view committee events from their client"
  ON public.committee_events
  FOR SELECT
  USING (client_id = public.get_current_user_client_id());

DROP POLICY IF EXISTS "Users can insert committee events for their client" ON public.committee_events;
CREATE POLICY "Users can insert committee events for their client"
  ON public.committee_events
  FOR INSERT
  WITH CHECK (client_id = public.get_current_user_client_id());

DROP POLICY IF EXISTS "Users can update committee events from their client" ON public.committee_events;
CREATE POLICY "Users can update committee events from their client"
  ON public.committee_events
  FOR UPDATE
  USING (client_id = public.get_current_user_client_id())
  WITH CHECK (client_id = public.get_current_user_client_id());

DROP POLICY IF EXISTS "Users can delete committee events from their client" ON public.committee_events;
CREATE POLICY "Users can delete committee events from their client"
  ON public.committee_events
  FOR DELETE
  USING (client_id = public.get_current_user_client_id());
