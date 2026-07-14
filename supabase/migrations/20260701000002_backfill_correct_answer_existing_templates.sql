-- Backfill correctAnswer for all existing assessment template questions across all clients.
-- Also updates question text for 8 questions that were rephrased to a "no" answer
-- in the default import templates (so existing imported clients stay in sync).
--
-- Logic per question:
--   1. Already has correctAnswer  → leave untouched (idempotent).
--   2. Old text that was rephrased → overwrite text with new wording + set "no".
--   3. Text unchanged but answer is "no" (3 original no-questions) → set "no".
--   4. Everything else → set "yes".
--
-- Rephrased questions (old DB text → new text, correctAnswer "no"):
--   • Transportation Q8  : "Have driver behavior and speed limits been reviewed…"
--   • Child Protection Q8: "Have all reported incidents or complaints (if any) been recorded…"
--   • Health & Hygiene Q3: "Are waste segregation practices…"
--   • Student Safety Q9  : "Have incident reports related to student safety…"
--   • Emergency Prep Q8  : "Have all emergency related incidents, near misses…been reviewed…"
--   • Workplace Safety Q7: "Are incident and near-miss reports being recorded…"
--   • Harassment Q5      : "Are complaints addressed within defined SLAs…"
--   • Campus Safety Q6   : "Is access control implemented at campus entry/exit…"
--
-- Unchanged "no" questions:
--   • Cyber Safety Q4   : "Have there been any cyber incidents or near misses…"
--   • Environmental Q1  : "Are there any damaged or leaning trees…"
--   • Vehicle Check Q13 : "Are there any visible fuel or fluid leaks?"

UPDATE public.assessment_templates
SET questions = normalized.questions
FROM (
  SELECT
    t.id,
    (
      SELECT jsonb_agg(
        CASE
          -- ── 1. Already has correctAnswer — leave untouched ────────────────
          WHEN question ? 'correctAnswer' THEN question

          -- ── 2. Rephrased questions: update text + set "no" ────────────────

          -- Transportation Q8
          WHEN lower(question->>'text') LIKE '%have driver behavior and speed limits been reviewed%'
          THEN question || jsonb_build_object(
            'text', 'Have any speed limit violations or unsafe driver behaviours been identified and left unaddressed in the last 6 months?',
            'correctAnswer', 'no'
          )

          -- Child Protection Q8
          WHEN lower(question->>'text') LIKE '%have all reported incidents or complaints (if any) been recorded, investigated%'
          THEN question || jsonb_build_object(
            'text', 'Have any child protection complaints or incidents been left uninvestigated or unresolved in the last 6 months?',
            'correctAnswer', 'no'
          )

          -- Health & Hygiene Q3
          WHEN lower(question->>'text') LIKE '%are waste segregation practices%'
          THEN question || jsonb_build_object(
            'text', 'Have any food safety or hygiene violations been identified and left unaddressed in the last 6 months?',
            'correctAnswer', 'no'
          )

          -- Student Physical Safety Q9
          WHEN lower(question->>'text') LIKE '%have incident reports related to student safety%'
          THEN question || jsonb_build_object(
            'text', 'Have any student safety incidents or near-misses been left without corrective action in the last 6 months?',
            'correctAnswer', 'no'
          )

          -- Emergency Preparedness Q8
          WHEN lower(question->>'text') LIKE '%have all emergency related incidents, near misses, or emergency drills been reviewed%'
          THEN question || jsonb_build_object(
            'text', 'Have any critical emergency preparedness gaps identified in drills or reviews been left unresolved?',
            'correctAnswer', 'no'
          )

          -- Workplace Safety Q7
          WHEN lower(question->>'text') LIKE '%are incident and near-miss reports being recorded%'
          THEN question || jsonb_build_object(
            'text', 'Have any workplace injuries or safety incidents occurred that were not reported or investigated?',
            'correctAnswer', 'no'
          )

          -- Harassment & Discrimination Q5
          WHEN lower(question->>'text') LIKE '%are complaints addressed within defined sla%'
          THEN question || jsonb_build_object(
            'text', 'Have any harassment or discrimination complaints been closed without proper investigation or documentation?',
            'correctAnswer', 'no'
          )

          -- Campus Safety Q6
          WHEN lower(question->>'text') LIKE '%is access control implemented at campus entry%'
          THEN question || jsonb_build_object(
            'text', 'Have any campus safety incidents or near-misses been left without corrective action in the last 12 months?',
            'correctAnswer', 'no'
          )

          -- ── 3. Unchanged "no" questions — just add correctAnswer ───────────

          WHEN lower(question->>'text') LIKE '%have there been any cyber incident%'
            OR lower(question->>'text') LIKE '%are there any damaged or leaning tree%'
            OR lower(question->>'text') LIKE '%are there any visible fuel or fluid leak%'
          THEN question || jsonb_build_object('correctAnswer', 'no')

          -- ── 4. Default: all other questions → "yes" ───────────────────────
          ELSE question || jsonb_build_object('correctAnswer', 'yes')
        END
        ORDER BY ordinality
      )
      FROM jsonb_array_elements(t.questions) WITH ORDINALITY AS items(question, ordinality)
    ) AS questions
  FROM public.assessment_templates t
  WHERE jsonb_typeof(t.questions) = 'array'
) AS normalized
WHERE public.assessment_templates.id = normalized.id
  AND jsonb_typeof(public.assessment_templates.questions) = 'array'
  AND public.assessment_templates.questions IS DISTINCT FROM normalized.questions;
