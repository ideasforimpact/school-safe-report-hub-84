-- Enhanced get_current_user_client_id function to handle temporary NULL user_id cases
-- This function uses dynamic SQL to avoid validation errors during function creation
CREATE OR REPLACE FUNCTION public.get_current_user_client_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result uuid;
  sql_text text;
BEGIN
  -- Check if employees table exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'employees'
  ) THEN
    RETURN NULL;
  END IF;

  -- First try to get client_id from user_id match
  sql_text := 'SELECT client_id 
    FROM public.employees 
    WHERE user_id = auth.uid() 
    AND status = true
    LIMIT 1';
  
  BEGIN
    EXECUTE sql_text INTO result;
    IF result IS NOT NULL THEN
      RETURN result;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;

  -- Fallback: if no user_id match, try to match by email during authentication
  sql_text := 'SELECT client_id 
    FROM public.employees 
    WHERE TRIM(BOTH E''\n\r\t '' FROM email) = TRIM(BOTH E''\n\r\t '' FROM (current_setting(''request.jwt.claims'', true)::json->>''email''))
    AND status = true
    AND user_id IS NULL
    LIMIT 1';
  
  BEGIN
    EXECUTE sql_text INTO result;
    RETURN result;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN NULL;
  END;
END;
$function$;

-- Function to safely link user_id to employee record
-- This function uses dynamic SQL to avoid validation errors during function creation
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
  sql_text text;
BEGIN
  -- Check if employees table exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'employees'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Employees table does not exist',
      'employee_data', null
    );
  END IF;

  -- Clean the email for comparison
  p_employee_email := TRIM(BOTH E'\n\r\t ' FROM p_employee_email);
  
  -- Find the employee record that matches the email and is not already linked
  sql_text := 'SELECT id, client_id, email, first_name, last_name, employee_id, is_super_admin, department, employee_type
    FROM public.employees 
    WHERE TRIM(BOTH E''\n\r\t '' FROM email) = $1
    AND status = true
    AND user_id IS NULL
    LIMIT 1';
  
  BEGIN
    EXECUTE sql_text INTO employee_record USING p_employee_email;
    
    -- If no employee found, return error
    IF NOT FOUND THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'No unlinked employee found with email: ' || p_employee_email,
        'employee_data', null
      );
    END IF;
    
    -- Update the employee record with the user_id (transactional)
    sql_text := 'UPDATE public.employees 
      SET user_id = $1, updated_at = now()
      WHERE id = $2';
    EXECUTE sql_text USING p_user_id, employee_record.id;
    
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
END;
$function$;

-- Function to backfill existing employee user links
-- This function uses dynamic SQL to avoid validation errors during function creation
CREATE OR REPLACE FUNCTION public.backfill_employee_user_links()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  updated_count integer := 0;
  employee_record RECORD;
  auth_user_record RECORD;
  sql_text text;
BEGIN
  -- Check if employees table exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'employees'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Employees table does not exist',
      'updated_count', 0
    );
  END IF;

  -- Loop through employees without user_id that have matching auth users
  sql_text := 'SELECT e.id, e.email, e.first_name, e.last_name
    FROM public.employees e
    WHERE e.user_id IS NULL 
    AND e.status = true
    AND TRIM(BOTH E''\n\r\t '' FROM e.email) != ''''';
  
  FOR employee_record IN EXECUTE sql_text
  LOOP
    -- Try to find matching auth user by email
    BEGIN
      SELECT au.id
      INTO auth_user_record
      FROM auth.users au
      WHERE TRIM(BOTH E'\n\r\t ' FROM au.email) = TRIM(BOTH E'\n\r\t ' FROM employee_record.email)
      LIMIT 1;
      
      -- If matching auth user found, link them
      IF FOUND THEN
        sql_text := 'UPDATE public.employees 
          SET user_id = $1, updated_at = now()
          WHERE id = $2';
        EXECUTE sql_text USING auth_user_record.id, employee_record.id;
        
        updated_count := updated_count + 1;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        -- Continue with next employee if error
        NULL;
    END;
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
$function$;