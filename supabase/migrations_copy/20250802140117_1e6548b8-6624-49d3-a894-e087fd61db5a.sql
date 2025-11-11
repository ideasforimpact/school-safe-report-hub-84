-- Create assessment_audit_log table
CREATE TABLE IF NOT EXISTS public.assessment_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL,
  client_id UUID,
  field_changed TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  change_type TEXT NOT NULL DEFAULT 'field_update',
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable Row Level Security
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'assessment_audit_log'
  ) THEN
    ALTER TABLE public.assessment_audit_log ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create RLS policies for assessment_audit_log
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'assessment_audit_log'
  ) THEN
    DROP POLICY IF EXISTS "Users can view assessment audit logs from their client" ON public.assessment_audit_log;
    CREATE POLICY "Users can view assessment audit logs from their client"
    ON public.assessment_audit_log
    FOR SELECT
    USING (
      (auth.uid() IS NOT NULL) AND (
        (client_id = get_current_user_client_id()) OR 
        (is_current_user_backoffice_admin() = true)
      )
    );

    DROP POLICY IF EXISTS "Users can insert assessment audit logs for their client" ON public.assessment_audit_log;
    CREATE POLICY "Users can insert assessment audit logs for their client"
    ON public.assessment_audit_log
    FOR INSERT
    WITH CHECK (
      (auth.uid() IS NOT NULL) AND (
        (client_id = get_current_user_client_id()) OR 
        (is_current_user_backoffice_admin() = true)
      )
    );

    DROP POLICY IF EXISTS "Users can update assessment audit logs from their client" ON public.assessment_audit_log;
    CREATE POLICY "Users can update assessment audit logs from their client"
    ON public.assessment_audit_log
    FOR UPDATE
    USING (
      (auth.uid() IS NOT NULL) AND (
        (client_id = get_current_user_client_id()) OR 
        (is_current_user_backoffice_admin() = true)
      )
    );

    DROP POLICY IF EXISTS "Users can delete assessment audit logs from their client" ON public.assessment_audit_log;
    CREATE POLICY "Users can delete assessment audit logs from their client"
    ON public.assessment_audit_log
    FOR DELETE
    USING (
      (auth.uid() IS NOT NULL) AND (
        (client_id = get_current_user_client_id()) OR 
        (is_current_user_backoffice_admin() = true)
      )
    );
  END IF;
END $$;

