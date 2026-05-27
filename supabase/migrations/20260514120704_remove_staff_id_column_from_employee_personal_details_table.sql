BEGIN;

ALTER TABLE public.employee_personal_details
DROP COLUMN IF EXISTS staff_id;

COMMIT;