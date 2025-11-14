-- Update link_user_to_employee function with case-insensitive email matching
-- Run this directly in Supabase SQL Editor to update the function without creating a new migration

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

