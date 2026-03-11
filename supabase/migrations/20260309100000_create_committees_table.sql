-- Create committees table with client-scoped access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'committees'
  ) THEN
    CREATE TABLE public.committees (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
      name text NOT NULL,
      description text NULL,
      chairperson_employee_id uuid NULL REFERENCES public.employees(id) ON DELETE SET NULL,
      status boolean NOT NULL DEFAULT true,
      created_by uuid NULL REFERENCES public.employees(id) ON DELETE SET NULL,
      updated_by uuid NULL REFERENCES public.employees(id) ON DELETE SET NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- Unique committee names per client (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS committees_client_name_unique_idx
  ON public.committees (client_id, lower(name));

CREATE INDEX IF NOT EXISTS committees_client_id_idx
  ON public.committees (client_id);

CREATE INDEX IF NOT EXISTS committees_chairperson_employee_id_idx
  ON public.committees (chairperson_employee_id);

-- Keep updated_at current
DROP TRIGGER IF EXISTS set_updated_at_committees ON public.committees;
CREATE TRIGGER set_updated_at_committees
  BEFORE UPDATE ON public.committees
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS and enforce client isolation
ALTER TABLE public.committees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view committees from their client" ON public.committees;
CREATE POLICY "Users can view committees from their client"
  ON public.committees
  FOR SELECT
  USING (client_id = public.get_current_user_client_id());

DROP POLICY IF EXISTS "Users can insert committees for their client" ON public.committees;
CREATE POLICY "Users can insert committees for their client"
  ON public.committees
  FOR INSERT
  WITH CHECK (client_id = public.get_current_user_client_id());

DROP POLICY IF EXISTS "Users can update committees from their client" ON public.committees;
CREATE POLICY "Users can update committees from their client"
  ON public.committees
  FOR UPDATE
  USING (client_id = public.get_current_user_client_id())
  WITH CHECK (client_id = public.get_current_user_client_id());

DROP POLICY IF EXISTS "Users can delete committees from their client" ON public.committees;
CREATE POLICY "Users can delete committees from their client"
  ON public.committees
  FOR DELETE
  USING (client_id = public.get_current_user_client_id());
