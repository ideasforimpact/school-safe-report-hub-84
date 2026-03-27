-- Child Audit: main record table + audit log with triggers (insert / update / delete)
-- Lookup tables: child_check_type, child_audit_physical_condition, child_audit_behaviour,
-- child_audit_meltdown, child_audit_aggression (from prior migration)

-- ---------------------------------------------------------------------------
-- 1) Main table: child_audit_records
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'child_audit_records'
  ) THEN
    CREATE TABLE public.child_audit_records (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
      student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
      employee_id uuid NULL REFERENCES public.employees(id) ON DELETE SET NULL,
      check_type_id uuid NULL REFERENCES public.child_check_type(id) ON DELETE SET NULL,
      physical_condition_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
      behaviour_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
      meltdown_occurred boolean NOT NULL DEFAULT false,
      aggression_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
      notes text NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    COMMENT ON TABLE public.child_audit_records IS 'Child Audit form submissions (check type, conditions, behaviour, meltdown, aggression, notes)';

    CREATE INDEX IF NOT EXISTS idx_child_audit_records_client_id
      ON public.child_audit_records (client_id);
    CREATE INDEX IF NOT EXISTS idx_child_audit_records_student_id
      ON public.child_audit_records (student_id);
    CREATE INDEX IF NOT EXISTS idx_child_audit_records_employee_id
      ON public.child_audit_records (employee_id);
    CREATE INDEX IF NOT EXISTS idx_child_audit_records_created_at
      ON public.child_audit_records (client_id, created_at DESC);
  END IF;
END $$;

DROP TRIGGER IF EXISTS set_updated_at_child_audit_records ON public.child_audit_records;
CREATE TRIGGER set_updated_at_child_audit_records
  BEFORE UPDATE ON public.child_audit_records
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 2) Audit log: child_audit_record_audit_log (one row per change event)
--    record_id SET NULL on record delete so history is kept with snapshots
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'child_audit_record_audit_log'
  ) THEN
    CREATE TABLE public.child_audit_record_audit_log (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      record_id uuid NULL REFERENCES public.child_audit_records(id) ON DELETE SET NULL,
      client_id uuid NULL REFERENCES public.clients(id) ON DELETE CASCADE,
      field_changed text NOT NULL,
      old_value text NULL,
      new_value text NULL,
      changed_by uuid NOT NULL,
      changed_at timestamptz NOT NULL DEFAULT now(),
      change_type text NOT NULL DEFAULT 'update',
      description text NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      changes jsonb NOT NULL DEFAULT '[]'::jsonb,
      CONSTRAINT child_audit_record_audit_log_change_type_chk
        CHECK (change_type = ANY (ARRAY['insert'::text, 'update'::text, 'delete'::text]))
    );

    COMMENT ON TABLE public.child_audit_record_audit_log IS 'Audit trail for child_audit_records (insert, field updates, delete)';

    CREATE INDEX IF NOT EXISTS idx_child_audit_record_audit_log_record_id
      ON public.child_audit_record_audit_log (record_id);
    CREATE INDEX IF NOT EXISTS idx_child_audit_record_audit_log_client_changed_at
      ON public.child_audit_record_audit_log (client_id, changed_at DESC);
    CREATE INDEX IF NOT EXISTS idx_child_audit_record_audit_log_changed_by
      ON public.child_audit_record_audit_log (changed_by);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3) Trigger function: log every insert / update / delete
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_child_audit_record_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_changed_by uuid;
  v_client_id uuid;
  v_changes jsonb := '[]'::jsonb;
  v_entry jsonb;
  v_snapshot jsonb;
