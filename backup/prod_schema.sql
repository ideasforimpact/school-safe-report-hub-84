

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgmq" WITH SCHEMA "pgmq";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."add_table_to_publication"("table_name" "text", "publication_name" "text" DEFAULT 'supabase_realtime'::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  EXECUTE format('ALTER PUBLICATION %I ADD TABLE public.%I', publication_name, table_name);
END;
$$;


ALTER FUNCTION "public"."add_table_to_publication"("table_name" "text", "publication_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."backfill_employee_user_links"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."backfill_employee_user_links"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_cron_status"() RETURNS TABLE("jobid" bigint, "schedule" "text", "command" "text", "nodename" "text", "nodeport" integer, "database" "text", "username" "text", "active" boolean, "jobname" "text")
    LANGUAGE "sql"
    AS $$
  SELECT * FROM cron.job WHERE jobname = 'bank-statement-processing-dev';
$$;


ALTER FUNCTION "public"."check_cron_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_recent_cron_runs"("limit_count" integer DEFAULT 10) RETURNS TABLE("jobid" bigint, "runid" bigint, "job_pid" integer, "database" "text", "username" "text", "command" "text", "status" "text", "return_message" "text", "start_time" timestamp with time zone, "end_time" timestamp with time zone)
    LANGUAGE "sql"
    AS $$
  SELECT * FROM cron.job_run_details 
  WHERE jobid IN (SELECT j.jobid FROM cron.job j WHERE j.jobname = 'bank-statement-processing-dev')
  ORDER BY start_time DESC 
  LIMIT limit_count;
$$;


ALTER FUNCTION "public"."check_recent_cron_runs"("limit_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."clean_employee_email"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Clean email on insert/update
  NEW.email = TRIM(BOTH E'\n\r\t ' FROM NEW.email);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."clean_employee_email"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."debug_auth_info"() RETURNS "jsonb"
    LANGUAGE "sql" SECURITY DEFINER
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


ALTER FUNCTION "public"."debug_auth_info"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."debug_backoffice_auth"() RETURNS "jsonb"
    LANGUAGE "sql" SECURITY DEFINER
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


ALTER FUNCTION "public"."debug_backoffice_auth"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrypt_document_number"("encrypted_doc_number" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Decrypt the document number
    RETURN convert_from(
        decrypt(
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


ALTER FUNCTION "public"."decrypt_document_number"("encrypted_doc_number" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."drop_module_key_column"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Drop the module_key column from client_modules table
  ALTER TABLE public.client_modules DROP COLUMN module_key;
  
  RAISE NOTICE 'Successfully dropped module_key column from client_modules table';
END;
$$;


ALTER FUNCTION "public"."drop_module_key_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."encrypt_document_number"("doc_number" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Use pgcrypto's encrypt function with a secure algorithm
    -- The key is derived from an environment variable or a secure source
    -- Note: In production, use a proper key management solution
    RETURN encode(
        encrypt(
            doc_number::bytea, 
            current_setting('encrypt.key', true)::bytea, 
            'aes'
        ),
        'hex'
    );
END;
$$;


ALTER FUNCTION "public"."encrypt_document_number"("doc_number" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enqueue_backoffice_document_verification"("job" "jsonb") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  msg_id bigint;
BEGIN
  -- Check if pgmq is available
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.schemata 
    WHERE schema_name = 'pgmq'
  ) THEN
    RAISE EXCEPTION 'pgmq extension is not available';
  END IF;
  
  SELECT pgmq.send('backoffice_document_verification', job) INTO msg_id;
  RETURN msg_id;
END;
$$;


ALTER FUNCTION "public"."enqueue_backoffice_document_verification"("job" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."enqueue_backoffice_document_verification"("job" "jsonb") IS 'Enqueues a job for processing backoffice document verification comments';



CREATE OR REPLACE FUNCTION "public"."enqueue_compliance_upload"("job" "jsonb") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Check if pgmq is available
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.schemata 
    WHERE schema_name = 'pgmq'
  ) THEN
    RAISE EXCEPTION 'pgmq extension is not available';
  END IF;
  
  RETURN (SELECT pgmq.send('compliance_uploads', job));
END;
$$;


ALTER FUNCTION "public"."enqueue_compliance_upload"("job" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."enqueue_compliance_upload"("job" "jsonb") IS 'Enqueue a job to compliance_uploads queue using pgmq.send(queue, job). Returns message id.';



CREATE OR REPLACE FUNCTION "public"."enqueue_document_comment_operation"("job" "jsonb") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  msg_id bigint;
BEGIN
  -- Check if pgmq is available
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.schemata 
    WHERE schema_name = 'pgmq'
  ) THEN
    RAISE EXCEPTION 'pgmq extension is not available';
  END IF;
  
  SELECT pgmq.send('document_comment_operation', job) INTO msg_id;
  RETURN msg_id;
END;
$$;


ALTER FUNCTION "public"."enqueue_document_comment_operation"("job" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."enqueue_document_comment_operation"("job" "jsonb") IS 'Enqueues a job for processing document comment operations (edit/delete)';



CREATE OR REPLACE FUNCTION "public"."enqueue_employee_document_upload"("job" "jsonb") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  msg_id bigint;
BEGIN
  -- Check if pgmq is available
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.schemata 
    WHERE schema_name = 'pgmq'
  ) THEN
    RAISE EXCEPTION 'pgmq extension is not available';
  END IF;
  
  SELECT pgmq.send('employee_document_uploads', job) INTO msg_id;
  RETURN msg_id;
END;
$$;


ALTER FUNCTION "public"."enqueue_employee_document_upload"("job" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."enqueue_employee_document_upload"("job" "jsonb") IS 'Enqueues a job for processing employee document file uploads';



CREATE OR REPLACE FUNCTION "public"."get_client_domains"("p_client_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."get_client_domains"("p_client_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_current_user_client_id"() RETURNS "uuid"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  result uuid;
BEGIN
  -- Check if employees table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'employees'
  ) THEN
    -- First try to get client_id from user_id match
    SELECT client_id INTO result
    FROM public.employees 
    WHERE user_id = auth.uid() 
    AND status = true
    LIMIT 1;
    
    -- If found, return it
    IF result IS NOT NULL THEN
      RETURN result;
    END IF;
    
    -- Fallback: try to match by email during authentication
    SELECT client_id INTO result
    FROM public.employees 
    WHERE TRIM(BOTH E'\n\r\t ' FROM email) = TRIM(BOTH E'\n\r\t ' FROM (current_setting('request.jwt.claims', true)::json->>'email'))
    AND status = true
    AND user_id IS NULL  -- Only match unlinked employees
    LIMIT 1;
  END IF;
  
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_current_user_client_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_employee_by_email_for_auth"("user_email" "text") RETURNS TABLE("id" "uuid", "email" "text", "client_id" "uuid", "user_id" "uuid", "status" boolean, "first_name" "text", "last_name" "text", "employee_id" "text", "is_super_admin" boolean, "department" "text", "employee_type" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."get_employee_by_email_for_auth"("user_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_masked_document_number"("encrypted_doc_number" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."get_masked_document_number"("encrypted_doc_number" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hash_password"("password" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf'));
END;
$$;


ALTER FUNCTION "public"."hash_password"("password" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_assessment_audit_log"("p_assessment_id" "uuid", "p_client_id" "uuid", "p_field_changed" "text", "p_changed_by" "uuid", "p_old_value" "text" DEFAULT NULL::"text", "p_new_value" "text" DEFAULT NULL::"text", "p_change_type" "text" DEFAULT 'field_update'::"text", "p_description" "text" DEFAULT NULL::"text", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."insert_assessment_audit_log"("p_assessment_id" "uuid", "p_client_id" "uuid", "p_field_changed" "text", "p_changed_by" "uuid", "p_old_value" "text", "p_new_value" "text", "p_change_type" "text", "p_description" "text", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_incident_audit_log"("p_incident_id" "uuid", "p_field_changed" "text", "p_changed_by" "uuid", "p_old_value" "text" DEFAULT NULL::"text", "p_new_value" "text" DEFAULT NULL::"text", "p_change_type" "text" DEFAULT 'action'::"text", "p_description" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."insert_incident_audit_log"("p_incident_id" "uuid", "p_field_changed" "text", "p_changed_by" "uuid", "p_old_value" "text", "p_new_value" "text", "p_change_type" "text", "p_description" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_incident_audit_log"("p_incident_id" "uuid", "p_client_id" "uuid", "p_field_changed" "text", "p_changed_by" "uuid", "p_old_value" "text" DEFAULT NULL::"text", "p_new_value" "text" DEFAULT NULL::"text", "p_change_type" "text" DEFAULT 'action'::"text", "p_description" "text" DEFAULT NULL::"text", "p_changes" "jsonb" DEFAULT NULL::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."insert_incident_audit_log"("p_incident_id" "uuid", "p_client_id" "uuid", "p_field_changed" "text", "p_changed_by" "uuid", "p_old_value" "text", "p_new_value" "text", "p_change_type" "text", "p_description" "text", "p_changes" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_backoffice_admin"() RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
BEGIN
  -- Check if backoffice_users table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'backoffice_users'
  ) THEN
    RETURN EXISTS (
      SELECT 1 
      FROM public.backoffice_users 
      WHERE email = current_setting('request.jwt.claims', true)::json->>'email'
      AND is_saas_admin = true
    );
  END IF;
  
  RETURN false;
END;
$$;


ALTER FUNCTION "public"."is_backoffice_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_backoffice_admin_by_uid"() RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
BEGIN
  -- Check if backoffice_users table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'backoffice_users'
  ) THEN
    RETURN EXISTS (
      SELECT 1 
      FROM public.backoffice_users 
      WHERE id = auth.uid()
      AND is_saas_admin = true
    );
  END IF;
  
  RETURN false;
END;
$$;


ALTER FUNCTION "public"."is_backoffice_admin_by_uid"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_current_user_backoffice_admin"() RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
BEGIN
  -- Check if backoffice_users table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'backoffice_users'
  ) THEN
    RETURN EXISTS (
      SELECT 1 
      FROM public.backoffice_users 
      WHERE (auth_user_id = auth.uid())
      AND is_saas_admin = true
    );
  END IF;
  
  RETURN false;
END;
$$;


ALTER FUNCTION "public"."is_current_user_backoffice_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."link_user_to_employee"("p_user_id" "uuid", "p_employee_email" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
$$;


ALTER FUNCTION "public"."link_user_to_employee"("p_user_id" "uuid", "p_employee_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_assessment_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."log_assessment_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_assessment_creation"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."log_assessment_creation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_incident_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."log_incident_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."pgmq_delete"("queue_name" "text", "msg_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Check if pgmq is available
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.schemata 
    WHERE schema_name = 'pgmq'
  ) THEN
    RAISE EXCEPTION 'pgmq extension is not available';
  END IF;
  
  PERFORM pgmq.delete(queue_name, msg_id);
END;
$$;


ALTER FUNCTION "public"."pgmq_delete"("queue_name" "text", "msg_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."pgmq_read"("queue_name" "text", "vt" integer, "qty" integer) RETURNS TABLE("msg_id" bigint, "message" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Check if pgmq is available
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.schemata 
    WHERE schema_name = 'pgmq'
  ) THEN
    RAISE EXCEPTION 'pgmq extension is not available';
  END IF;
  
  RETURN QUERY
  SELECT r.msg_id, r.message
  FROM pgmq.read(queue_name, vt, qty) as r;
END;
$$;


ALTER FUNCTION "public"."pgmq_read"("queue_name" "text", "vt" integer, "qty" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_form_submission_client_id"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
	IF NEW.client_id IS NULL THEN
		SELECT client_id INTO NEW.client_id FROM public.custom_forms WHERE id = NEW.form_id;
	END IF;
	RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_form_submission_client_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_replica_identity_for_table"("table_name" "text", "identity_type" "text" DEFAULT 'FULL'::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY %s', table_name, identity_type);
END;
$$;


ALTER FUNCTION "public"."set_replica_identity_for_table"("table_name" "text", "identity_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_backoffice_users_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_backoffice_users_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_modified_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_modified_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."verify_password"("email" "text", "password_attempt" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  stored_password TEXT;
BEGIN
  SELECT password INTO stored_password FROM public.backoffice_users WHERE backoffice_users.email = verify_password.email;
  RETURN stored_password = crypt(password_attempt, stored_password);
END;
$$;


ALTER FUNCTION "public"."verify_password"("email" "text", "password_attempt" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."assessment_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assessment_id" "uuid" NOT NULL,
    "client_id" "uuid",
    "field_changed" "text" NOT NULL,
    "old_value" "text",
    "new_value" "text",
    "changed_by" "uuid",
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "change_type" "text" DEFAULT 'field_update'::"text" NOT NULL,
    "description" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."assessment_audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."assessment_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "category_id" "uuid",
    "questions" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."assessment_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."assessments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "template_id" "uuid",
    "status" "text" DEFAULT 'New'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "assigned_to" "uuid",
    "target_completion_date" "date",
    "score" integer DEFAULT 0,
    "assessment_id" integer NOT NULL,
    "answers" "jsonb" DEFAULT '[]'::"jsonb",
    "completed_by" "uuid",
    "completed_on" timestamp with time zone,
    "closure_comments" "text",
    "rework_comments" "text",
    CONSTRAINT "assessments_status_check" CHECK (("status" = ANY (ARRAY['New'::"text", 'Draft'::"text", 'In Progress'::"text", 'Submitted'::"text", 'Completed'::"text"])))
);


ALTER TABLE "public"."assessments" OWNER TO "postgres";


COMMENT ON COLUMN "public"."assessments"."assigned_to" IS 'Employee who is assigned to complete this assessment';



COMMENT ON COLUMN "public"."assessments"."target_completion_date" IS 'Target date for assessment completion';



COMMENT ON COLUMN "public"."assessments"."score" IS 'Score calculated based on number of questions answered for the assessment';



COMMENT ON COLUMN "public"."assessments"."completed_by" IS 'Employee who completed the assessment';



COMMENT ON COLUMN "public"."assessments"."completed_on" IS 'Timestamp when assessment was completed';



COMMENT ON COLUMN "public"."assessments"."closure_comments" IS 'Comments added when completing the assessment';



COMMENT ON COLUMN "public"."assessments"."rework_comments" IS 'Stores comments provided when an assessment is reworked by an admin';



CREATE SEQUENCE IF NOT EXISTS "public"."assessments_assessment_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."assessments_assessment_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."assessments_assessment_id_seq" OWNED BY "public"."assessments"."assessment_id";



CREATE TABLE IF NOT EXISTS "public"."backoffice_edusafe_resource" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "category" "text" NOT NULL,
    "tags" "jsonb" DEFAULT '[]'::"jsonb",
    "document_url" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "uploaded_by" "uuid",
    "client_type_id" "uuid"
);


ALTER TABLE "public"."backoffice_edusafe_resource" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."backoffice_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "password" "text" NOT NULL,
    "is_saas_admin" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_signed_in" timestamp with time zone,
    "auth_user_id" "uuid"
);

ALTER TABLE ONLY "public"."backoffice_users" REPLICA IDENTITY FULL;


ALTER TABLE "public"."backoffice_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."campuses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."campuses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."client_modules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "enabled" boolean DEFAULT true NOT NULL,
    "module_id" "uuid",
    "access_level" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL
);


ALTER TABLE "public"."client_modules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."client_purge_log" (
    "id" bigint NOT NULL,
    "client_id" "uuid" NOT NULL,
    "client_name" "text",
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "finished_at" timestamp with time zone,
    "deleted_counts" "jsonb" DEFAULT '{}'::"jsonb",
    "status" "text" DEFAULT 'started'::"text" NOT NULL,
    "error_message" "text"
);


ALTER TABLE "public"."client_purge_log" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."client_purge_log_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."client_purge_log_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."client_purge_log_id_seq" OWNED BY "public"."client_purge_log"."id";



CREATE TABLE IF NOT EXISTS "public"."client_type" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "key" "text" DEFAULT ''::"text" NOT NULL,
    "name" "text" DEFAULT ''::"text" NOT NULL
);


ALTER TABLE "public"."client_type" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text",
    "contact_person" "text",
    "phone" "text",
    "creation_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "logo" "text",
    "institution_type" "text",
    "allowed_domains" "text",
    "auth_providers" "text",
    "super_admin_allowed_domain" "text",
    "client_type_id" "uuid",
    "client_logo" "text",
    "domains" "jsonb" DEFAULT '[]'::"jsonb"
);


ALTER TABLE "public"."clients" OWNER TO "postgres";


COMMENT ON COLUMN "public"."clients"."super_admin_allowed_domain" IS 'Optional comma-separated list of email domains allowed for super admin access. If NULL, no domain restrictions apply for super admin.';



COMMENT ON COLUMN "public"."clients"."client_logo" IS 'URL or path to the client logo image';



COMMENT ON COLUMN "public"."clients"."domains" IS 'Array of domain objects for the client organization. Each object can contain domain, type, and other metadata.';



CREATE TABLE IF NOT EXISTS "public"."compliance_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "folder_exists" boolean DEFAULT false NOT NULL,
    "folder_id" "uuid",
    "files" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "parent_folder_id" "uuid"
);


ALTER TABLE "public"."compliance_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."configuration_import_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "response_status" "text" NOT NULL,
    "response_code" integer NOT NULL,
    "log" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "configuration_import_logs_response_status_check" CHECK (("response_status" = ANY (ARRAY['success'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."configuration_import_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contributing_factors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "weight" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "client_id" "uuid",
    CONSTRAINT "contributing_factors_weight_check" CHECK (("weight" = ANY (ARRAY['Low'::"text", 'Medium'::"text", 'High'::"text"])))
);


ALTER TABLE "public"."contributing_factors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."custom_forms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "fields" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "excluded_fields" "jsonb" DEFAULT '[]'::"jsonb",
    "client_logo" "text"
);


ALTER TABLE "public"."custom_forms" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."document_status" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."document_status" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."edusafe_resources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "category" "text" NOT NULL,
    "tags" "jsonb" DEFAULT '[]'::"jsonb",
    "document_url" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "uploaded_by" "uuid",
    "client_id" "uuid",
    "youtube_link" "text"
);


ALTER TABLE "public"."edusafe_resources" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_queue" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "module_name" "text" NOT NULL,
    "notification_type" "text" NOT NULL,
    "client_id" "uuid",
    "recipient_email" "text" NOT NULL,
    "recipient_name" "text",
    "subject" "text" NOT NULL,
    "body" "text" NOT NULL,
    "params" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_sent" boolean DEFAULT false NOT NULL,
    "sent_at" timestamp with time zone,
    "error_message" "text",
    "retry_count" integer DEFAULT 0 NOT NULL,
    "max_retries" integer DEFAULT 3 NOT NULL,
    "priority" integer DEFAULT 0 NOT NULL,
    "scheduled_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_remainder_cron_started" boolean DEFAULT false,
    "active" boolean DEFAULT true,
    "is_due_reminder_sent" boolean DEFAULT false
);


ALTER TABLE "public"."email_queue" OWNER TO "postgres";


COMMENT ON COLUMN "public"."email_queue"."is_remainder_cron_started" IS 'Flag to track if remainder cron job has been started for this email';



COMMENT ON COLUMN "public"."email_queue"."active" IS 'Flag to control if this email queue entry is active and should be processed';



COMMENT ON COLUMN "public"."email_queue"."is_due_reminder_sent" IS 'Marks 5th-day assessment reminder sent; overdue uses is_remainder_send';



CREATE TABLE IF NOT EXISTS "public"."employee_document_type" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."employee_document_type" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."employee_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "document_url" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "employee_docs_log" "jsonb" DEFAULT '[]'::"jsonb",
    "document_type_id" "uuid",
    "document_status_id" "uuid",
    "last_otp_generated" timestamp with time zone,
    "verification_status" "text",
    "document_number" "text",
    "params" "jsonb" DEFAULT '{}'::"jsonb",
    "cron_activate" boolean DEFAULT false,
    "cron_activated_date" timestamp with time zone,
    "cron_updated_date" timestamp with time zone,
    "cron_log" "jsonb" DEFAULT '[]'::"jsonb",
    "api_response_data" "jsonb",
    "api_verification_status" "text",
    "api_verification_date" timestamp with time zone,
    "api_verification_method" "text",
    "verified_by" "uuid",
    "reject_reason" "text",
    "documents_files" "jsonb" DEFAULT '[]'::"jsonb",
    "comments" "jsonb",
    "is_delete" integer DEFAULT 0,
    CONSTRAINT "check_api_verification_status" CHECK ((("api_verification_status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'failed'::"text"])) OR ("api_verification_status" IS NULL)))
);


ALTER TABLE "public"."employee_documents" OWNER TO "postgres";


COMMENT ON COLUMN "public"."employee_documents"."cron_activate" IS 'Boolean flag to indicate if cron job is activated for this document';



COMMENT ON COLUMN "public"."employee_documents"."cron_activated_date" IS 'Timestamp when cron job was activated for this document';



COMMENT ON COLUMN "public"."employee_documents"."cron_updated_date" IS 'Timestamp when cron job was last updated for this document';



COMMENT ON COLUMN "public"."employee_documents"."cron_log" IS 'JSON array to store cron job execution logs and history';



COMMENT ON COLUMN "public"."employee_documents"."api_response_data" IS 'Stores the complete API verification response data';



COMMENT ON COLUMN "public"."employee_documents"."api_verification_status" IS 'Status of API verification: pending, completed, failed, or null';



COMMENT ON COLUMN "public"."employee_documents"."api_verification_date" IS 'Timestamp when API verification was performed';



COMMENT ON COLUMN "public"."employee_documents"."api_verification_method" IS 'Method used for API verification: surepass, manual, etc.';



COMMENT ON COLUMN "public"."employee_documents"."reject_reason" IS 'Reason for rejecting the document verification';



CREATE TABLE IF NOT EXISTS "public"."employee_modules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employee_id" "uuid" NOT NULL,
    "module_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "level" "jsonb"
);

ALTER TABLE ONLY "public"."employee_modules" REPLICA IDENTITY FULL;


ALTER TABLE "public"."employee_modules" OWNER TO "postgres";


COMMENT ON TABLE "public"."employee_modules" IS 'Stores module permissions for each employee';



CREATE TABLE IF NOT EXISTS "public"."employees" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "employee_id" "text" NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "employee_type" "text" NOT NULL,
    "department" "text" NOT NULL,
    "joining_date" "text" NOT NULL,
    "status" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "client_id" "uuid",
    "is_super_admin" boolean DEFAULT false NOT NULL,
    "phone" "text",
    "designation" "text"
);


ALTER TABLE "public"."employees" OWNER TO "postgres";


COMMENT ON TABLE "public"."employees" IS 'Stores employee information for the organization';



COMMENT ON COLUMN "public"."employees"."client_id" IS 'Reference to the client this employee belongs to';



CREATE TABLE IF NOT EXISTS "public"."facilities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "campus_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."facilities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."form_fields_type" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "key" "text" NOT NULL
);


ALTER TABLE "public"."form_fields_type" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."form_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "form_id" "uuid" NOT NULL,
    "submitter_name" "text",
    "submitter_email" "text",
    "responses" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "comments" "text",
    "status" "text" DEFAULT 'new'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "client_id" "uuid",
    "submitter_phone" character varying(50),
    "submitter_type" character varying(50),
    "attachments" "jsonb",
    "acknowledged_by_name" "text",
    "acknowledged_at" timestamp with time zone
);


