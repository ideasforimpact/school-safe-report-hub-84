-- Create assessment_assignees table
-- Fan-out table letting one assessment be assigned to multiple employees,
-- each with their own independent progress (answers/status/completion).
-- Modeled on sop_signoff_request (per-employee completion tracking).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'assessment_assignees'
  ) THEN
    CREATE TABLE public.assessment_assignees (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      assessment_id uuid NOT NULL,
      employee_id uuid NOT NULL,
      client_id uuid NOT NULL,
      assigned_by uuid,
      status text DEFAULT 'New'::text NOT NULL,
      answers jsonb DEFAULT '[]'::jsonb NOT NULL,
      score integer DEFAULT 0,
      completed_by uuid,
      completed_on timestamptz,
      closure_comments text,
      rework_comments text,
      unassigned_at timestamptz,
      created_at timestamptz DEFAULT now() NOT NULL,
      updated_at timestamptz DEFAULT now() NOT NULL,
      CONSTRAINT assessment_assignees_pkey PRIMARY KEY (id),
      CONSTRAINT assessment_assignees_status_check CHECK (
        status = ANY (ARRAY['New'::text, 'Draft'::text, 'In Progress'::text, 'Submitted'::text, 'Completed'::text])
      ),
      CONSTRAINT assessment_assignees_unique UNIQUE (assessment_id, employee_id)
    );

    COMMENT ON TABLE public.assessment_assignees IS 'One row per (assessment, assignee): tracks each assignee''s own answers/status/completion for multi-assignee assessments';
  END IF;
END $$;

-- Add foreign key constraints
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='assessments')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='assessment_assignees_assessment_id_fkey') THEN
    ALTER TABLE public.assessment_assignees
      ADD CONSTRAINT assessment_assignees_assessment_id_fkey
      FOREIGN KEY (assessment_id) REFERENCES public.assessments(id) ON DELETE CASCADE;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='employees')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='assessment_assignees_employee_id_fkey') THEN
    ALTER TABLE public.assessment_assignees
      ADD CONSTRAINT assessment_assignees_employee_id_fkey
      FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='clients')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='assessment_assignees_client_id_fkey') THEN
    ALTER TABLE public.assessment_assignees
      ADD CONSTRAINT assessment_assignees_client_id_fkey
      FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='employees')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='assessment_assignees_assigned_by_fkey') THEN
    ALTER TABLE public.assessment_assignees
      ADD CONSTRAINT assessment_assignees_assigned_by_fkey
      FOREIGN KEY (assigned_by) REFERENCES public.employees(id) ON DELETE SET NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='employees')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='assessment_assignees_completed_by_fkey') THEN
    ALTER TABLE public.assessment_assignees
      ADD CONSTRAINT assessment_assignees_completed_by_fkey
      FOREIGN KEY (completed_by) REFERENCES public.employees(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_assessment_assignees_assessment_id ON public.assessment_assignees (assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_assignees_employee_id ON public.assessment_assignees (employee_id);
CREATE INDEX IF NOT EXISTS idx_assessment_assignees_client_id ON public.assessment_assignees (client_id);
CREATE INDEX IF NOT EXISTS idx_assessment_assignees_status ON public.assessment_assignees (status);
