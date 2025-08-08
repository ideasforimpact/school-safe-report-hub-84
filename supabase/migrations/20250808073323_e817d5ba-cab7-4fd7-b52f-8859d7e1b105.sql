
-- 1) Add the verified_by column
ALTER TABLE public.employee_documents
  ADD COLUMN IF NOT EXISTS verified_by uuid;

-- 2) Add the foreign key to employees(id)
ALTER TABLE public.employee_documents
  ADD CONSTRAINT employee_documents_verified_by_fkey
  FOREIGN KEY (verified_by)
  REFERENCES public.employees(id)
  ON UPDATE CASCADE
  ON DELETE SET NULL;

-- 3) Index for faster lookups by verifier
CREATE INDEX IF NOT EXISTS idx_employee_documents_verified_by
  ON public.employee_documents (verified_by);