ALTER TABLE "public"."form_submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."grades" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "campus_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."grades" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."incident_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "incident_id" "uuid" NOT NULL,
    "field_changed" "text" NOT NULL,
    "old_value" "text",
    "new_value" "text",
    "changed_by" "uuid" NOT NULL,
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "change_type" "text" DEFAULT 'update'::"text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "client_id" "uuid",
    "changes" "jsonb" DEFAULT '[]'::"jsonb"
);


ALTER TABLE "public"."incident_audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."incident_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."incident_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."incident_priorities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "color" "text",
    "weight" integer,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "client_id" "uuid"
);


ALTER TABLE "public"."incident_priorities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."incident_report_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "client_id" "uuid"
);


ALTER TABLE "public"."incident_report_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."incident_status" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."incident_status" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."incident_subcategories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "category_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "client_id" "uuid"
);


ALTER TABLE "public"."incident_subcategories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."incidents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ticket_id" "text" NOT NULL,
    "type_id" "uuid",
    "category_id" "uuid",
    "subcategory_id" "uuid",
    "description" "text",
    "date" timestamp with time zone NOT NULL,
    "location_id" "uuid",
    "people_involved" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "status_id" "uuid" NOT NULL,
    "priority_id" "uuid",
    "facility_id" "uuid",
    "created_by" "uuid" NOT NULL,
    "assigned_to" "uuid",
    "documents" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "client_id" "uuid",
    "root_cause_analysis" "text",
    "action_taken" "text",
    "contributing_factor" "jsonb",
    "comments" "jsonb" DEFAULT '[]'::"jsonb",
    "reopen" integer DEFAULT 0 NOT NULL,
    "learning_points" "text",
    "recommended_action" "jsonb"
);


