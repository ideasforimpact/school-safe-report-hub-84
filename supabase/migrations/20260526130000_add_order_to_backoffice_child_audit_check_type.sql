-- Mirror the `order` column that exists on public.child_audit_check_type
-- (added in 20260329192000_add_order_to_child_audit_check_type.sql) onto the
-- backoffice template table, so the sync edge function can copy it into
-- per-client rows and both the backoffice viewer and the user-facing
-- ChildAuditPage render check types in the same day-flow order:
--   Morning Entry → In School → Evening Exit → Hostel Entry → In Hostel → Hostel Exit

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'backoffice_child_audit_check_type'
      AND column_name = 'order'
  ) THEN
    ALTER TABLE public.backoffice_child_audit_check_type
      ADD COLUMN "order" integer NOT NULL DEFAULT 999;
  END IF;
END $$;

-- Backfill the canonical ordering for the seeded check types.
UPDATE public.backoffice_child_audit_check_type
SET "order" = CASE key
  WHEN 'morning_entry' THEN 1
  WHEN 'in_school'     THEN 2
  WHEN 'evening_exit'  THEN 3
  WHEN 'hostel_entry'  THEN 4
  WHEN 'in_hostel'     THEN 5
  WHEN 'hostel_exit'   THEN 6
  ELSE COALESCE("order", 999)
END,
updated_at = now();

CREATE INDEX IF NOT EXISTS idx_backoffice_child_audit_check_type_order
  ON public.backoffice_child_audit_check_type ("order");
