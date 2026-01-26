-- Create sop_categories table
-- This migration creates the sop_categories table with default categories

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'sop_categories'
  ) THEN
    CREATE TABLE IF NOT EXISTS public.sop_categories (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      category_name text NOT NULL,
      client_id uuid,
      employee_id uuid,
      created_at timestamptz DEFAULT now() NOT NULL,
      updated_at timestamptz DEFAULT now() NOT NULL,
      CONSTRAINT sop_categories_pkey PRIMARY KEY (id)
    );

    -- Add comment
    COMMENT ON TABLE public.sop_categories IS 'Stores SOP categories';
  END IF;
END $$;

-- Add foreign key constraints
DO $$
BEGIN
  -- FK to clients table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='clients')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='sop_categories_client_id_fkey') THEN
    ALTER TABLE public.sop_categories
      ADD CONSTRAINT sop_categories_client_id_fkey
      FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
  END IF;

  -- FK to employees table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='employees')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='sop_categories_employee_id_fkey') THEN
    ALTER TABLE public.sop_categories
      ADD CONSTRAINT sop_categories_employee_id_fkey
      FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sop_categories_client_id ON public.sop_categories (client_id);
CREATE INDEX IF NOT EXISTS idx_sop_categories_employee_id ON public.sop_categories (employee_id);

-- Insert default categories (with null client_id and employee_id)
DO $$
DECLARE
  category_names text[] := ARRAY[
    'Emergency Procedures',
    'Health & Safety',
    'Security Protocols',
    'Operations'
  ];
  cat_name text;
BEGIN
  FOREACH cat_name IN ARRAY category_names
  LOOP
    -- Check if category already exists
    IF NOT EXISTS (
      SELECT 1 FROM public.sop_categories 
      WHERE sop_categories.category_name = cat_name 
      AND sop_categories.client_id IS NULL 
      AND sop_categories.employee_id IS NULL
    ) THEN
      INSERT INTO public.sop_categories (category_name, client_id, employee_id, created_at, updated_at)
      VALUES (cat_name, NULL, NULL, NOW(), NOW());
    END IF;
  END LOOP;
END $$;

