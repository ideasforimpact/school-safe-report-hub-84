-- Add client_type_id to students table

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'students'
      AND column_name = 'client_type_id'
  ) THEN
    ALTER TABLE public.students
    ADD COLUMN client_type_id uuid REFERENCES public.client_type(id) ON DELETE SET NULL;

    CREATE INDEX IF NOT EXISTS idx_students_client_type_id
      ON public.students USING btree (client_type_id);

    RAISE NOTICE 'Added client_type_id to students table';
  ELSE
    RAISE NOTICE 'client_type_id already exists on students table';
  END IF;
END $$;
