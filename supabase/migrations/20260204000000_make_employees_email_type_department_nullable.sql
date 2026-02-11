-- Make email, employee_type, and department nullable on employees table
ALTER TABLE public.employees
  ALTER COLUMN email DROP NOT NULL;

ALTER TABLE public.employees
  ALTER COLUMN employee_type DROP NOT NULL;

ALTER TABLE public.employees
  ALTER COLUMN department DROP NOT NULL;
