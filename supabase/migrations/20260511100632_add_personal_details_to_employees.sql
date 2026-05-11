CREATE TABLE IF NOT EXISTS public.employee_personal_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  employee_id uuid NOT NULL UNIQUE
    REFERENCES public.employees(id) ON DELETE CASCADE,

  client_id uuid
    REFERENCES public.clients(id) ON DELETE CASCADE,

  middle_name text,
  father_name text,
  staff_id text,
  experience text,
  qualification text,
  gender text,
  dob text,
  religion text,
  nationality text,
  blood_group text,
  residence_address text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_personal_details
  ADD COLUMN IF NOT EXISTS client_id uuid
    REFERENCES public.clients(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_employee_personal_details_employee_id
  ON public.employee_personal_details(employee_id);

CREATE INDEX IF NOT EXISTS idx_employee_personal_details_client_id
  ON public.employee_personal_details(client_id);