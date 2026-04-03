-- Add explicit display order for Child Audit check types
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'child_audit_check_type'
      AND column_name = 'order'
  ) THEN
    ALTER TABLE public.child_audit_check_type
      ADD COLUMN "order" integer NOT NULL DEFAULT 999;
  END IF;
END $$;

-- Set global default ordering (applies to all clients)
UPDATE public.child_audit_check_type
SET "order" = CASE key
  WHEN 'morning_entry' THEN 1
  WHEN 'in_school' THEN 2
  WHEN 'evening_exit' THEN 3
  WHEN 'hostel_entry' THEN 4
  WHEN 'in_hostel' THEN 5
  WHEN 'hostel_exit' THEN 6
  ELSE COALESCE("order", 999)
END,
updated_at = now();

CREATE INDEX IF NOT EXISTS idx_child_audit_check_type_client_order
  ON public.child_audit_check_type (client_id, "order");
