-- Add a dedicated 'backoffice' document_status row so documents verified through
-- the backoffice admin manual-verify flow can be distinguished from regular
-- school-side manual verification (which uses the 'manual' row).
DO $$
DECLARE
  backoffice_status_id uuid;
  manual_status_id uuid;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'document_status'
  ) THEN
    IF NOT EXISTS (SELECT 1 FROM public.document_status WHERE name = 'backoffice') THEN
      INSERT INTO public.document_status (name, description, created_at, updated_at)
      VALUES ('backoffice', 'Document is manually verified by a backoffice admin', now(), now());
    END IF;
  END IF;

  -- Best-effort backfill: any document already flagged as backoffice-verified in the
  -- audit log, but still pointing at the shared 'manual' status row, gets moved to
  -- the new 'backoffice' row so it's labeled correctly without needing re-verification.
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'employee_verification_audit_log'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'document_status'
  ) THEN
    SELECT id INTO backoffice_status_id FROM public.document_status WHERE name = 'backoffice';
    SELECT id INTO manual_status_id FROM public.document_status WHERE name = 'manual';

    IF backoffice_status_id IS NOT NULL AND manual_status_id IS NOT NULL THEN
      UPDATE public.employee_documents ed
      SET document_status_id = backoffice_status_id,
          updated_at = now()
      FROM public.employee_verification_audit_log al
      WHERE ed.id = al.document_id
        AND ed.employee_id = al.employee_id
        AND al.is_verified_by_backoffice = 1
        AND ed.document_status_id = manual_status_id
        AND ed.verification_status = 'verified';
    END IF;
  END IF;
END $$;
