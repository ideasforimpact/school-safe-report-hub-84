-- Feature 1 + 2 follow-up: the existing link_user_to_employee(p_user_id,
-- p_email) function finds the first unlinked employees row by email and
-- updates it. When a user has multiple unlinked rows (one per client)
-- under the same email, that pick is non-deterministic and may link the
-- wrong row.
--
-- This new RPC pins down WHICH row to link using the employees.id the
-- picker already has in hand. Return shape mirrors link_user_to_employee
-- so the JS caller can swap with minimal changes.

CREATE OR REPLACE FUNCTION public.link_user_to_employee_by_id(
  p_user_id uuid,
  p_employee_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  employee_record RECORD;
BEGIN
  -- Find the EXACT row by id. Allow either:
  --   - unlinked (user_id IS NULL): fresh link
  --   - already linked to the same user_id: idempotent re-link
  -- Reject if the row is linked to a DIFFERENT user_id (would be a
  -- collision / impersonation attempt).
  SELECT id, client_id, email, first_name, last_name, employee_id,
         is_super_admin, department, employee_type, user_id, status
  INTO employee_record
  FROM public.employees
  WHERE id = p_employee_id
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Employee row not found: ' || p_employee_id::text,
      'employee_data', null
    );
  END IF;

  IF employee_record.status IS DISTINCT FROM true THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Employee is not active',
      'employee_data', null
    );
  END IF;

  IF employee_record.user_id IS NOT NULL
     AND employee_record.user_id <> p_user_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Employee already linked to a different user_id',
      'employee_data', null
    );
  END IF;

  -- Apply the link (no-op if already linked to the same user).
  IF employee_record.user_id IS NULL THEN
    UPDATE public.employees
    SET user_id = p_user_id,
        updated_at = now()
    WHERE id = employee_record.id;
  END IF;

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
      'error', 'Database error during by-id linking: ' || SQLERRM,
      'employee_data', null
    );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.link_user_to_employee_by_id(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.link_user_to_employee_by_id(uuid, uuid) TO anon;
