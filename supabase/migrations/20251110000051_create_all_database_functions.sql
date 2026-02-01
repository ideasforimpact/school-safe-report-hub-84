-- Create all database functions from migrations_copy
-- This migration consolidates all function definitions that exist in production
-- but may be missing from the current migrations

-- ============================================
-- Realtime Functions
-- ============================================
-- Function to set replica identity for a table
CREATE OR REPLACE FUNCTION public.set_replica_identity_for_table(
  table_name TEXT,
  identity_type TEXT DEFAULT 'FULL'
) RETURNS VOID AS $$
BEGIN
  EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY %s', table_name, identity_type);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add table to publication
CREATE OR REPLACE FUNCTION public.add_table_to_publication(
  table_name TEXT,
  publication_name TEXT DEFAULT 'supabase_realtime'
) RETURNS VOID AS $$
BEGIN
  EXECUTE format('ALTER PUBLICATION %I ADD TABLE public.%I', publication_name, table_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Incident Audit Functions
-- ============================================
-- Function to insert incident audit log entries (8-parameter version without client_id and changes)
CREATE OR REPLACE FUNCTION public.insert_incident_audit_log(
  p_incident_id UUID,
  p_field_changed TEXT,
  p_changed_by UUID,
  p_old_value TEXT DEFAULT NULL,
  p_new_value TEXT DEFAULT NULL,
  p_change_type TEXT DEFAULT 'action',
  p_description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  audit_id UUID;
BEGIN
  INSERT INTO public.incident_audit_log (
    incident_id, 
    field_changed, 
    old_value, 
    new_value, 
    changed_by, 
    change_type, 
    description
  )
  VALUES (
    p_incident_id, 
    p_field_changed, 
    p_old_value, 
    p_new_value, 
    p_changed_by, 
    p_change_type, 
    p_description
  )
  RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$ LANGUAGE plpgsql;

-- Function to insert incident audit log entries (10-parameter version with client_id and changes)
CREATE OR REPLACE FUNCTION public.insert_incident_audit_log(
  p_incident_id UUID,
  p_client_id UUID,
  p_field_changed TEXT,
  p_changed_by UUID,
  p_old_value TEXT DEFAULT NULL,
  p_new_value TEXT DEFAULT NULL,
  p_change_type TEXT DEFAULT 'action',
  p_description TEXT DEFAULT NULL,
  p_changes JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  audit_id UUID;
BEGIN
  INSERT INTO public.incident_audit_log (
    incident_id, 
    client_id,
    field_changed, 
    old_value, 
    new_value, 
    changed_by, 
    change_type, 
    description,
    changes
  )
  VALUES (
    p_incident_id, 
    p_client_id,
    p_field_changed, 
    p_old_value, 
    p_new_value, 
    p_changed_by, 
    p_change_type, 
    p_description,
    p_changes
  )
  RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to log incident changes
CREATE OR REPLACE FUNCTION public.log_incident_change()
RETURNS TRIGGER AS $$
DECLARE
  changed_by_id UUID;
  incident_client_id UUID;
  changes_json JSONB := '[]'::jsonb;
  change_entry JSONB;
BEGIN
  -- Get the user who made the change and client_id
  changed_by_id := COALESCE(
    (current_setting('request.jwt.claims', true)::json->>'sub')::uuid,
    NEW.created_by
  );
  
  -- Get client_id from the incident
  incident_client_id := NEW.client_id;

  -- Build changes JSON array
  IF OLD.status_id IS DISTINCT FROM NEW.status_id THEN
    change_entry := jsonb_build_object(
      'field', 'status_id',
      'old_value', OLD.status_id::text,
      'new_value', NEW.status_id::text,
      'description', 'Status changed'
    );
    changes_json := changes_json || change_entry;
  END IF;

  IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
    change_entry := jsonb_build_object(
      'field', 'assigned_to',
      'old_value', OLD.assigned_to::text,
      'new_value', NEW.assigned_to::text,
      'description', 'Assignment changed'
    );
    changes_json := changes_json || change_entry;
  END IF;

  IF OLD.priority_id IS DISTINCT FROM NEW.priority_id THEN
    change_entry := jsonb_build_object(
      'field', 'priority_id',
      'old_value', OLD.priority_id::text,
      'new_value', NEW.priority_id::text,
      'description', 'Priority changed'
    );
    changes_json := changes_json || change_entry;
  END IF;

  IF OLD.description IS DISTINCT FROM NEW.description THEN
    change_entry := jsonb_build_object(
      'field', 'description',
      'old_value', OLD.description,
      'new_value', NEW.description,
      'description', 'Description updated'
    );
    changes_json := changes_json || change_entry;
  END IF;

  IF OLD.category_id IS DISTINCT FROM NEW.category_id THEN
    change_entry := jsonb_build_object(
      'field', 'category_id',
      'old_value', OLD.category_id::text,
      'new_value', NEW.category_id::text,
      'description', 'Category changed'
    );
    changes_json := changes_json || change_entry;
  END IF;

  IF OLD.subcategory_id IS DISTINCT FROM NEW.subcategory_id THEN
    change_entry := jsonb_build_object(
      'field', 'subcategory_id',
      'old_value', OLD.subcategory_id::text,
      'new_value', NEW.subcategory_id::text,
      'description', 'Subcategory changed'
    );
    changes_json := changes_json || change_entry;
  END IF;

  IF OLD.location_id IS DISTINCT FROM NEW.location_id THEN
    change_entry := jsonb_build_object(
      'field', 'location_id',
      'old_value', OLD.location_id::text,
      'new_value', NEW.location_id::text,
      'description', 'Location changed'
    );
    changes_json := changes_json || change_entry;
  END IF;

  IF OLD.facility_id IS DISTINCT FROM NEW.facility_id THEN
    change_entry := jsonb_build_object(
      'field', 'facility_id',
      'old_value', OLD.facility_id::text,
      'new_value', NEW.facility_id::text,
      'description', 'Facility changed'
    );
    changes_json := changes_json || change_entry;
  END IF;

  IF OLD.type_id IS DISTINCT FROM NEW.type_id THEN
    change_entry := jsonb_build_object(
      'field', 'type_id',
      'old_value', OLD.type_id::text,
      'new_value', NEW.type_id::text,
      'description', 'Type changed'
    );
    changes_json := changes_json || change_entry;
  END IF;

  -- ADD MISSING FIELD: Date and time tracking
  IF OLD.date IS DISTINCT FROM NEW.date THEN
    change_entry := jsonb_build_object(
      'field', 'date',
      'old_value', OLD.date::text,
      'new_value', NEW.date::text,
      'description', 'Date and time changed'
    );
    changes_json := changes_json || change_entry;
  END IF;

  -- ADD MISSING FIELD: People involved tracking
  IF OLD.people_involved IS DISTINCT FROM NEW.people_involved THEN
    change_entry := jsonb_build_object(
      'field', 'people_involved',
      'old_value', COALESCE(OLD.people_involved::text, '[]'),
      'new_value', COALESCE(NEW.people_involved::text, '[]'),
      'description', 'People involved updated'
    );
    changes_json := changes_json || change_entry;
  END IF;

  -- ADD MISSING FIELD: Supporting documents tracking
  IF OLD.documents IS DISTINCT FROM NEW.documents THEN
    change_entry := jsonb_build_object(
      'field', 'documents',
      'old_value', COALESCE(OLD.documents::text, '[]'),
      'new_value', COALESCE(NEW.documents::text, '[]'),
      'description', 'Supporting documents updated'
    );
    changes_json := changes_json || change_entry;
  END IF;

  IF OLD.root_cause_analysis IS DISTINCT FROM NEW.root_cause_analysis THEN
    change_entry := jsonb_build_object(
      'field', 'root_cause_analysis',
      'old_value', OLD.root_cause_analysis,
      'new_value', NEW.root_cause_analysis,
      'description', 'Root cause analysis updated'
    );
    changes_json := changes_json || change_entry;
  END IF;

  IF OLD.action_taken IS DISTINCT FROM NEW.action_taken THEN
    change_entry := jsonb_build_object(
      'field', 'action_taken',
      'old_value', OLD.action_taken,
      'new_value', NEW.action_taken,
      'description', 'Action taken updated'
    );
    changes_json := changes_json || change_entry;
  END IF;

  -- Only insert if there are actual changes
  IF jsonb_array_length(changes_json) > 0 THEN
    INSERT INTO public.incident_audit_log (
      incident_id, 
      client_id,
      field_changed, 
      changed_by, 
      change_type, 
      description,
      changes
    )
    VALUES (
      NEW.id, 
      incident_client_id,
      'multiple_fields', 
      changed_by_id, 
      'field_update',
      'Incident updated',
      changes_json
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Assessment Audit Functions
-- ============================================
-- Function to insert assessment audit log entries
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

-- Trigger function to log assessment changes
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

-- Trigger function to log assessment creation
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

-- ============================================
-- Form Submission Functions
-- ============================================
-- Trigger function to auto-populate client_id from custom_forms on insert
CREATE OR REPLACE FUNCTION public.set_form_submission_client_id()
RETURNS trigger AS $$
BEGIN
	IF NEW.client_id IS NULL THEN
		SELECT client_id INTO NEW.client_id FROM public.custom_forms WHERE id = NEW.form_id;
	END IF;
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Client Functions
-- ============================================
-- Function to get client domains during authentication
CREATE OR REPLACE FUNCTION public.get_client_domains(p_client_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  -- Fetch only the domain information needed for validation
  SELECT jsonb_build_object(
    'allowed_domains', c.allowed_domains,
    'super_admin_allowed_domain', c.super_admin_allowed_domain,
    'active', c.active
  )
  INTO result
  FROM public.clients c
  WHERE c.id = p_client_id;
  
  -- Return the result or null if client not found
  RETURN COALESCE(result, '{"allowed_domains": null, "super_admin_allowed_domain": null, "active": false}'::jsonb);
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return safe default in case of error
    RETURN '{"allowed_domains": null, "super_admin_allowed_domain": null, "active": false}'::jsonb;
END;
$function$;

-- ============================================
-- Employee Functions
-- ============================================
-- Function to get employee by email for authentication
CREATE OR REPLACE FUNCTION public.get_employee_by_email_for_auth(user_email text)
 RETURNS TABLE(id uuid, email text, client_id uuid, user_id uuid, status boolean, first_name text, last_name text, employee_id text, is_super_admin boolean, department uuid, employee_type uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  -- This function runs with elevated privileges and bypasses RLS
  -- It's specifically designed to work during authentication
  -- Enhanced email matching that handles whitespace and newlines
  -- Check if employees table exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'employees'
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    e.id,
    e.email,
    e.client_id,
    e.user_id,
    e.status,
    e.first_name,
    e.last_name,
    e.employee_id,
    e.is_super_admin,
    e.department,
    e.employee_type
  FROM public.employees e
  WHERE TRIM(BOTH E'\n\r\t ' FROM e.email) = TRIM(BOTH E'\n\r\t ' FROM user_email)
  AND e.status = true
  LIMIT 1;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_employee_by_email_for_auth(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_employee_by_email_for_auth(text) TO anon;

-- Trigger function to clean employee email
CREATE OR REPLACE FUNCTION public.clean_employee_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Clean email on insert/update
  NEW.email = TRIM(BOTH E'\n\r\t ' FROM NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to safely link user_id to employee record
CREATE OR REPLACE FUNCTION public.link_user_to_employee(
  p_user_id uuid,
  p_employee_email text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  employee_record RECORD;
  result jsonb;
BEGIN
  -- Clean the email for comparison
  p_employee_email := TRIM(BOTH E'\n\r\t ' FROM p_employee_email);
  
  -- Find the employee record that matches the email and is not already linked
  SELECT id, client_id, email, first_name, last_name, employee_id, is_super_admin, department, employee_type
  INTO employee_record
  FROM public.employees 
  WHERE TRIM(BOTH E'\n\r\t ' FROM email) = p_employee_email
  AND status = true
  AND user_id IS NULL  -- Only link unlinked employees
  LIMIT 1;
  
  -- If no employee found, return error
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No unlinked employee found with email: ' || p_employee_email,
      'employee_data', null
    );
  END IF;
  
  -- Update the employee record with the user_id (transactional)
  UPDATE public.employees 
  SET user_id = p_user_id,
      updated_at = now()
  WHERE id = employee_record.id;
  
  -- Return success with employee data
  RETURN jsonb_build_object(
    'success', true,
    'error', null,
    'employee_data', jsonb_build_object(
      'id', employee_record.id,
      'clientId', employee_record.client_id,
      'email', employee_record.email,
      'firstName', employee_record.first_name,
      'lastName', employee_record.last_name,
      'employeeId', employee_record.employee_id,
      'isSuperAdmin', employee_record.is_super_admin,
      'department', employee_record.department,
      'employeeType', employee_record.employee_type
    )
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Database error during linking: ' || SQLERRM,
      'employee_data', null
    );
END;
$function$;

-- Function to backfill existing employee user links
CREATE OR REPLACE FUNCTION public.backfill_employee_user_links()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  updated_count integer := 0;
  employee_record RECORD;
  auth_user_record RECORD;
BEGIN
  -- Loop through employees without user_id that have matching auth users
  FOR employee_record IN
    SELECT e.id, e.email, e.first_name, e.last_name
    FROM public.employees e
    WHERE e.user_id IS NULL 
    AND e.status = true
    AND TRIM(BOTH E'\n\r\t ' FROM e.email) != ''
  LOOP
    -- Try to find matching auth user by email
    SELECT au.id
    INTO auth_user_record
    FROM auth.users au
    WHERE TRIM(BOTH E'\n\r\t ' FROM au.email) = TRIM(BOTH E'\n\r\t ' FROM employee_record.email)
    LIMIT 1;
    
    -- If matching auth user found, link them
    IF FOUND THEN
      UPDATE public.employees 
      SET user_id = auth_user_record.id,
          updated_at = now()
      WHERE id = employee_record.id;
      
      updated_count := updated_count + 1;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'updated_count', updated_count,
    'message', 'Successfully backfilled ' || updated_count || ' employee user links'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Error during backfill: ' || SQLERRM,
      'updated_count', updated_count
    );
END;
$$;

-- ============================================
-- Updated At Trigger Functions
-- ============================================
-- Generic trigger function to set updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Alternative updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- Cron Monitoring Functions
-- ============================================
-- These functions match production exactly but handle missing pg_cron extension gracefully
-- Function to check cron job status
CREATE OR REPLACE FUNCTION check_cron_status()
RETURNS TABLE (
  jobid bigint,
  schedule text,
  command text,
  nodename text,
  nodeport integer,
  database text,
  username text,
  active boolean,
  jobname text
) 
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if pg_cron extension and cron.job table exist
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'cron' AND table_name = 'job'
  ) THEN
    RETURN QUERY
    SELECT * FROM cron.job WHERE jobname = 'bank-statement-processing-dev';
  ELSE
    -- Return empty result if extension doesn't exist (matches production behavior when no jobs)
    RETURN;
  END IF;
END;
$$;

-- Function to check recent cron executions
CREATE OR REPLACE FUNCTION check_recent_cron_runs(limit_count integer DEFAULT 10)
RETURNS TABLE (
  jobid bigint,
  runid bigint,
  job_pid integer,
  database text,
  username text,
  command text,
  status text,
  return_message text,
  start_time timestamp with time zone,
  end_time timestamp with time zone
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if pg_cron extension and required tables exist
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'cron' AND table_name = 'job'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'cron' AND table_name = 'job_run_details'
  ) THEN
    RETURN QUERY
    SELECT * FROM cron.job_run_details 
    WHERE jobid IN (SELECT j.jobid FROM cron.job j WHERE j.jobname = 'bank-statement-processing-dev')
    ORDER BY start_time DESC 
    LIMIT limit_count;
  ELSE
    -- Return empty result if extension doesn't exist (matches production behavior when no runs)
    RETURN;
  END IF;
END;
$$;

-- ============================================
-- Password Functions
-- ============================================
-- Function to hash passwords using pgcrypto
CREATE OR REPLACE FUNCTION hash_password(password text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Use pgcrypto to hash password
  -- Use fully qualified function names (pgcrypto is in 'extensions' schema in Supabase)
  RETURN extensions.crypt(password, extensions.gen_salt('bf'));
END;
$$;

-- Function to verify passwords
CREATE OR REPLACE FUNCTION verify_password(email text, password_attempt text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stored_hash text;
BEGIN
  -- Get stored password hash from backoffice_users
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'backoffice_users'
  ) THEN
    SELECT password INTO stored_hash
    FROM public.backoffice_users
    WHERE backoffice_users.email = verify_password.email
    LIMIT 1;
    
    -- If no user found, return false
    IF stored_hash IS NULL THEN
      RETURN false;
    END IF;
    
    -- Verify password using pgcrypto
    -- Use fully qualified function name (pgcrypto is in 'extensions' schema in Supabase)
    RETURN stored_hash = extensions.crypt(password_attempt, stored_hash);
  END IF;
  
  RETURN false;
END;
$$;

-- ============================================
-- Document Encryption/Decryption Functions
-- ============================================
-- Function to encrypt document numbers
CREATE OR REPLACE FUNCTION encrypt_document_number(doc_number text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Use pgcrypto's encrypt function with a secure algorithm
    -- The key is derived from an environment variable or a secure source
    -- Note: In production, use a proper key management solution
    RETURN encode(
        extensions.encrypt(
            doc_number::bytea, 
            current_setting('encrypt.key', true)::bytea, 
            'aes'
        ),
        'hex'
    );
END;
$$;

-- Function to decrypt document numbers
CREATE OR REPLACE FUNCTION decrypt_document_number(encrypted_doc_number text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Decrypt the document number
    RETURN convert_from(
        extensions.decrypt(
            decode(encrypted_doc_number, 'hex'),
            current_setting('encrypt.key', true)::bytea,
            'aes'
        ),
        'UTF8'
    );
EXCEPTION
    WHEN OTHERS THEN
        -- Return the original encrypted value if decryption fails
        RETURN NULL;
END;
$$;

-- Function to get masked document number (shows only last 2 digits)
CREATE OR REPLACE FUNCTION get_masked_document_number(encrypted_doc_number text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    decrypted TEXT;
    doc_length INTEGER;
BEGIN
    decrypted := decrypt_document_number(encrypted_doc_number);
    IF decrypted IS NULL THEN
        RETURN NULL;
    END IF;
    
    doc_length := length(decrypted);
    IF doc_length <= 2 THEN
        RETURN decrypted;
    ELSE
        RETURN repeat('X', doc_length - 2) || right(decrypted, 2);
    END IF;
END;
$$;

-- ============================================
-- Debug Functions
-- ============================================
-- Function to debug auth information
CREATE OR REPLACE FUNCTION debug_auth_info()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT jsonb_build_object(
    'current_setting_jwt_claims', current_setting('request.jwt.claims', true),
    'parsed_jwt_claims', current_setting('request.jwt.claims', true)::json,
    'email_from_jwt', current_setting('request.jwt.claims', true)::json->>'email',
    'auth_uid', auth.uid(),
    'auth_role', auth.role(),
    'backoffice_user_exists', EXISTS (
      SELECT 1 FROM public.backoffice_users 
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    ),
    'is_saas_admin_check', EXISTS (
      SELECT 1 FROM public.backoffice_users 
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
      AND is_saas_admin = true
    )
  );
$$;

-- Function to debug backoffice auth
CREATE OR REPLACE FUNCTION debug_backoffice_auth()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT jsonb_build_object(
    'auth_uid', auth.uid(),
    'auth_role', auth.role(),
    'jwt_claims_raw', current_setting('request.jwt.claims', true),
    'jwt_claims_parsed', 
      CASE 
        WHEN current_setting('request.jwt.claims', true) = '' THEN NULL
        ELSE current_setting('request.jwt.claims', true)::json
      END,
    'email_from_jwt', 
      CASE 
        WHEN current_setting('request.jwt.claims', true) = '' THEN NULL
        ELSE current_setting('request.jwt.claims', true)::json->>'email'
      END,
    'backoffice_user_count', (SELECT count(*) FROM public.backoffice_users),
    'matching_backoffice_user', EXISTS (
      SELECT 1 FROM public.backoffice_users 
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
    ),
    'is_saas_admin_result', public.is_backoffice_admin()
  );
$$;

-- ============================================
-- Trigger Functions for Updated At
-- ============================================
-- Trigger function to update backoffice_users updated_at
CREATE OR REPLACE FUNCTION update_backoffice_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Generic trigger function to update modified column
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Utility Functions
-- ============================================
-- Function to drop module key column (utility function)
CREATE OR REPLACE FUNCTION drop_module_key_column()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Drop the module_key column from client_modules table
  ALTER TABLE public.client_modules DROP COLUMN module_key;
  
  RAISE NOTICE 'Successfully dropped module_key column from client_modules table';
END;
$$;

