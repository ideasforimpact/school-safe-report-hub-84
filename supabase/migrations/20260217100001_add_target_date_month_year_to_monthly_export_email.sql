-- Add target_date, target_month, target_year to monthly_export_email (same as monthly_export_queue)
-- Placed after subject column conceptually; PostgreSQL appends new columns at end

ALTER TABLE public.monthly_export_email
  ADD COLUMN IF NOT EXISTS target_date int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS target_month int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS target_year int NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.monthly_export_email.target_date IS 'Target day (1–31) for the report';
COMMENT ON COLUMN public.monthly_export_email.target_month IS 'Target month (1–12) for the report';
COMMENT ON COLUMN public.monthly_export_email.target_year IS 'Target year for the report';
