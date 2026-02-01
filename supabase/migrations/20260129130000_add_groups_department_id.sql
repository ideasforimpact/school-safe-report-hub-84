-- Add nullable department_id to groups table (for group_type = 'Department')
-- References employee_departments.id

ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS department_id uuid NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employee_departments')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'groups_department_id_fkey') THEN
    ALTER TABLE public.groups
      ADD CONSTRAINT groups_department_id_fkey
      FOREIGN KEY (department_id) REFERENCES public.employee_departments(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_groups_department_id ON public.groups (department_id);

COMMENT ON COLUMN public.groups.department_id IS 'Reference to employee_departments (used when group_type is Department)';
