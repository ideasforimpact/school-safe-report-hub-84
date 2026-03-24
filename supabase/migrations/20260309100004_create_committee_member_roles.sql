-- Configurable role options for committee members
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'committee_member_roles'
  ) THEN
    CREATE TABLE public.committee_member_roles (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      sort_order integer NOT NULL,
      active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS committee_member_roles_name_unique_idx
  ON public.committee_member_roles (lower(name));

CREATE UNIQUE INDEX IF NOT EXISTS committee_member_roles_sort_order_unique_idx
  ON public.committee_member_roles (sort_order);

DROP TRIGGER IF EXISTS set_updated_at_committee_member_roles ON public.committee_member_roles;
CREATE TRIGGER set_updated_at_committee_member_roles
  BEFORE UPDATE ON public.committee_member_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.committee_member_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view committee member roles" ON public.committee_member_roles;
CREATE POLICY "Authenticated users can view committee member roles"
  ON public.committee_member_roles
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Seed default role options
INSERT INTO public.committee_member_roles (name, sort_order, active)
VALUES
  ('Chairperson', 1, true),
  ('Member', 2, true),
  ('Coordinator', 3, true),
  ('External Member', 4, true),
  ('Secretary', 5, true)
ON CONFLICT (sort_order) DO UPDATE
SET
  name = EXCLUDED.name,
  active = EXCLUDED.active,
  updated_at = now();
