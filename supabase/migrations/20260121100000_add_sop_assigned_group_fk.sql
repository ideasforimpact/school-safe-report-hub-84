-- Add missing foreign key from sop_assigned.group_id to groups.id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'sop_assigned'
      AND column_name = 'group_id'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema = kcu.table_schema
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'sop_assigned'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND tc.constraint_name = 'sop_assigned_group_id_fkey'
  ) THEN
    ALTER TABLE public.sop_assigned
      ADD CONSTRAINT sop_assigned_group_id_fkey
      FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE CASCADE;
  END IF;
END $$;







