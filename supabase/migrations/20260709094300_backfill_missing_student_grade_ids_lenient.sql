-- Mirrors 20260709093200 (lenient section_id backfill) but for grade_id: some
-- students.grade text is abbreviated/non-exact relative to grades.name (the same
-- failure mode that left section_id null for abbreviated section text, e.g. "B"
-- vs "Section B"), so the strict backfill in 20260709093000 missed them.
--
-- Both section_id backfill passes require grade_id to already be set, so any row
-- still missing grade_id here would have been permanently stuck with a null
-- section_id too - even when the section text itself was fine. This migration
-- fills grade_id leniently first, then re-runs the section_id resolution so rows
-- that just got a grade_id can also resolve their section_id in the same pass.
--
-- Same safety rule as the section pass: only apply a lenient match when it is
-- the single unambiguous candidate for that student's campus - otherwise leave
-- the row untouched rather than guessing.

DO $$
BEGIN
  -- Lenient grade_id backfill, scoped to the student's own campus_id.
  UPDATE public.students s
  SET grade_id = (
    SELECT g.id
    FROM public.grades g
    WHERE g.campus_id = s.campus_id
      AND g.client_id = s.client_id
      AND (
        lower(trim(g.name)) = lower(trim(s.grade))
        OR lower(trim(g.name)) = lower('grade ' || trim(s.grade))
        OR lower(trim(g.name)) LIKE '%' || lower(trim(s.grade))
      )
  )
  WHERE s.grade_id IS NULL
    AND s.grade IS NOT NULL
    AND trim(s.grade) <> ''
    AND s.campus_id IS NOT NULL
    AND (
      SELECT count(*)
      FROM public.grades g2
      WHERE g2.campus_id = s.campus_id
        AND g2.client_id = s.client_id
        AND (
          lower(trim(g2.name)) = lower(trim(s.grade))
          OR lower(trim(g2.name)) = lower('grade ' || trim(s.grade))
          OR lower(trim(g2.name)) LIKE '%' || lower(trim(s.grade))
        )
    ) = 1;

  -- Re-run section_id resolution (same rule as 20260709093200) now that some
  -- rows above may have just received a grade_id for the first time.
  UPDATE public.students s
  SET section_id = (
    SELECT sec.id
    FROM public.sections sec
    WHERE sec.grade_id = s.grade_id
      AND sec.client_id = s.client_id
      AND (
        lower(trim(sec.name)) = lower(trim(s.section))
        OR lower(trim(sec.name)) = lower('section ' || trim(s.section))
        OR lower(trim(sec.name)) LIKE '%' || lower(trim(s.section))
      )
  )
  WHERE s.section_id IS NULL
    AND s.section IS NOT NULL
    AND trim(s.section) <> ''
    AND s.grade_id IS NOT NULL
    AND (
      SELECT count(*)
      FROM public.sections sec2
      WHERE sec2.grade_id = s.grade_id
        AND sec2.client_id = s.client_id
        AND (
          lower(trim(sec2.name)) = lower(trim(s.section))
          OR lower(trim(sec2.name)) = lower('section ' || trim(s.section))
          OR lower(trim(sec2.name)) LIKE '%' || lower(trim(s.section))
        )
    ) = 1;
END $$;
