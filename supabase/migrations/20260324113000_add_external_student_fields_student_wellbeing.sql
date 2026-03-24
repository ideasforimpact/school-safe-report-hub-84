-- Support external students in student well-being records when integration is enabled.
ALTER TABLE public.student_well_begin_management
  ADD COLUMN IF NOT EXISTS is_external_student boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS external_student_involved jsonb;

-- Internal records must reference local student_id.
-- External records must store details in external_student_involved and keep local FK columns null.
ALTER TABLE public.student_well_begin_management
  DROP CONSTRAINT IF EXISTS student_well_begin_management_external_mode_check;

ALTER TABLE public.student_well_begin_management
  ADD CONSTRAINT student_well_begin_management_external_mode_check
  CHECK (
    (
      is_external_student = true
      AND student_id IS NULL
      AND grade_id IS NULL
      AND section_id IS NULL
      AND external_student_involved IS NOT NULL
    )
    OR
    (
      is_external_student = false
      AND student_id IS NOT NULL
      AND external_student_involved IS NULL
    )
  );

-- Allow null student_id for external records.
ALTER TABLE public.student_well_begin_management
  ALTER COLUMN student_id DROP NOT NULL;

-- Backfill existing rows to internal mode.
UPDATE public.student_well_begin_management
SET
  is_external_student = false,
  external_student_involved = NULL
WHERE is_external_student IS DISTINCT FROM false
   OR external_student_involved IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_student_well_begin_management_is_external_student
  ON public.student_well_begin_management (is_external_student);
