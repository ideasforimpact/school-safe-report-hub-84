ALTER TABLE public.edusafe_resources
  ADD COLUMN IF NOT EXISTS file_size bigint;
