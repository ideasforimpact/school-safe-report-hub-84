-- Add nullable phone column to employees table
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS phone text NULL;

-- Optional: simple index if frequently filtered by phone
-- CREATE INDEX IF NOT EXISTS idx_employees_phone ON public.employees (phone);

