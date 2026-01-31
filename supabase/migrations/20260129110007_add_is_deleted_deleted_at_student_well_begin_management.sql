-- Add soft-delete columns to student_well_begin_management
-- is_deleted: boolean, default false
-- deleted_at: timestamp with time zone, nullable (no default)

ALTER TABLE public.student_well_begin_management
  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false;

ALTER TABLE public.student_well_begin_management
  ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone NULL;

COMMENT ON COLUMN public.student_well_begin_management.is_deleted IS 'Soft delete flag; when true, record is considered deleted';
COMMENT ON COLUMN public.student_well_begin_management.deleted_at IS 'When the record was soft-deleted; null if not deleted';
