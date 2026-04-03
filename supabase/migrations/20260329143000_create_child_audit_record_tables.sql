-- Child Audit save schema (normalized, client-scoped)

-- ---------------------------------------------------------------------------
-- 1) child_audit_record
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'child_audit_record'
  ) THEN
    CREATE TABLE public.child_audit_record (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
      student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
      employee_id uuid NULL REFERENCES public.employees(id) ON DELETE SET NULL,

      check_type_id uuid NOT NULL REFERENCES public.child_audit_check_type(id) ON DELETE RESTRICT,
      check_type_key text NOT NULL,
      check_type_name text NOT NULL,

      notes text NULL,
      submission_time timestamptz NOT NULL DEFAULT now(),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_child_audit_record_client_student_time
  ON public.child_audit_record (client_id, student_id, submission_time DESC);

DROP TRIGGER IF EXISTS set_updated_at_child_audit_record ON public.child_audit_record;
CREATE TRIGGER set_updated_at_child_audit_record
  BEFORE UPDATE ON public.child_audit_record
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 2) child_audit_record_item
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'child_audit_record_item'
  ) THEN
    CREATE TABLE public.child_audit_record_item (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      record_id uuid NOT NULL REFERENCES public.child_audit_record(id) ON DELETE CASCADE,
      client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,

      lookup_id uuid NULL REFERENCES public.child_audit_look_up(id) ON DELETE SET NULL,
      check_type_key text NOT NULL,
      item_group text NOT NULL,
      item_label text NOT NULL,
      lookup_definition text NULL,

      is_selected boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_child_audit_record_item_record_id
  ON public.child_audit_record_item (record_id);

CREATE INDEX IF NOT EXISTS idx_child_audit_record_item_client_group
  ON public.child_audit_record_item (client_id, item_group);

-- ---------------------------------------------------------------------------
-- 3) child_audit_record_item_location
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'child_audit_record_item_location'
  ) THEN
    CREATE TABLE public.child_audit_record_item_location (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      record_item_id uuid NOT NULL REFERENCES public.child_audit_record_item(id) ON DELETE CASCADE,
      client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
      body_part text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT child_audit_record_item_location_unique UNIQUE (record_item_id, body_part)
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_child_audit_record_item_location_record_item
  ON public.child_audit_record_item_location (record_item_id);

-- ---------------------------------------------------------------------------
-- 4) child_audit_record_attachment
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'child_audit_record_attachment'
  ) THEN
    CREATE TABLE public.child_audit_record_attachment (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      record_id uuid NOT NULL REFERENCES public.child_audit_record(id) ON DELETE CASCADE,
      client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,

      bucket text NOT NULL DEFAULT 'child_audit_attachements',
      file_path text NOT NULL,
      file_name text NOT NULL,
      mime_type text NULL,
      file_size bigint NULL,

      created_at timestamptz NOT NULL DEFAULT now()
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_child_audit_record_attachment_record
  ON public.child_audit_record_attachment (record_id);

-- ---------------------------------------------------------------------------
-- 5) RLS (committee-style policies)
-- ---------------------------------------------------------------------------
ALTER TABLE public.child_audit_record ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_audit_record_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_audit_record_item_location ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_audit_record_attachment ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view child audit record from their client" ON public.child_audit_record;
CREATE POLICY "Users can view child audit record from their client"
  ON public.child_audit_record
  FOR SELECT
  USING (client_id = public.get_current_user_client_id());

DROP POLICY IF EXISTS "Users can insert child audit record for their client" ON public.child_audit_record;
CREATE POLICY "Users can insert child audit record for their client"
  ON public.child_audit_record
  FOR INSERT
  WITH CHECK (client_id = public.get_current_user_client_id());

DROP POLICY IF EXISTS "Users can update child audit record from their client" ON public.child_audit_record;
CREATE POLICY "Users can update child audit record from their client"
  ON public.child_audit_record
  FOR UPDATE
  USING (client_id = public.get_current_user_client_id())
  WITH CHECK (client_id = public.get_current_user_client_id());