ALTER TABLE "public"."incidents" OWNER TO "postgres";


COMMENT ON COLUMN "public"."incidents"."comments" IS 'Stores incident comments as JSON array';



COMMENT ON COLUMN "public"."incidents"."reopen" IS 'Tracks how many times an incident has been reopened. Default 0 means never reopened.';



CREATE TABLE IF NOT EXISTS "public"."modules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "level" "text" NOT NULL,
    "icon" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "order" integer,
    "url" "text",
    "active" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."modules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "module" "text" NOT NULL,
    "type" "text" NOT NULL,
    "recipient_id" "uuid",
    "recipient_email" "text",
    "subject" "text" NOT NULL,
    "body" "text" NOT NULL,
    "status" "text" NOT NULL,
    "error_message" "text",
    "sent_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "email_queue_id" "uuid",
    "remainder_cron_status" boolean DEFAULT false,
    "remainder_cron_logs" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "notification_logs_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'sent'::"text", 'failed'::"text", 'skipped'::"text"])))
);


ALTER TABLE "public"."notification_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "module" "text" NOT NULL,
    "type" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "skip_conditions" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notification_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "module" "text" NOT NULL,
    "type" "text" NOT NULL,
    "subject" "text" NOT NULL,
    "body" "text" NOT NULL,
    "variables" "jsonb" DEFAULT '[]'::"jsonb",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notification_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "key" "text" NOT NULL,
    "description" "text",
    "active" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "grade_id" "uuid" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "campus_id" "uuid"
);


ALTER TABLE "public"."sections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."students" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "student_id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "grade" "text" NOT NULL,
    "section" "text" NOT NULL,
    "campus" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "client_id" "uuid"
);


ALTER TABLE "public"."students" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."template_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."template_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vehicle_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "vehicle_id" "uuid" NOT NULL,
    "documents" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."vehicle_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vehicles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "registration_number" "text" NOT NULL,
    "type" "text" NOT NULL,
    "make" "text" NOT NULL,
    "model" "text" NOT NULL,
    "year" integer NOT NULL,
    "driver" "text" NOT NULL,
    "route" "text",
    "capacity" integer,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "client_id" "uuid",
    "verification_status" "text",
    "verification_date" timestamp with time zone,
    "verification_data" "jsonb",
    "employee_id" "uuid"
);


ALTER TABLE "public"."vehicles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."assessments" ALTER COLUMN "assessment_id" SET DEFAULT "nextval"('"public"."assessments_assessment_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."client_purge_log" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."client_purge_log_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."assessment_audit_log"
    ADD CONSTRAINT "assessment_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assessment_templates"
    ADD CONSTRAINT "assessment_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assessments"
    ADD CONSTRAINT "assessments_assessment_id_unique" UNIQUE ("assessment_id");



ALTER TABLE ONLY "public"."assessments"
    ADD CONSTRAINT "assessments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."backoffice_edusafe_resource"
    ADD CONSTRAINT "backoffice_edusafe_resource_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."backoffice_users"
    ADD CONSTRAINT "backoffice_users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."backoffice_users"
    ADD CONSTRAINT "backoffice_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."campuses"
    ADD CONSTRAINT "campuses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."client_modules"
    ADD CONSTRAINT "client_modules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."client_purge_log"
    ADD CONSTRAINT "client_purge_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."client_type"
    ADD CONSTRAINT "client_type_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."compliance_documents"
    ADD CONSTRAINT "compliance_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."configuration_import_logs"
    ADD CONSTRAINT "configuration_import_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contributing_factors"
    ADD CONSTRAINT "contributing_factors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."custom_forms"
    ADD CONSTRAINT "custom_forms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_status"
    ADD CONSTRAINT "document_status_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."document_status"
    ADD CONSTRAINT "document_status_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."edusafe_resources"
    ADD CONSTRAINT "edusafe_resources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_queue"
    ADD CONSTRAINT "email_queue_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employee_document_type"
    ADD CONSTRAINT "employee_document_type_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."employee_document_type"
    ADD CONSTRAINT "employee_document_type_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employee_documents"
    ADD CONSTRAINT "employee_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employee_modules"
    ADD CONSTRAINT "employee_modules_employee_id_module_id_key" UNIQUE ("employee_id", "module_id");



ALTER TABLE ONLY "public"."employee_modules"
    ADD CONSTRAINT "employee_modules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_employee_id_client_id_key" UNIQUE ("employee_id", "client_id");



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."facilities"
    ADD CONSTRAINT "facilities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."form_fields_type"
    ADD CONSTRAINT "form_fields_type_key_unique" UNIQUE ("key");



ALTER TABLE ONLY "public"."form_fields_type"
    ADD CONSTRAINT "form_fields_type_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."form_submissions"
    ADD CONSTRAINT "form_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."grades"
    ADD CONSTRAINT "grades_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."incident_audit_log"
    ADD CONSTRAINT "incident_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."incident_categories"
    ADD CONSTRAINT "incident_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."incident_priorities"
    ADD CONSTRAINT "incident_priorities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."incident_report_types"
    ADD CONSTRAINT "incident_report_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."incident_status"
    ADD CONSTRAINT "incident_status_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."incident_status"
    ADD CONSTRAINT "incident_status_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."incident_subcategories"
    ADD CONSTRAINT "incident_subcategories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."incidents"
    ADD CONSTRAINT "incidents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "modules_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "modules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."modules"
    ADD CONSTRAINT "modules_pkey1" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_logs"
    ADD CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_rules"
    ADD CONSTRAINT "notification_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_templates"
    ADD CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sections"
    ADD CONSTRAINT "sections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."template_categories"
    ADD CONSTRAINT "template_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vehicle_documents"
    ADD CONSTRAINT "vehicle_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id");



CREATE INDEX "employees_client_id_idx" ON "public"."employees" USING "btree" ("client_id");



CREATE INDEX "idx_backoffice_edusafe_resource_client_type_id" ON "public"."backoffice_edusafe_resource" USING "btree" ("client_type_id");



CREATE INDEX "idx_backoffice_users_auth_user_id" ON "public"."backoffice_users" USING "btree" ("auth_user_id");



CREATE INDEX "idx_campuses_client_id" ON "public"."campuses" USING "btree" ("client_id");



CREATE INDEX "idx_client_purge_log_client_id" ON "public"."client_purge_log" USING "btree" ("client_id");



CREATE INDEX "idx_client_purge_log_started_at" ON "public"."client_purge_log" USING "btree" ("started_at");



CREATE INDEX "idx_clients_domains" ON "public"."clients" USING "gin" ("domains");



CREATE INDEX "idx_compliance_documents_client" ON "public"."compliance_documents" USING "btree" ("client_id");



CREATE INDEX "idx_compliance_documents_created_by" ON "public"."compliance_documents" USING "btree" ("created_by");



CREATE INDEX "idx_compliance_documents_parent" ON "public"."compliance_documents" USING "btree" ("parent_folder_id");



