
-- Add Employee Verification module to the modules table for backoffice
INSERT INTO public.modules (id, name, url, icon, "order", level, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Employee Verification',
  '/employee-verification',
  'UserCheck',
  7,
  'backoffice',
  now(),
  now()
);
