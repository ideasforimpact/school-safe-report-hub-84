-- Store employee professional "other details" in a dedicated table
CREATE TABLE IF NOT EXISTS public.employee_other_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  employee_id uuid NOT NULL UNIQUE
    REFERENCES public.employees(id) ON DELETE CASCADE,

  client_id uuid
    REFERENCES public.clients(id) ON DELETE CASCADE,

  aadhaar_number text,
  pan_number text,
  esi_number text,
  pf_number text,
  exit_date text,
  biometric_user_id text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_other_details
  ADD COLUMN IF NOT EXISTS client_id uuid
    REFERENCES public.clients(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_employee_other_details_employee_id
  ON public.employee_other_details(employee_id);

CREATE INDEX IF NOT EXISTS idx_employee_other_details_client_id
  ON public.employee_other_details(client_id);