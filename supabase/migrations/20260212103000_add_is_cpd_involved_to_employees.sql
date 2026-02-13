-- Add is_cpd_involved flag to employees table
-- Defaults to false for all existing and new employees

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'employees'
      AND column_name = 'is_cpd_involved'
  ) THEN
    RAISE NOTICE 'Column is_cpd_involved already exists on employees table, skipping.';
  ELSE
    ALTER TABLE public.employees
      ADD COLUMN is_cpd_involved boolean NOT NULL DEFAULT false;

    COMMENT ON COLUMN public.employees.is_cpd_involved IS
      'Indicates whether the employee is involved in CPD tracking';
  END IF;
END $$;