CREATE INDEX "idx_configuration_import_logs_client_time" ON "public"."configuration_import_logs" USING "btree" ("client_id", "created_at" DESC);



CREATE INDEX "idx_email_queue_active" ON "public"."email_queue" USING "btree" ("active");



CREATE INDEX "idx_email_queue_client_id" ON "public"."email_queue" USING "btree" ("client_id");



CREATE INDEX "idx_email_queue_is_remainder_cron_started" ON "public"."email_queue" USING "btree" ("is_remainder_cron_started");



CREATE INDEX "idx_email_queue_is_sent" ON "public"."email_queue" USING "btree" ("is_sent");



CREATE INDEX "idx_email_queue_module_type" ON "public"."email_queue" USING "btree" ("module_name", "notification_type");



CREATE INDEX "idx_email_queue_priority" ON "public"."email_queue" USING "btree" ("priority");



CREATE INDEX "idx_email_queue_scheduled_at" ON "public"."email_queue" USING "btree" ("scheduled_at");



CREATE INDEX "idx_employee_documents_verified_by" ON "public"."employee_documents" USING "btree" ("verified_by");



CREATE INDEX "idx_employees_client_id" ON "public"."employees" USING "btree" ("client_id");



CREATE INDEX "idx_employees_email" ON "public"."employees" USING "btree" ("email");



CREATE INDEX "idx_employees_user_id" ON "public"."employees" USING "btree" ("user_id");



CREATE INDEX "idx_facilities_campus_id" ON "public"."facilities" USING "btree" ("campus_id");



CREATE INDEX "idx_facilities_client_id" ON "public"."facilities" USING "btree" ("client_id");



CREATE INDEX "idx_form_submissions_client_id" ON "public"."form_submissions" USING "btree" ("client_id");



CREATE INDEX "idx_incident_audit_log_changed_at" ON "public"."incident_audit_log" USING "btree" ("changed_at" DESC);



CREATE INDEX "idx_incident_audit_log_changed_by" ON "public"."incident_audit_log" USING "btree" ("changed_by");



CREATE INDEX "idx_incident_audit_log_client_id" ON "public"."incident_audit_log" USING "btree" ("client_id");



CREATE INDEX "idx_incident_audit_log_incident_id" ON "public"."incident_audit_log" USING "btree" ("incident_id");



CREATE INDEX "idx_incident_categories_client_id" ON "public"."incident_categories" USING "btree" ("client_id");



CREATE INDEX "idx_incident_priorities_client_id" ON "public"."incident_priorities" USING "btree" ("client_id");



CREATE INDEX "idx_incident_report_types_client_id" ON "public"."incident_report_types" USING "btree" ("client_id");



CREATE INDEX "idx_incident_subcategories_category_id" ON "public"."incident_subcategories" USING "btree" ("category_id");



CREATE INDEX "idx_incident_subcategories_client_id" ON "public"."incident_subcategories" USING "btree" ("client_id");



CREATE INDEX "idx_incidents_assigned_to" ON "public"."incidents" USING "btree" ("assigned_to");



CREATE INDEX "idx_incidents_category_id" ON "public"."incidents" USING "btree" ("category_id");



CREATE INDEX "idx_incidents_client_created" ON "public"."incidents" USING "btree" ("client_id", "created_at" DESC);



CREATE INDEX "idx_incidents_client_id" ON "public"."incidents" USING "btree" ("client_id");



CREATE INDEX "idx_incidents_client_status" ON "public"."incidents" USING "btree" ("client_id", "status_id");



CREATE INDEX "idx_incidents_created_at" ON "public"."incidents" USING "btree" ("created_at");



CREATE INDEX "idx_incidents_created_by" ON "public"."incidents" USING "btree" ("created_by");



CREATE INDEX "idx_incidents_location_id" ON "public"."incidents" USING "btree" ("location_id");



CREATE INDEX "idx_incidents_priority_id" ON "public"."incidents" USING "btree" ("priority_id");



CREATE INDEX "idx_incidents_status_id" ON "public"."incidents" USING "btree" ("status_id");



CREATE INDEX "idx_incidents_type_id" ON "public"."incidents" USING "btree" ("type_id");



CREATE INDEX "idx_notification_logs_created_at" ON "public"."notification_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_notification_logs_email_queue_id" ON "public"."notification_logs" USING "btree" ("email_queue_id");



CREATE INDEX "idx_notification_logs_module_type" ON "public"."notification_logs" USING "btree" ("module", "type");



CREATE INDEX "idx_notification_logs_recipient" ON "public"."notification_logs" USING "btree" ("recipient_id");



CREATE INDEX "idx_notification_logs_remainder_cron_status" ON "public"."notification_logs" USING "btree" ("remainder_cron_status");



CREATE INDEX "idx_notification_logs_remainder_cron_status_false" ON "public"."notification_logs" USING "btree" ("remainder_cron_status") WHERE ("remainder_cron_status" = false);



CREATE INDEX "idx_notification_logs_status" ON "public"."notification_logs" USING "btree" ("status");



CREATE INDEX "idx_notification_rules_active" ON "public"."notification_rules" USING "btree" ("is_active");



CREATE INDEX "idx_notification_rules_module_type" ON "public"."notification_rules" USING "btree" ("module", "type");



CREATE INDEX "idx_notification_templates_active" ON "public"."notification_templates" USING "btree" ("is_active");



CREATE INDEX "idx_notification_templates_module_type" ON "public"."notification_templates" USING "btree" ("module", "type");



CREATE INDEX "idx_sections_campus_id" ON "public"."sections" USING "btree" ("campus_id");



CREATE INDEX "idx_students_client_id" ON "public"."students" USING "btree" ("client_id");



CREATE INDEX "idx_vehicles_employee_id" ON "public"."vehicles" USING "btree" ("employee_id");



CREATE INDEX "incident_categories_client_id_idx" ON "public"."incident_categories" USING "btree" ("client_id");



CREATE INDEX "incident_subcategories_category_id_idx" ON "public"."incident_subcategories" USING "btree" ("category_id");



CREATE INDEX "incidents_people_involved_idx" ON "public"."incidents" USING "gin" ("people_involved");



CREATE INDEX "students_client_id_idx" ON "public"."students" USING "btree" ("client_id");



CREATE OR REPLACE TRIGGER "assessment_audit_trigger" AFTER UPDATE ON "public"."assessments" FOR EACH ROW EXECUTE FUNCTION "public"."log_assessment_change"();



CREATE OR REPLACE TRIGGER "assessment_creation_audit_trigger" AFTER INSERT ON "public"."assessments" FOR EACH ROW EXECUTE FUNCTION "public"."log_assessment_creation"();



CREATE OR REPLACE TRIGGER "clean_employee_email_trigger" BEFORE INSERT OR UPDATE ON "public"."employees" FOR EACH ROW EXECUTE FUNCTION "public"."clean_employee_email"();



CREATE OR REPLACE TRIGGER "set_timestamp_contributing_factors" BEFORE UPDATE ON "public"."contributing_factors" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."employee_documents" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."vehicle_documents" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."vehicles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trg_compliance_documents_updated_at" BEFORE UPDATE ON "public"."compliance_documents" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_set_form_submission_client_id" BEFORE INSERT ON "public"."form_submissions" FOR EACH ROW EXECUTE FUNCTION "public"."set_form_submission_client_id"();



CREATE OR REPLACE TRIGGER "trigger_log_incident_changes" AFTER UPDATE ON "public"."incidents" FOR EACH ROW EXECUTE FUNCTION "public"."log_incident_change"();



CREATE OR REPLACE TRIGGER "update_assessment_templates_updated_at" BEFORE UPDATE ON "public"."assessment_templates" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_assessments_updated_at" BEFORE UPDATE ON "public"."assessments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_backoffice_users_updated_at_trigger" BEFORE UPDATE ON "public"."backoffice_users" FOR EACH ROW EXECUTE FUNCTION "public"."update_backoffice_users_updated_at"();



CREATE OR REPLACE TRIGGER "update_campuses_updated_at" BEFORE UPDATE ON "public"."campuses" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



CREATE OR REPLACE TRIGGER "update_email_queue_updated_at" BEFORE UPDATE ON "public"."email_queue" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_facilities_updated_at" BEFORE UPDATE ON "public"."facilities" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_grades_updated_at" BEFORE UPDATE ON "public"."grades" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_incident_categories_updated_at" BEFORE UPDATE ON "public"."incident_categories" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_incident_subcategories_updated_at" BEFORE UPDATE ON "public"."incident_subcategories" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_incidents_updated_at" BEFORE UPDATE ON "public"."incidents" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_notification_rules_updated_at" BEFORE UPDATE ON "public"."notification_rules" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_notification_templates_updated_at" BEFORE UPDATE ON "public"."notification_templates" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_sections_updated_at" BEFORE UPDATE ON "public"."sections" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_template_categories_updated_at" BEFORE UPDATE ON "public"."template_categories" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."assessment_templates"
    ADD CONSTRAINT "assessment_templates_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."template_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assessment_templates"
    ADD CONSTRAINT "assessment_templates_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assessment_templates"
    ADD CONSTRAINT "assessment_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assessments"
    ADD CONSTRAINT "assessments_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assessments"
    ADD CONSTRAINT "assessments_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assessments"
    ADD CONSTRAINT "assessments_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assessments"
    ADD CONSTRAINT "assessments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assessments"
    ADD CONSTRAINT "assessments_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."assessment_templates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."backoffice_edusafe_resource"
    ADD CONSTRAINT "backoffice_edusafe_resource_client_type_id_fkey" FOREIGN KEY ("client_type_id") REFERENCES "public"."client_type"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."backoffice_users"
    ADD CONSTRAINT "backoffice_users_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."campuses"
    ADD CONSTRAINT "campuses_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_modules"
    ADD CONSTRAINT "client_modules_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_modules"
    ADD CONSTRAINT "client_modules_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_client_type_id_fkey" FOREIGN KEY ("client_type_id") REFERENCES "public"."client_type"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."compliance_documents"
    ADD CONSTRAINT "compliance_documents_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."compliance_documents"
    ADD CONSTRAINT "compliance_documents_parent_fk" FOREIGN KEY ("parent_folder_id") REFERENCES "public"."compliance_documents"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."configuration_import_logs"
    ADD CONSTRAINT "configuration_import_logs_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contributing_factors"
    ADD CONSTRAINT "contributing_factors_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."custom_forms"
    ADD CONSTRAINT "custom_forms_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."custom_forms"
    ADD CONSTRAINT "custom_forms_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."email_queue"
    ADD CONSTRAINT "email_queue_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employee_documents"
    ADD CONSTRAINT "employee_documents_document_status_id_fkey" FOREIGN KEY ("document_status_id") REFERENCES "public"."document_status"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employee_documents"
    ADD CONSTRAINT "employee_documents_document_type_id_fkey" FOREIGN KEY ("document_type_id") REFERENCES "public"."employee_document_type"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employee_documents"
    ADD CONSTRAINT "employee_documents_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employee_modules"
    ADD CONSTRAINT "employee_modules_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employee_modules"
    ADD CONSTRAINT "employee_modules_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE CASCADE;