DROP POLICY IF EXISTS "Users can delete child audit record from their client" ON public.child_audit_record;
CREATE POLICY "Users can delete child audit record from their client"
  ON public.child_audit_record
  FOR DELETE
  USING (client_id = public.get_current_user_client_id());

DROP POLICY IF EXISTS "Users can view child audit record item from their client" ON public.child_audit_record_item;
CREATE POLICY "Users can view child audit record item from their client"
  ON public.child_audit_record_item
  FOR SELECT
  USING (client_id = public.get_current_user_client_id());

DROP POLICY IF EXISTS "Users can insert child audit record item for their client" ON public.child_audit_record_item;
CREATE POLICY "Users can insert child audit record item for their client"
  ON public.child_audit_record_item
  FOR INSERT
  WITH CHECK (client_id = public.get_current_user_client_id());

DROP POLICY IF EXISTS "Users can update child audit record item from their client" ON public.child_audit_record_item;
CREATE POLICY "Users can update child audit record item from their client"
  ON public.child_audit_record_item
  FOR UPDATE
  USING (client_id = public.get_current_user_client_id())
  WITH CHECK (client_id = public.get_current_user_client_id());

DROP POLICY IF EXISTS "Users can delete child audit record item from their client" ON public.child_audit_record_item;
CREATE POLICY "Users can delete child audit record item from their client"
  ON public.child_audit_record_item
  FOR DELETE
  USING (client_id = public.get_current_user_client_id());

DROP POLICY IF EXISTS "Users can view child audit record item location from their client" ON public.child_audit_record_item_location;
CREATE POLICY "Users can view child audit record item location from their client"
  ON public.child_audit_record_item_location
  FOR SELECT
  USING (client_id = public.get_current_user_client_id());

DROP POLICY IF EXISTS "Users can insert child audit record item location for their client" ON public.child_audit_record_item_location;
CREATE POLICY "Users can insert child audit record item location for their client"
  ON public.child_audit_record_item_location
  FOR INSERT
  WITH CHECK (client_id = public.get_current_user_client_id());

DROP POLICY IF EXISTS "Users can update child audit record item location from their client" ON public.child_audit_record_item_location;
CREATE POLICY "Users can update child audit record item location from their client"
  ON public.child_audit_record_item_location
  FOR UPDATE
  USING (client_id = public.get_current_user_client_id())
  WITH CHECK (client_id = public.get_current_user_client_id());

DROP POLICY IF EXISTS "Users can delete child audit record item location from their client" ON public.child_audit_record_item_location;
CREATE POLICY "Users can delete child audit record item location from their client"
  ON public.child_audit_record_item_location
  FOR DELETE
  USING (client_id = public.get_current_user_client_id());

DROP POLICY IF EXISTS "Users can view child audit record attachment from their client" ON public.child_audit_record_attachment;
CREATE POLICY "Users can view child audit record attachment from their client"
  ON public.child_audit_record_attachment
  FOR SELECT
  USING (client_id = public.get_current_user_client_id());

DROP POLICY IF EXISTS "Users can insert child audit record attachment for their client" ON public.child_audit_record_attachment;
CREATE POLICY "Users can insert child audit record attachment for their client"
  ON public.child_audit_record_attachment
  FOR INSERT
  WITH CHECK (client_id = public.get_current_user_client_id());

DROP POLICY IF EXISTS "Users can update child audit record attachment from their client" ON public.child_audit_record_attachment;
CREATE POLICY "Users can update child audit record attachment from their client"
  ON public.child_audit_record_attachment
  FOR UPDATE
  USING (client_id = public.get_current_user_client_id())
  WITH CHECK (client_id = public.get_current_user_client_id());

DROP POLICY IF EXISTS "Users can delete child audit record attachment from their client" ON public.child_audit_record_attachment;
CREATE POLICY "Users can delete child audit record attachment from their client"
  ON public.child_audit_record_attachment
  FOR DELETE
  USING (client_id = public.get_current_user_client_id());