-- Create function to insert assessment audit log entries
CREATE OR REPLACE FUNCTION public.insert_assessment_audit_log(
  p_assessment_id UUID,
  p_client_id UUID,
  p_field_changed TEXT,
  p_changed_by UUID,
  p_old_value TEXT DEFAULT NULL,
  p_new_value TEXT DEFAULT NULL,
  p_change_type TEXT DEFAULT 'field_update',
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
AS $function$
DECLARE
  audit_id UUID;
BEGIN
  INSERT INTO public.assessment_audit_log (
    assessment_id,
    client_id,
    field_changed,
    old_value,
    new_value,
    changed_by,
    change_type,
    description,
    metadata
  )
  VALUES (
    p_assessment_id,
    p_client_id,
    p_field_changed,
    p_old_value,
    p_new_value,
    p_changed_by,
    p_change_type,
    p_description,
    p_metadata
  )
  RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$function$;

-- Create trigger function to log assessment changes
CREATE OR REPLACE FUNCTION public.log_assessment_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
DECLARE
  changed_by_id UUID;
  assessment_client_id UUID;
BEGIN
  -- Get the user who made the change and client_id
  changed_by_id := COALESCE(
    (current_setting('request.jwt.claims', true)::json->>'sub')::uuid,
    NEW.created_by
  );
  
  -- Get client_id from the assessment
  assessment_client_id := NEW.client_id;

  -- Log status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM public.insert_assessment_audit_log(
      NEW.id,
      assessment_client_id,
      'status',
      changed_by_id,
      OLD.status,
      NEW.status,
      'status_change',
      'Assessment status changed from ' || COALESCE(OLD.status, 'null') || ' to ' || NEW.status
    );
  END IF;

  -- Log assignment changes
  IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
    PERFORM public.insert_assessment_audit_log(
      NEW.id,
      assessment_client_id,
      'assigned_to',
      changed_by_id,
      OLD.assigned_to::text,
      NEW.assigned_to::text,
      'assignment',
      'Assessment assignment changed'
    );
  END IF;

  -- Log completion
  IF OLD.completed_by IS DISTINCT FROM NEW.completed_by THEN
    PERFORM public.insert_assessment_audit_log(
      NEW.id,
      assessment_client_id,
      'completed_by',
      changed_by_id,
      OLD.completed_by::text,
      NEW.completed_by::text,
      'completion',
      'Assessment completed'
    );
  END IF;

  -- Log completion date changes
  IF OLD.completed_on IS DISTINCT FROM NEW.completed_on THEN
    PERFORM public.insert_assessment_audit_log(
      NEW.id,
      assessment_client_id,
      'completed_on',
      changed_by_id,
      OLD.completed_on::text,
      NEW.completed_on::text,
      'completion',
      'Assessment completion date updated'
    );
  END IF;

  -- Log closure comments
  IF OLD.closure_comments IS DISTINCT FROM NEW.closure_comments THEN
    PERFORM public.insert_assessment_audit_log(
      NEW.id,
      assessment_client_id,
      'closure_comments',
      changed_by_id,
      OLD.closure_comments,
      NEW.closure_comments,
      'closure',
      'Assessment closure comments updated'
    );
  END IF;

  -- Log rework comments
  IF OLD.rework_comments IS DISTINCT FROM NEW.rework_comments THEN
    PERFORM public.insert_assessment_audit_log(
      NEW.id,
      assessment_client_id,
      'rework_comments',
      changed_by_id,
      OLD.rework_comments,
      NEW.rework_comments,
      'rework',
      'Assessment rework comments added'
    );
  END IF;

  -- Log score changes
  IF OLD.score IS DISTINCT FROM NEW.score THEN
    PERFORM public.insert_assessment_audit_log(
      NEW.id,
      assessment_client_id,
      'score',
      changed_by_id,
      OLD.score::text,
      NEW.score::text,
      'score_update',
      'Assessment score updated'
    );
  END IF;

  -- Log target completion date changes
  IF OLD.target_completion_date IS DISTINCT FROM NEW.target_completion_date THEN
    PERFORM public.insert_assessment_audit_log(
      NEW.id,
      assessment_client_id,
      'target_completion_date',
      changed_by_id,
      OLD.target_completion_date::text,
      NEW.target_completion_date::text,
      'date_update',
      'Assessment target completion date updated'
    );
  END IF;

  -- Log name changes
  IF OLD.name IS DISTINCT FROM NEW.name THEN
    PERFORM public.insert_assessment_audit_log(
      NEW.id,
      assessment_client_id,
      'name',
      changed_by_id,
      OLD.name,
      NEW.name,
      'name_update',
      'Assessment name updated'
    );
  END IF;

  -- Log description changes
  IF OLD.description IS DISTINCT FROM NEW.description THEN
    PERFORM public.insert_assessment_audit_log(
      NEW.id,
      assessment_client_id,
      'description',
      changed_by_id,
      OLD.description,
      NEW.description,
      'description_update',
      'Assessment description updated'
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- Create trigger for assessment changes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'assessments'
  ) THEN
    DROP TRIGGER IF EXISTS assessment_audit_trigger ON public.assessments;
    CREATE TRIGGER assessment_audit_trigger
      AFTER UPDATE ON public.assessments
      FOR EACH ROW
      EXECUTE FUNCTION public.log_assessment_change();
  END IF;
END $$;

-- Create trigger for assessment creation
CREATE OR REPLACE FUNCTION public.log_assessment_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $function$
DECLARE
  created_by_id UUID;
BEGIN
  -- Get the user who created the assessment
  created_by_id := COALESCE(
    (current_setting('request.jwt.claims', true)::json->>'sub')::uuid,
    NEW.created_by
  );
  
  -- Log assessment creation
  PERFORM public.insert_assessment_audit_log(
    NEW.id,
    NEW.client_id,
    'assessment',
    created_by_id,
    NULL,
    NEW.name,
    'creation',
    'Assessment created'
  );

  RETURN NEW;
END;
$function$;

-- Create trigger for assessment creation
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'assessments'
  ) THEN
    DROP TRIGGER IF EXISTS assessment_creation_audit_trigger ON public.assessments;
    CREATE TRIGGER assessment_creation_audit_trigger
      AFTER INSERT ON public.assessments
      FOR EACH ROW
      EXECUTE FUNCTION public.log_assessment_creation();
  END IF;
END $$;