COMMENT ON CONSTRAINT "employee_modules_module_id_fkey" ON "public"."employee_modules" IS 'Foreign key reference to modules table instead of roles';



ALTER TABLE ONLY "public"."employees"
    ADD CONSTRAINT "employees_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."facilities"
    ADD CONSTRAINT "facilities_campus_id_fkey" FOREIGN KEY ("campus_id") REFERENCES "public"."campuses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."facilities"
    ADD CONSTRAINT "facilities_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."incident_audit_log"
    ADD CONSTRAINT "fk_incident_audit_log_incident_id" FOREIGN KEY ("incident_id") REFERENCES "public"."incidents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."incidents"
    ADD CONSTRAINT "fk_incident_status" FOREIGN KEY ("status_id") REFERENCES "public"."incident_status"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_logs"
    ADD CONSTRAINT "fk_notification_logs_recipient" FOREIGN KEY ("recipient_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."form_submissions"
    ADD CONSTRAINT "form_submissions_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."form_submissions"
    ADD CONSTRAINT "form_submissions_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "public"."custom_forms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."grades"
    ADD CONSTRAINT "grades_campus_id_fkey" FOREIGN KEY ("campus_id") REFERENCES "public"."campuses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."grades"
    ADD CONSTRAINT "grades_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."incident_audit_log"
    ADD CONSTRAINT "incident_audit_log_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."incident_categories"
    ADD CONSTRAINT "incident_categories_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."incident_priorities"
    ADD CONSTRAINT "incident_priorities_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."incident_report_types"
    ADD CONSTRAINT "incident_report_types_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."incident_subcategories"
    ADD CONSTRAINT "incident_subcategories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."incident_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."incident_subcategories"
    ADD CONSTRAINT "incident_subcategories_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."incidents"
    ADD CONSTRAINT "incidents_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."incidents"
    ADD CONSTRAINT "incidents_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."incident_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."incidents"
    ADD CONSTRAINT "incidents_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."incidents"
    ADD CONSTRAINT "incidents_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."incidents"
    ADD CONSTRAINT "incidents_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."incidents"
    ADD CONSTRAINT "incidents_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."campuses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."incidents"
    ADD CONSTRAINT "incidents_priority_id_fkey" FOREIGN KEY ("priority_id") REFERENCES "public"."incident_priorities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."incidents"
    ADD CONSTRAINT "incidents_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "public"."incident_subcategories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."incidents"
    ADD CONSTRAINT "incidents_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "public"."incident_report_types"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sections"
    ADD CONSTRAINT "sections_campus_id_fkey" FOREIGN KEY ("campus_id") REFERENCES "public"."campuses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sections"
    ADD CONSTRAINT "sections_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sections"
    ADD CONSTRAINT "sections_grade_id_fkey" FOREIGN KEY ("grade_id") REFERENCES "public"."grades"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vehicle_documents"
    ADD CONSTRAINT "vehicle_documents_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE;



CREATE POLICY "Allow anonymous read for login verification" ON "public"."backoffice_users" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Allow authenticated users to read notification rules" ON "public"."notification_rules" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated users to read notification templates" ON "public"."notification_templates" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authentication function access" ON "public"."employees" FOR SELECT USING ((("current_setting"('role'::"text") = 'authenticated'::"text") OR ("current_setting"('role'::"text") = 'anon'::"text") OR ("current_setting"('role'::"text") = 'postgres'::"text")));



CREATE POLICY "Allow service role and backoffice full access to clients" ON "public"."clients" USING ((("auth"."role"() = 'service_role'::"text") OR (("auth"."uid"() IS NOT NULL) AND ("public"."is_current_user_backoffice_admin"() = true)) OR ("public"."is_backoffice_admin"() = true))) WITH CHECK ((("auth"."role"() = 'service_role'::"text") OR (("auth"."uid"() IS NOT NULL) AND ("public"."is_current_user_backoffice_admin"() = true)) OR ("public"."is_backoffice_admin"() = true)));



CREATE POLICY "Allow service role to insert notification logs" ON "public"."notification_logs" FOR INSERT WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Allow service role to manage all notification logs" ON "public"."notification_logs" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Allow service role to manage notification rules" ON "public"."notification_rules" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Allow users to read their own notification logs" ON "public"."notification_logs" FOR SELECT USING (("auth"."uid"() = "recipient_id"));



CREATE POLICY "Anyone can view incidents" ON "public"."incidents" FOR SELECT USING (true);



CREATE POLICY "Anyone can view template categories" ON "public"."template_categories" FOR SELECT USING (true);



CREATE POLICY "Authenticated users and backoffice admins can view modules" ON "public"."modules" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") OR "public"."is_backoffice_admin"()));



CREATE POLICY "Authenticated users can create incidents" ON "public"."incidents" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated users can update incidents" ON "public"."incidents" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can view client types" ON "public"."client_type" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can view document status" ON "public"."document_status" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can view employee document types" ON "public"."employee_document_type" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can view form field types" ON "public"."form_fields_type" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can view incident status" ON "public"."incident_status" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can view roles" ON "public"."roles" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can view template categories" ON "public"."template_categories" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Backoffice admins can create clients" ON "public"."clients" FOR INSERT WITH CHECK ("public"."is_backoffice_admin"());



CREATE POLICY "Backoffice admins can create modules" ON "public"."modules" FOR INSERT WITH CHECK ("public"."is_backoffice_admin"());



CREATE POLICY "Backoffice admins can delete backoffice edusafe resources" ON "public"."backoffice_edusafe_resource" FOR DELETE USING (("public"."is_current_user_backoffice_admin"() = true));



CREATE POLICY "Backoffice admins can delete backoffice users" ON "public"."backoffice_users" FOR DELETE USING (("public"."is_current_user_backoffice_admin"() = true));



CREATE POLICY "Backoffice admins can delete client purge logs" ON "public"."client_purge_log" FOR DELETE USING (("public"."is_current_user_backoffice_admin"() = true));



CREATE POLICY "Backoffice admins can delete clients" ON "public"."clients" FOR DELETE USING ("public"."is_backoffice_admin"());



CREATE POLICY "Backoffice admins can delete modules" ON "public"."modules" FOR DELETE USING ("public"."is_backoffice_admin"());



CREATE POLICY "Backoffice admins can insert backoffice edusafe resources" ON "public"."backoffice_edusafe_resource" FOR INSERT WITH CHECK (("public"."is_current_user_backoffice_admin"() = true));



CREATE POLICY "Backoffice admins can insert backoffice users" ON "public"."backoffice_users" FOR INSERT WITH CHECK (("public"."is_current_user_backoffice_admin"() = true));



CREATE POLICY "Backoffice admins can insert client purge logs" ON "public"."client_purge_log" FOR INSERT WITH CHECK (("public"."is_current_user_backoffice_admin"() = true));



CREATE POLICY "Backoffice admins can manage all configuration import logs" ON "public"."configuration_import_logs" USING (("public"."is_current_user_backoffice_admin"() = true)) WITH CHECK (("public"."is_current_user_backoffice_admin"() = true));



CREATE POLICY "Backoffice admins can manage backoffice edusafe resources" ON "public"."backoffice_edusafe_resource" USING (("public"."is_current_user_backoffice_admin"() = true)) WITH CHECK (("public"."is_current_user_backoffice_admin"() = true));



CREATE POLICY "Backoffice admins can manage client types" ON "public"."client_type" USING (("public"."is_current_user_backoffice_admin"() = true)) WITH CHECK (("public"."is_current_user_backoffice_admin"() = true));



CREATE POLICY "Backoffice admins can manage document status" ON "public"."document_status" USING (("public"."is_current_user_backoffice_admin"() = true)) WITH CHECK (("public"."is_current_user_backoffice_admin"() = true));



CREATE POLICY "Backoffice admins can manage employee document types" ON "public"."employee_document_type" USING (("public"."is_current_user_backoffice_admin"() = true)) WITH CHECK (("public"."is_current_user_backoffice_admin"() = true));



CREATE POLICY "Backoffice admins can manage form field types" ON "public"."form_fields_type" USING (("public"."is_current_user_backoffice_admin"() = true)) WITH CHECK (("public"."is_current_user_backoffice_admin"() = true));



CREATE POLICY "Backoffice admins can manage incident status" ON "public"."incident_status" USING (("public"."is_current_user_backoffice_admin"() = true)) WITH CHECK (("public"."is_current_user_backoffice_admin"() = true));



CREATE POLICY "Backoffice admins can manage roles" ON "public"."roles" USING (("public"."is_current_user_backoffice_admin"() = true)) WITH CHECK (("public"."is_current_user_backoffice_admin"() = true));



CREATE POLICY "Backoffice admins can manage template categories" ON "public"."template_categories" USING (("public"."is_current_user_backoffice_admin"() = true)) WITH CHECK (("public"."is_current_user_backoffice_admin"() = true));



CREATE POLICY "Backoffice admins can update backoffice edusafe resources" ON "public"."backoffice_edusafe_resource" FOR UPDATE USING (("public"."is_current_user_backoffice_admin"() = true));



CREATE POLICY "Backoffice admins can update backoffice users" ON "public"."backoffice_users" FOR UPDATE USING (("public"."is_current_user_backoffice_admin"() = true));



CREATE POLICY "Backoffice admins can update client purge logs" ON "public"."client_purge_log" FOR UPDATE USING (("public"."is_current_user_backoffice_admin"() = true));



CREATE POLICY "Backoffice admins can update clients" ON "public"."clients" FOR UPDATE USING ("public"."is_backoffice_admin"());



CREATE POLICY "Backoffice admins can update modules" ON "public"."modules" FOR UPDATE USING ("public"."is_backoffice_admin"());



CREATE POLICY "Backoffice admins can view all backoffice edusafe resources" ON "public"."backoffice_edusafe_resource" FOR SELECT USING (("public"."is_current_user_backoffice_admin"() = true));



CREATE POLICY "Backoffice admins can view all backoffice users" ON "public"."backoffice_users" FOR SELECT USING (("public"."is_current_user_backoffice_admin"() = true));



CREATE POLICY "Backoffice admins can view all client purge logs" ON "public"."client_purge_log" FOR SELECT USING (("public"."is_current_user_backoffice_admin"() = true));



CREATE POLICY "Backoffice admins can view all clients" ON "public"."clients" FOR SELECT USING ("public"."is_backoffice_admin"());



CREATE POLICY "Form owners can view submissions" ON "public"."form_submissions" FOR SELECT USING (("form_id" IN ( SELECT "custom_forms"."id"
   FROM "public"."custom_forms"
  WHERE ("custom_forms"."client_id" IN ( SELECT "employees"."client_id"
           FROM "public"."employees"
          WHERE (("employees"."user_id" = "auth"."uid"()) AND ("employees"."status" = true)))))));



CREATE POLICY "Public can insert form submissions" ON "public"."form_submissions" FOR INSERT WITH CHECK (true);



CREATE POLICY "Service role can access backoffice users" ON "public"."backoffice_users" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage email queue" ON "public"."email_queue" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role full access" ON "public"."backoffice_users" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Users can create assessments for their client" ON "public"."assessments" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can create categories for their client" ON "public"."incident_categories" FOR INSERT WITH CHECK (("client_id" IN ( SELECT "employees"."client_id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can create templates" ON "public"."assessment_templates" FOR INSERT WITH CHECK ((("client_id" = ( SELECT "employees"."client_id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))) OR ("client_id" IS NULL)));



CREATE POLICY "Users can create templates for their client" ON "public"."assessment_templates" FOR INSERT WITH CHECK ((("client_id" IS NULL) OR ("client_id" = ( SELECT "employees"."client_id"
   FROM "public"."employees"
  WHERE ("employees"."id" = "auth"."uid"())))));



CREATE POLICY "Users can delete assessment audit logs from their client" ON "public"."assessment_audit_log" FOR DELETE USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can delete assessment templates from their client" ON "public"."assessment_templates" FOR DELETE USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can delete assessments from their client" ON "public"."assessments" FOR DELETE USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can delete assessments they created in their client" ON "public"."assessments" FOR DELETE USING ((("auth"."uid"() IS NOT NULL) AND ((("client_id" = "public"."get_current_user_client_id"()) AND ("created_by" = "auth"."uid"())) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can delete campuses from their client" ON "public"."campuses" FOR DELETE USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can delete client modules from their client" ON "public"."client_modules" FOR DELETE USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can delete compliance documents for their client" ON "public"."compliance_documents" FOR DELETE USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" IN ( SELECT "e"."client_id"
   FROM "public"."employees" "e"
  WHERE ("e"."user_id" = "auth"."uid"())
 LIMIT 1)) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can delete contributing factors from their client" ON "public"."contributing_factors" FOR DELETE USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can delete custom forms from their client" ON "public"."custom_forms" FOR DELETE USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can delete edusafe resources from their client" ON "public"."edusafe_resources" FOR DELETE USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can delete employee documents from their client" ON "public"."employee_documents" FOR DELETE USING ((("auth"."uid"() IS NOT NULL) AND (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."client_id" = "public"."get_current_user_client_id"()))) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can delete employee modules from their client only" ON "public"."employee_modules" FOR DELETE USING ((("auth"."uid"() IS NOT NULL) AND (("employee_id" IN ( SELECT "e"."id"
   FROM "public"."employees" "e"
  WHERE ("e"."client_id" = "public"."get_current_user_client_id"()))) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can delete employees from their client only" ON "public"."employees" FOR DELETE USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can delete facilities from their client" ON "public"."facilities" FOR DELETE USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can delete form submissions from their client" ON "public"."form_submissions" FOR DELETE USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can delete grades from their client" ON "public"."grades" FOR DELETE USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can delete incident audit logs from their client" ON "public"."incident_audit_log" FOR DELETE USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can delete incident categories from their client" ON "public"."incident_categories" FOR DELETE USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" IN ( SELECT "employees"."client_id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can delete incident priorities from their client" ON "public"."incident_priorities" FOR DELETE USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can delete incident report types from their client" ON "public"."incident_report_types" FOR DELETE USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can delete incident subcategories from their client" ON "public"."incident_subcategories" FOR DELETE USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can delete incidents they created in their client" ON "public"."incidents" FOR DELETE USING ((("auth"."uid"() IS NOT NULL) AND ((("client_id" = "public"."get_current_user_client_id"()) AND ("created_by" = "auth"."uid"())) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can delete sections from their client" ON "public"."sections" FOR DELETE USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can delete students from their client" ON "public"."students" FOR DELETE USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can delete templates" ON "public"."assessment_templates" FOR DELETE USING (("client_id" = ( SELECT "employees"."client_id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can delete templates from their client" ON "public"."assessment_templates" FOR DELETE USING ((("client_id" IS NULL) OR ("client_id" = ( SELECT "employees"."client_id"
   FROM "public"."employees"
  WHERE ("employees"."id" = "auth"."uid"())))));



CREATE POLICY "Users can delete their client" ON "public"."clients" FOR DELETE USING ((("auth"."uid"() IS NOT NULL) AND (("id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can delete vehicle documents from their client" ON "public"."vehicle_documents" FOR DELETE USING ((("auth"."uid"() IS NOT NULL) AND (("vehicle_id" IN ( SELECT "v"."id"
   FROM "public"."vehicles" "v"
  WHERE ("v"."client_id" = "public"."get_current_user_client_id"()))) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can delete vehicles from their client" ON "public"."vehicles" FOR DELETE USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can insert assessment audit logs for their client" ON "public"."assessment_audit_log" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can insert assessment templates for their client" ON "public"."assessment_templates" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can insert assessments for their client" ON "public"."assessments" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can insert campuses for their client" ON "public"."campuses" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can insert client modules for their client" ON "public"."client_modules" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can insert compliance documents for their client" ON "public"."compliance_documents" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND (("client_id" IN ( SELECT "e"."client_id"
   FROM "public"."employees" "e"
  WHERE ("e"."user_id" = "auth"."uid"())
 LIMIT 1)) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can insert configuration import logs for their client" ON "public"."configuration_import_logs" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can insert contributing factors for their client" ON "public"."contributing_factors" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can insert custom forms for their client" ON "public"."custom_forms" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can insert edusafe resources for their client" ON "public"."edusafe_resources" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can insert employee documents for their client" ON "public"."employee_documents" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."client_id" = "public"."get_current_user_client_id"()))) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can insert employee modules for their client only" ON "public"."employee_modules" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND (("employee_id" IN ( SELECT "e"."id"
   FROM "public"."employees" "e"
  WHERE ("e"."client_id" = "public"."get_current_user_client_id"()))) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can insert employees for their client only" ON "public"."employees" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can insert facilities for their client" ON "public"."facilities" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can insert form submissions" ON "public"."form_submissions" FOR INSERT WITH CHECK (((("auth"."uid"() IS NULL) AND (EXISTS ( SELECT 1
   FROM "public"."custom_forms" "cf"
  WHERE (("cf"."id" = "form_submissions"."form_id") AND ("cf"."is_active" = true))))) OR (("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true)))));



CREATE POLICY "Users can insert form submissions for their client" ON "public"."form_submissions" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can insert grades for their client" ON "public"."grades" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can insert incident audit logs for their client" ON "public"."incident_audit_log" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can insert incident priorities for their client" ON "public"."incident_priorities" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can insert incident report types for their client" ON "public"."incident_report_types" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can insert incident subcategories for their client" ON "public"."incident_subcategories" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can insert incidents for their client" ON "public"."incidents" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can insert sections for their client" ON "public"."sections" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can insert students for their client" ON "public"."students" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can insert their client" ON "public"."clients" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND (("id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can insert vehicle documents for their client" ON "public"."vehicle_documents" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND (("vehicle_id" IN ( SELECT "v"."id"
   FROM "public"."vehicles" "v"
  WHERE ("v"."client_id" = "public"."get_current_user_client_id"()))) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can insert vehicles for their client" ON "public"."vehicles" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can update assessment audit logs from their client" ON "public"."assessment_audit_log" FOR UPDATE USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can update assessment templates from their client" ON "public"."assessment_templates" FOR UPDATE USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can update assessments from their client" ON "public"."assessments" FOR UPDATE USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can update assessments from their client involvement" ON "public"."assessments" FOR UPDATE USING ((("auth"."uid"() IS NOT NULL) AND ((("client_id" = "public"."get_current_user_client_id"()) AND (("created_by" = "auth"."uid"()) OR ("assigned_to" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))))) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can update campuses from their client" ON "public"."campuses" FOR UPDATE USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can update categories for their client" ON "public"."incident_categories" FOR UPDATE USING (("client_id" IN ( SELECT "employees"."client_id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update client modules from their client" ON "public"."client_modules" FOR UPDATE USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can update compliance documents for their client" ON "public"."compliance_documents" FOR UPDATE USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" IN ( SELECT "e"."client_id"
   FROM "public"."employees" "e"
  WHERE ("e"."user_id" = "auth"."uid"())
 LIMIT 1)) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can update contributing factors from their client" ON "public"."contributing_factors" FOR UPDATE USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can update custom forms from their client" ON "public"."custom_forms" FOR UPDATE USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can update edusafe resources from their client" ON "public"."edusafe_resources" FOR UPDATE USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can update employee documents from their client" ON "public"."employee_documents" FOR UPDATE USING ((("auth"."uid"() IS NOT NULL) AND (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."client_id" = "public"."get_current_user_client_id"()))) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can update employee modules from their client only" ON "public"."employee_modules" FOR UPDATE USING ((("auth"."uid"() IS NOT NULL) AND (("employee_id" IN ( SELECT "e"."id"
   FROM "public"."employees" "e"
  WHERE ("e"."client_id" = "public"."get_current_user_client_id"()))) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can update employees from their client only" ON "public"."employees" FOR UPDATE USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can update facilities from their client" ON "public"."facilities" FOR UPDATE USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can update form submissions from their client" ON "public"."form_submissions" FOR UPDATE USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can update grades from their client" ON "public"."grades" FOR UPDATE USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can update incident audit logs from their client" ON "public"."incident_audit_log" FOR UPDATE USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can update incident priorities from their client" ON "public"."incident_priorities" FOR UPDATE USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can update incident report types from their client" ON "public"."incident_report_types" FOR UPDATE USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can update incident subcategories from their client" ON "public"."incident_subcategories" FOR UPDATE USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can update incidents from their client involvement" ON "public"."incidents" FOR UPDATE USING ((("auth"."uid"() IS NOT NULL) AND ((("client_id" = "public"."get_current_user_client_id"()) AND (("created_by" = "auth"."uid"()) OR ("assigned_to" = "auth"."uid"()))) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can update sections from their client" ON "public"."sections" FOR UPDATE USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can update students from their client" ON "public"."students" FOR UPDATE USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can update templates" ON "public"."assessment_templates" FOR UPDATE USING (("client_id" = ( SELECT "employees"."client_id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update templates from their client" ON "public"."assessment_templates" FOR UPDATE USING ((("client_id" IS NULL) OR ("client_id" = ( SELECT "employees"."client_id"
   FROM "public"."employees"
  WHERE ("employees"."id" = "auth"."uid"())))));



CREATE POLICY "Users can update their client" ON "public"."clients" FOR UPDATE USING ((("auth"."uid"() IS NOT NULL) AND (("id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can update vehicle documents from their client" ON "public"."vehicle_documents" FOR UPDATE USING ((("auth"."uid"() IS NOT NULL) AND (("vehicle_id" IN ( SELECT "v"."id"
   FROM "public"."vehicles" "v"
  WHERE ("v"."client_id" = "public"."get_current_user_client_id"()))) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can update vehicles from their client" ON "public"."vehicles" FOR UPDATE USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can view assessment audit logs from their client" ON "public"."assessment_audit_log" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can view assessment templates from their client" ON "public"."assessment_templates" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can view assessment templates from their client and globa" ON "public"."assessment_templates" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("client_id" IS NULL) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can view assessments from their client" ON "public"."assessments" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can view assessments from their client or involvement" ON "public"."assessments" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("created_by" = "auth"."uid"()) OR ("assigned_to" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can view campuses from their client" ON "public"."campuses" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can view categories for their client" ON "public"."incident_categories" FOR SELECT USING (("client_id" IN ( SELECT "employees"."client_id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view client modules from their client" ON "public"."client_modules" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Users can view compliance documents for their client only" ON "public"."compliance_documents" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" IN ( SELECT "e"."client_id"
   FROM "public"."employees" "e"
  WHERE ("e"."user_id" = "auth"."uid"())
 LIMIT 1)) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can view configuration import logs from their client" ON "public"."configuration_import_logs" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can view contributing factors from their client" ON "public"."contributing_factors" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can view custom forms from their client" ON "public"."custom_forms" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can view custom forms from their client and public active" ON "public"."custom_forms" FOR SELECT USING ((("is_active" = true) OR (("auth"."uid"() IS NOT NULL) AND ("client_id" = "public"."get_current_user_client_id"())) OR (("auth"."uid"() IS NOT NULL) AND ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can view edusafe resources from their client" ON "public"."edusafe_resources" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can view employee documents from their client" ON "public"."employee_documents" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND (("employee_id" IN ( SELECT "employees"."id"
   FROM "public"."employees"
  WHERE ("employees"."client_id" = "public"."get_current_user_client_id"()))) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can view employee modules from their client only" ON "public"."employee_modules" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND (("employee_id" IN ( SELECT "e"."id"
   FROM "public"."employees" "e"
  WHERE ("e"."client_id" = "public"."get_current_user_client_id"()))) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can view employees from their client" ON "public"."employees" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can view facilities from their client" ON "public"."facilities" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can view form submissions from their client" ON "public"."form_submissions" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can view grades from their client" ON "public"."grades" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can view incident audit logs from their client" ON "public"."incident_audit_log" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can view incident priorities from their client" ON "public"."incident_priorities" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can view incident report types from their client" ON "public"."incident_report_types" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can view incident subcategories from their client" ON "public"."incident_subcategories" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can view incidents from their client or involvement" ON "public"."incidents" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("created_by" = "auth"."uid"()) OR ("assigned_to" = "auth"."uid"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can view sections from their client" ON "public"."sections" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can view students from their client" ON "public"."students" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can view templates" ON "public"."assessment_templates" FOR SELECT USING ((("client_id" IS NULL) OR ("client_id" = ( SELECT "employees"."client_id"
   FROM "public"."employees"
  WHERE ("employees"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view templates from their client" ON "public"."assessment_templates" FOR SELECT USING ((("client_id" IS NULL) OR ("client_id" = ( SELECT "employees"."client_id"
   FROM "public"."employees"
  WHERE ("employees"."id" = "auth"."uid"())))));



CREATE POLICY "Users can view their client" ON "public"."clients" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Users can view their own backoffice record" ON "public"."backoffice_users" FOR SELECT TO "authenticated" USING ((("auth"."uid"())::"text" = ("id")::"text"));



CREATE POLICY "Users can view their own employee record" ON "public"."employees" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own queued emails" ON "public"."email_queue" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND ("client_id" = "public"."get_current_user_client_id"())));



CREATE POLICY "Users can view vehicle documents from their client" ON "public"."vehicle_documents" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND (("vehicle_id" IN ( SELECT "v"."id"
   FROM "public"."vehicles" "v"
  WHERE ("v"."client_id" = "public"."get_current_user_client_id"()))) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "Users can view vehicles from their client" ON "public"."vehicles" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND (("client_id" = "public"."get_current_user_client_id"()) OR ("public"."is_current_user_backoffice_admin"() = true))));



ALTER TABLE "public"."assessment_audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assessment_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assessments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."backoffice_edusafe_resource" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."backoffice_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."campuses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."client_modules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."client_purge_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."client_type" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clients" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."compliance_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."configuration_import_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contributing_factors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."custom_forms" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_status" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."edusafe_resources" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."email_queue" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."employee_document_type" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."employee_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."employee_modules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."employees" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."facilities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."form_fields_type" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."form_submissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."grades" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."incident_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."incident_priorities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."incident_report_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."incident_status" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."incident_subcategories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."incidents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."modules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_rules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."students" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."template_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vehicle_documents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "vehicle_documents_delete" ON "public"."vehicle_documents" FOR DELETE USING ((("auth"."uid"() IS NOT NULL) AND ((EXISTS ( SELECT 1
   FROM "public"."vehicles" "v"
  WHERE (("v"."id" = "vehicle_documents"."vehicle_id") AND ("v"."client_id" = "public"."get_current_user_client_id"())))) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "vehicle_documents_insert" ON "public"."vehicle_documents" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ((EXISTS ( SELECT 1
   FROM "public"."vehicles" "v"
  WHERE (("v"."id" = "vehicle_documents"."vehicle_id") AND ("v"."client_id" = "public"."get_current_user_client_id"())))) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "vehicle_documents_select" ON "public"."vehicle_documents" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND ((EXISTS ( SELECT 1
   FROM "public"."vehicles" "v"
  WHERE (("v"."id" = "vehicle_documents"."vehicle_id") AND ("v"."client_id" = "public"."get_current_user_client_id"())))) OR ("public"."is_current_user_backoffice_admin"() = true))));



CREATE POLICY "vehicle_documents_update" ON "public"."vehicle_documents" FOR UPDATE USING ((("auth"."uid"() IS NOT NULL) AND ((EXISTS ( SELECT 1
   FROM "public"."vehicles" "v"
  WHERE (("v"."id" = "vehicle_documents"."vehicle_id") AND ("v"."client_id" = "public"."get_current_user_client_id"())))) OR ("public"."is_current_user_backoffice_admin"() = true)))) WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ((EXISTS ( SELECT 1
   FROM "public"."vehicles" "v"
  WHERE (("v"."id" = "vehicle_documents"."vehicle_id") AND ("v"."client_id" = "public"."get_current_user_client_id"())))) OR ("public"."is_current_user_backoffice_admin"() = true))));



ALTER TABLE "public"."vehicles" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."backoffice_users";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."client_modules";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."employee_documents";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."employee_modules";



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



































































































































































































GRANT ALL ON FUNCTION "public"."add_table_to_publication"("table_name" "text", "publication_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."add_table_to_publication"("table_name" "text", "publication_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_table_to_publication"("table_name" "text", "publication_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."backfill_employee_user_links"() TO "anon";
GRANT ALL ON FUNCTION "public"."backfill_employee_user_links"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."backfill_employee_user_links"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_cron_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_cron_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_cron_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_recent_cron_runs"("limit_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."check_recent_cron_runs"("limit_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_recent_cron_runs"("limit_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."clean_employee_email"() TO "anon";
GRANT ALL ON FUNCTION "public"."clean_employee_email"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."clean_employee_email"() TO "service_role";



GRANT ALL ON FUNCTION "public"."debug_auth_info"() TO "anon";
GRANT ALL ON FUNCTION "public"."debug_auth_info"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."debug_auth_info"() TO "service_role";



GRANT ALL ON FUNCTION "public"."debug_backoffice_auth"() TO "anon";
GRANT ALL ON FUNCTION "public"."debug_backoffice_auth"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."debug_backoffice_auth"() TO "service_role";



GRANT ALL ON FUNCTION "public"."decrypt_document_number"("encrypted_doc_number" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."decrypt_document_number"("encrypted_doc_number" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrypt_document_number"("encrypted_doc_number" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."drop_module_key_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."drop_module_key_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."drop_module_key_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."encrypt_document_number"("doc_number" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."encrypt_document_number"("doc_number" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."encrypt_document_number"("doc_number" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."enqueue_backoffice_document_verification"("job" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."enqueue_backoffice_document_verification"("job" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."enqueue_backoffice_document_verification"("job" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."enqueue_compliance_upload"("job" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."enqueue_compliance_upload"("job" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."enqueue_compliance_upload"("job" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."enqueue_document_comment_operation"("job" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."enqueue_document_comment_operation"("job" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."enqueue_document_comment_operation"("job" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."enqueue_employee_document_upload"("job" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."enqueue_employee_document_upload"("job" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."enqueue_employee_document_upload"("job" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_client_domains"("p_client_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_client_domains"("p_client_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_client_domains"("p_client_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_user_client_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_user_client_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_user_client_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_employee_by_email_for_auth"("user_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_employee_by_email_for_auth"("user_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_employee_by_email_for_auth"("user_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_masked_document_number"("encrypted_doc_number" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_masked_document_number"("encrypted_doc_number" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_masked_document_number"("encrypted_doc_number" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."hash_password"("password" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."hash_password"("password" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hash_password"("password" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_assessment_audit_log"("p_assessment_id" "uuid", "p_client_id" "uuid", "p_field_changed" "text", "p_changed_by" "uuid", "p_old_value" "text", "p_new_value" "text", "p_change_type" "text", "p_description" "text", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."insert_assessment_audit_log"("p_assessment_id" "uuid", "p_client_id" "uuid", "p_field_changed" "text", "p_changed_by" "uuid", "p_old_value" "text", "p_new_value" "text", "p_change_type" "text", "p_description" "text", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_assessment_audit_log"("p_assessment_id" "uuid", "p_client_id" "uuid", "p_field_changed" "text", "p_changed_by" "uuid", "p_old_value" "text", "p_new_value" "text", "p_change_type" "text", "p_description" "text", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_incident_audit_log"("p_incident_id" "uuid", "p_field_changed" "text", "p_changed_by" "uuid", "p_old_value" "text", "p_new_value" "text", "p_change_type" "text", "p_description" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."insert_incident_audit_log"("p_incident_id" "uuid", "p_field_changed" "text", "p_changed_by" "uuid", "p_old_value" "text", "p_new_value" "text", "p_change_type" "text", "p_description" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_incident_audit_log"("p_incident_id" "uuid", "p_field_changed" "text", "p_changed_by" "uuid", "p_old_value" "text", "p_new_value" "text", "p_change_type" "text", "p_description" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_incident_audit_log"("p_incident_id" "uuid", "p_client_id" "uuid", "p_field_changed" "text", "p_changed_by" "uuid", "p_old_value" "text", "p_new_value" "text", "p_change_type" "text", "p_description" "text", "p_changes" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."insert_incident_audit_log"("p_incident_id" "uuid", "p_client_id" "uuid", "p_field_changed" "text", "p_changed_by" "uuid", "p_old_value" "text", "p_new_value" "text", "p_change_type" "text", "p_description" "text", "p_changes" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_incident_audit_log"("p_incident_id" "uuid", "p_client_id" "uuid", "p_field_changed" "text", "p_changed_by" "uuid", "p_old_value" "text", "p_new_value" "text", "p_change_type" "text", "p_description" "text", "p_changes" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_backoffice_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_backoffice_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_backoffice_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_backoffice_admin_by_uid"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_backoffice_admin_by_uid"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_backoffice_admin_by_uid"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_current_user_backoffice_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_current_user_backoffice_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_current_user_backoffice_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."link_user_to_employee"("p_user_id" "uuid", "p_employee_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."link_user_to_employee"("p_user_id" "uuid", "p_employee_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."link_user_to_employee"("p_user_id" "uuid", "p_employee_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_assessment_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_assessment_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_assessment_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_assessment_creation"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_assessment_creation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_assessment_creation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_incident_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_incident_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_incident_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."pgmq_delete"("queue_name" "text", "msg_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."pgmq_delete"("queue_name" "text", "msg_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgmq_delete"("queue_name" "text", "msg_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."pgmq_read"("queue_name" "text", "vt" integer, "qty" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."pgmq_read"("queue_name" "text", "vt" integer, "qty" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."pgmq_read"("queue_name" "text", "vt" integer, "qty" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_form_submission_client_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_form_submission_client_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_form_submission_client_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_replica_identity_for_table"("table_name" "text", "identity_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."set_replica_identity_for_table"("table_name" "text", "identity_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_replica_identity_for_table"("table_name" "text", "identity_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_backoffice_users_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_backoffice_users_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_backoffice_users_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."verify_password"("email" "text", "password_attempt" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."verify_password"("email" "text", "password_attempt" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."verify_password"("email" "text", "password_attempt" "text") TO "service_role";












SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;



SET SESSION AUTHORIZATION "postgres";
RESET SESSION AUTHORIZATION;









GRANT ALL ON TABLE "public"."assessment_audit_log" TO "anon";
GRANT ALL ON TABLE "public"."assessment_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."assessment_audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."assessment_templates" TO "anon";
GRANT ALL ON TABLE "public"."assessment_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."assessment_templates" TO "service_role";



GRANT ALL ON TABLE "public"."assessments" TO "anon";
GRANT ALL ON TABLE "public"."assessments" TO "authenticated";
GRANT ALL ON TABLE "public"."assessments" TO "service_role";



GRANT ALL ON SEQUENCE "public"."assessments_assessment_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."assessments_assessment_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."assessments_assessment_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."backoffice_edusafe_resource" TO "anon";
GRANT ALL ON TABLE "public"."backoffice_edusafe_resource" TO "authenticated";
GRANT ALL ON TABLE "public"."backoffice_edusafe_resource" TO "service_role";



GRANT ALL ON TABLE "public"."backoffice_users" TO "anon";
GRANT ALL ON TABLE "public"."backoffice_users" TO "authenticated";
GRANT ALL ON TABLE "public"."backoffice_users" TO "service_role";



GRANT ALL ON TABLE "public"."campuses" TO "anon";
GRANT ALL ON TABLE "public"."campuses" TO "authenticated";
GRANT ALL ON TABLE "public"."campuses" TO "service_role";



GRANT ALL ON TABLE "public"."client_modules" TO "anon";
GRANT ALL ON TABLE "public"."client_modules" TO "authenticated";
GRANT ALL ON TABLE "public"."client_modules" TO "service_role";



GRANT ALL ON TABLE "public"."client_purge_log" TO "anon";
GRANT ALL ON TABLE "public"."client_purge_log" TO "authenticated";
GRANT ALL ON TABLE "public"."client_purge_log" TO "service_role";



GRANT ALL ON SEQUENCE "public"."client_purge_log_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."client_purge_log_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."client_purge_log_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."client_type" TO "anon";
GRANT ALL ON TABLE "public"."client_type" TO "authenticated";
GRANT ALL ON TABLE "public"."client_type" TO "service_role";



GRANT ALL ON TABLE "public"."clients" TO "anon";
GRANT ALL ON TABLE "public"."clients" TO "authenticated";
GRANT ALL ON TABLE "public"."clients" TO "service_role";



GRANT ALL ON TABLE "public"."compliance_documents" TO "anon";
GRANT ALL ON TABLE "public"."compliance_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."compliance_documents" TO "service_role";



GRANT ALL ON TABLE "public"."configuration_import_logs" TO "anon";
GRANT ALL ON TABLE "public"."configuration_import_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."configuration_import_logs" TO "service_role";



GRANT ALL ON TABLE "public"."contributing_factors" TO "anon";
GRANT ALL ON TABLE "public"."contributing_factors" TO "authenticated";
GRANT ALL ON TABLE "public"."contributing_factors" TO "service_role";



GRANT ALL ON TABLE "public"."custom_forms" TO "anon";
GRANT ALL ON TABLE "public"."custom_forms" TO "authenticated";
GRANT ALL ON TABLE "public"."custom_forms" TO "service_role";



GRANT ALL ON TABLE "public"."document_status" TO "anon";
GRANT ALL ON TABLE "public"."document_status" TO "authenticated";
GRANT ALL ON TABLE "public"."document_status" TO "service_role";



GRANT ALL ON TABLE "public"."edusafe_resources" TO "anon";
GRANT ALL ON TABLE "public"."edusafe_resources" TO "authenticated";
GRANT ALL ON TABLE "public"."edusafe_resources" TO "service_role";



GRANT ALL ON TABLE "public"."email_queue" TO "anon";
GRANT ALL ON TABLE "public"."email_queue" TO "authenticated";
GRANT ALL ON TABLE "public"."email_queue" TO "service_role";



GRANT ALL ON TABLE "public"."employee_document_type" TO "anon";
GRANT ALL ON TABLE "public"."employee_document_type" TO "authenticated";
GRANT ALL ON TABLE "public"."employee_document_type" TO "service_role";



GRANT ALL ON TABLE "public"."employee_documents" TO "anon";
GRANT ALL ON TABLE "public"."employee_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."employee_documents" TO "service_role";



GRANT ALL ON TABLE "public"."employee_modules" TO "anon";
GRANT ALL ON TABLE "public"."employee_modules" TO "authenticated";
GRANT ALL ON TABLE "public"."employee_modules" TO "service_role";



GRANT ALL ON TABLE "public"."employees" TO "anon";
GRANT ALL ON TABLE "public"."employees" TO "authenticated";
GRANT ALL ON TABLE "public"."employees" TO "service_role";



GRANT ALL ON TABLE "public"."facilities" TO "anon";
GRANT ALL ON TABLE "public"."facilities" TO "authenticated";
GRANT ALL ON TABLE "public"."facilities" TO "service_role";



GRANT ALL ON TABLE "public"."form_fields_type" TO "anon";
GRANT ALL ON TABLE "public"."form_fields_type" TO "authenticated";
GRANT ALL ON TABLE "public"."form_fields_type" TO "service_role";



GRANT ALL ON TABLE "public"."form_submissions" TO "anon";
GRANT ALL ON TABLE "public"."form_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."form_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."grades" TO "anon";
GRANT ALL ON TABLE "public"."grades" TO "authenticated";
GRANT ALL ON TABLE "public"."grades" TO "service_role";



GRANT ALL ON TABLE "public"."incident_audit_log" TO "anon";
GRANT ALL ON TABLE "public"."incident_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."incident_audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."incident_categories" TO "anon";
GRANT ALL ON TABLE "public"."incident_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."incident_categories" TO "service_role";



GRANT ALL ON TABLE "public"."incident_priorities" TO "anon";
GRANT ALL ON TABLE "public"."incident_priorities" TO "authenticated";
GRANT ALL ON TABLE "public"."incident_priorities" TO "service_role";



GRANT ALL ON TABLE "public"."incident_report_types" TO "anon";
GRANT ALL ON TABLE "public"."incident_report_types" TO "authenticated";
GRANT ALL ON TABLE "public"."incident_report_types" TO "service_role";



GRANT ALL ON TABLE "public"."incident_status" TO "anon";
GRANT ALL ON TABLE "public"."incident_status" TO "authenticated";
GRANT ALL ON TABLE "public"."incident_status" TO "service_role";



GRANT ALL ON TABLE "public"."incident_subcategories" TO "anon";
GRANT ALL ON TABLE "public"."incident_subcategories" TO "authenticated";
GRANT ALL ON TABLE "public"."incident_subcategories" TO "service_role";



GRANT ALL ON TABLE "public"."incidents" TO "anon";
GRANT ALL ON TABLE "public"."incidents" TO "authenticated";
GRANT ALL ON TABLE "public"."incidents" TO "service_role";



GRANT ALL ON TABLE "public"."modules" TO "anon";
GRANT ALL ON TABLE "public"."modules" TO "authenticated";
GRANT ALL ON TABLE "public"."modules" TO "service_role";



GRANT ALL ON TABLE "public"."notification_logs" TO "anon";
GRANT ALL ON TABLE "public"."notification_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_logs" TO "service_role";



GRANT ALL ON TABLE "public"."notification_rules" TO "anon";
GRANT ALL ON TABLE "public"."notification_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_rules" TO "service_role";



GRANT ALL ON TABLE "public"."notification_templates" TO "anon";
GRANT ALL ON TABLE "public"."notification_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_templates" TO "service_role";



GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";



GRANT ALL ON TABLE "public"."sections" TO "anon";
GRANT ALL ON TABLE "public"."sections" TO "authenticated";
GRANT ALL ON TABLE "public"."sections" TO "service_role";



GRANT ALL ON TABLE "public"."students" TO "anon";
GRANT ALL ON TABLE "public"."students" TO "authenticated";
GRANT ALL ON TABLE "public"."students" TO "service_role";



GRANT ALL ON TABLE "public"."template_categories" TO "anon";
GRANT ALL ON TABLE "public"."template_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."template_categories" TO "service_role";



GRANT ALL ON TABLE "public"."vehicle_documents" TO "anon";
GRANT ALL ON TABLE "public"."vehicle_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."vehicle_documents" TO "service_role";



GRANT ALL ON TABLE "public"."vehicles" TO "anon";
GRANT ALL ON TABLE "public"."vehicles" TO "authenticated";
GRANT ALL ON TABLE "public"."vehicles" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























