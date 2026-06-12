-- Feature 2 (multi super admin) — add a boolean flag distinguishing primary
-- vs secondary super admin rows on employees. A client always has exactly
-- one primary (is_super_admin = true, is_secondary_super_admin = false) and
-- up to two secondary rows (is_super_admin = true, is_secondary_super_admin
-- = true). All existing rows default to false so the singular super admin
-- becomes the primary automatically.

ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS is_secondary_super_admin boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.employees.is_secondary_super_admin IS
  'When is_super_admin = true, distinguishes the primary super admin (false) from any secondary super admins (true). Always false when is_super_admin = false.';

-- Most super-admin lookups also filter by client; a partial index on the
-- subset where is_super_admin = true keeps the table-wide footprint tiny.
CREATE INDEX IF NOT EXISTS idx_employees_super_admin_by_client
  ON public.employees (client_id)
  WHERE is_super_admin = true;