BEGIN
  v_changed_by := COALESCE(
    NULLIF(trim(current_setting('request.jwt.claims', true)::json->>'sub'), '')::uuid,
    (SELECT e.user_id FROM public.employees e WHERE e.id = COALESCE(NEW.employee_id, OLD.employee_id) LIMIT 1)
  );
  IF v_changed_by IS NULL THEN
    v_changed_by := '00000000-0000-0000-0000-000000000000'::uuid;
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_client_id := NEW.client_id;
    v_snapshot := jsonb_build_object(
      'id', NEW.id,
      'client_id', NEW.client_id,
      'student_id', NEW.student_id,
      'employee_id', NEW.employee_id,
      'check_type_id', NEW.check_type_id,
      'physical_condition_ids', to_jsonb(NEW.physical_condition_ids),
      'behaviour_ids', to_jsonb(NEW.behaviour_ids),
      'meltdown_occurred', NEW.meltdown_occurred,
      'aggression_ids', to_jsonb(NEW.aggression_ids),
      'notes', NEW.notes,
      'created_at', NEW.created_at,
      'updated_at', NEW.updated_at
    );
    v_changes := jsonb_build_array(jsonb_build_object('snapshot', v_snapshot));

    INSERT INTO public.child_audit_record_audit_log (
      record_id, client_id, field_changed, old_value, new_value,
      changed_by, change_type, description, changes
    ) VALUES (
      NEW.id, v_client_id, 'record', NULL, NULL,
      v_changed_by, 'insert', 'Child audit record created', v_changes
    );
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    v_client_id := NEW.client_id;

    IF OLD.client_id IS DISTINCT FROM NEW.client_id THEN
      v_entry := jsonb_build_object(
        'field', 'client_id', 'old_value', OLD.client_id::text, 'new_value', NEW.client_id::text,
        'description', 'Client changed'
      );
      v_changes := v_changes || jsonb_build_array(v_entry);
    END IF;
    IF OLD.student_id IS DISTINCT FROM NEW.student_id THEN
      v_entry := jsonb_build_object(
        'field', 'student_id', 'old_value', OLD.student_id::text, 'new_value', NEW.student_id::text,
        'description', 'Student changed'
      );
      v_changes := v_changes || jsonb_build_array(v_entry);
    END IF;
    IF OLD.employee_id IS DISTINCT FROM NEW.employee_id THEN
      v_entry := jsonb_build_object(
        'field', 'employee_id', 'old_value', OLD.employee_id::text, 'new_value', NEW.employee_id::text,
        'description', 'Employee changed'
      );
      v_changes := v_changes || jsonb_build_array(v_entry);
    END IF;
    IF OLD.check_type_id IS DISTINCT FROM NEW.check_type_id THEN
      v_entry := jsonb_build_object(
        'field', 'check_type_id', 'old_value', OLD.check_type_id::text, 'new_value', NEW.check_type_id::text,
        'description', 'Check type changed'
      );
      v_changes := v_changes || jsonb_build_array(v_entry);
    END IF;
    IF OLD.physical_condition_ids IS DISTINCT FROM NEW.physical_condition_ids THEN
      v_entry := jsonb_build_object(
        'field', 'physical_condition_ids',
        'old_value', to_jsonb(OLD.physical_condition_ids),
        'new_value', to_jsonb(NEW.physical_condition_ids),
        'description', 'Physical condition selection changed'
      );
      v_changes := v_changes || jsonb_build_array(v_entry);
    END IF;
    IF OLD.behaviour_ids IS DISTINCT FROM NEW.behaviour_ids THEN
      v_entry := jsonb_build_object(
        'field', 'behaviour_ids',
        'old_value', to_jsonb(OLD.behaviour_ids),
        'new_value', to_jsonb(NEW.behaviour_ids),
        'description', 'Behaviour selection changed'
      );
      v_changes := v_changes || jsonb_build_array(v_entry);
    END IF;
    IF OLD.meltdown_occurred IS DISTINCT FROM NEW.meltdown_occurred THEN
      v_entry := jsonb_build_object(
        'field', 'meltdown_occurred',
        'old_value', to_jsonb(OLD.meltdown_occurred),
        'new_value', to_jsonb(NEW.meltdown_occurred),
        'description', 'Meltdown flag changed'
      );
      v_changes := v_changes || jsonb_build_array(v_entry);
    END IF;
    IF OLD.aggression_ids IS DISTINCT FROM NEW.aggression_ids THEN
      v_entry := jsonb_build_object(
        'field', 'aggression_ids',
        'old_value', to_jsonb(OLD.aggression_ids),
        'new_value', to_jsonb(NEW.aggression_ids),
        'description', 'Aggression selection changed'
      );
      v_changes := v_changes || jsonb_build_array(v_entry);
    END IF;
    IF OLD.notes IS DISTINCT FROM NEW.notes THEN
      v_entry := jsonb_build_object(
        'field', 'notes', 'old_value', OLD.notes, 'new_value', NEW.notes,
        'description', 'Notes updated'
      );
      v_changes := v_changes || jsonb_build_array(v_entry);
    END IF;
    IF OLD.created_at IS DISTINCT FROM NEW.created_at THEN
      v_entry := jsonb_build_object(
        'field', 'created_at', 'old_value', OLD.created_at::text, 'new_value', NEW.created_at::text,
        'description', 'created_at changed'
      );
      v_changes := v_changes || jsonb_build_array(v_entry);
    END IF;
    IF OLD.updated_at IS DISTINCT FROM NEW.updated_at THEN
      v_entry := jsonb_build_object(
        'field', 'updated_at', 'old_value', OLD.updated_at::text, 'new_value', NEW.updated_at::text,
        'description', 'updated_at changed'
      );
      v_changes := v_changes || jsonb_build_array(v_entry);
    END IF;

    IF jsonb_array_length(v_changes) > 0 THEN
      INSERT INTO public.child_audit_record_audit_log (
        record_id, client_id, field_changed, old_value, new_value,
        changed_by, change_type, description, changes
      ) VALUES (
        NEW.id, v_client_id, 'multiple_fields', NULL, NULL,
        v_changed_by, 'update', 'Child audit record updated', v_changes
      );
    END IF;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    v_client_id := OLD.client_id;
    v_snapshot := jsonb_build_object(
      'id', OLD.id,
      'client_id', OLD.client_id,
      'student_id', OLD.student_id,
      'employee_id', OLD.employee_id,
      'check_type_id', OLD.check_type_id,
      'physical_condition_ids', to_jsonb(OLD.physical_condition_ids),
      'behaviour_ids', to_jsonb(OLD.behaviour_ids),
      'meltdown_occurred', OLD.meltdown_occurred,
      'aggression_ids', to_jsonb(OLD.aggression_ids),
      'notes', OLD.notes,
      'created_at', OLD.created_at,
      'updated_at', OLD.updated_at
    );
    v_changes := jsonb_build_array(jsonb_build_object('snapshot', v_snapshot, 'deleted_record_id', OLD.id));

    INSERT INTO public.child_audit_record_audit_log (
      record_id, client_id, field_changed, old_value, new_value,
      changed_by, change_type, description, changes
    ) VALUES (
      OLD.id, v_client_id, 'record', NULL, NULL,
      v_changed_by, 'delete', 'Child audit record deleted', v_changes
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$function$;

DROP TRIGGER IF EXISTS trg_child_audit_records_audit_insert ON public.child_audit_records;
CREATE TRIGGER trg_child_audit_records_audit_insert
  AFTER INSERT ON public.child_audit_records
  FOR EACH ROW
  EXECUTE FUNCTION public.log_child_audit_record_change();

DROP TRIGGER IF EXISTS trg_child_audit_records_audit_update ON public.child_audit_records;
CREATE TRIGGER trg_child_audit_records_audit_update
  AFTER UPDATE ON public.child_audit_records
  FOR EACH ROW
  EXECUTE FUNCTION public.log_child_audit_record_change();

DROP TRIGGER IF EXISTS trg_child_audit_records_audit_delete ON public.child_audit_records;
CREATE TRIGGER trg_child_audit_records_audit_delete
  BEFORE DELETE ON public.child_audit_records
  FOR EACH ROW
  EXECUTE FUNCTION public.log_child_audit_record_change();

-- ---------------------------------------------------------------------------
-- 4) RLS: same client scope as student_well_begin_management
--    Audit rows are inserted only by trigger (SECURITY DEFINER); no INSERT policy on log table
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'child_audit_records'
  ) THEN
    ALTER TABLE public.child_audit_records ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Allow authentication function access" ON public.child_audit_records;
    BEGIN
      CREATE POLICY "Allow authentication function access" ON public.child_audit_records
      FOR SELECT USING (
        current_setting('role'::text) = 'authenticated'::text
        OR current_setting('role'::text) = 'anon'::text
        OR current_setting('role'::text) = 'postgres'::text
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    DROP POLICY IF EXISTS "Users can view child audit records from their client" ON public.child_audit_records;
    BEGIN
      CREATE POLICY "Users can view child audit records from their client" ON public.child_audit_records
      FOR SELECT USING (
        auth.uid() IS NOT NULL
        AND (
          client_id = public.get_current_user_client_id()
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    DROP POLICY IF EXISTS "Users can insert child audit records for their client" ON public.child_audit_records;
    BEGIN
      CREATE POLICY "Users can insert child audit records for their client" ON public.child_audit_records
      FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
        AND (
          client_id = public.get_current_user_client_id()
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    DROP POLICY IF EXISTS "Users can update child audit records from their client" ON public.child_audit_records;
    BEGIN
      CREATE POLICY "Users can update child audit records from their client" ON public.child_audit_records
      FOR UPDATE USING (
        auth.uid() IS NOT NULL
        AND (
          client_id = public.get_current_user_client_id()
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;

    DROP POLICY IF EXISTS "Users can delete child audit records from their client" ON public.child_audit_records;
    BEGIN
      CREATE POLICY "Users can delete child audit records from their client" ON public.child_audit_records
      FOR DELETE USING (
        auth.uid() IS NOT NULL
        AND (
          client_id = public.get_current_user_client_id()
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'child_audit_record_audit_log'
  ) THEN
    ALTER TABLE public.child_audit_record_audit_log ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can view child audit record audit log from their client" ON public.child_audit_record_audit_log;
    BEGIN
      CREATE POLICY "Users can view child audit record audit log from their client" ON public.child_audit_record_audit_log
      FOR SELECT USING (
        auth.uid() IS NOT NULL
        AND (
          client_id = public.get_current_user_client_id()
          OR public.is_current_user_backoffice_admin() = true
        )
      );
    EXCEPTION WHEN duplicate_object THEN NULL; WHEN OTHERS THEN NULL; END;
  END IF;
END $$;
