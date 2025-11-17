-- Ensure foreign key relationship between client_modules and modules exists
-- This is required for PostgREST nested selects like modules(id,name)

DO $$
BEGIN
  -- Check if modules table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='modules') THEN
    
    -- Check if client_modules table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='client_modules') THEN
      
      -- Drop existing constraint if it exists with wrong name or configuration
      IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public.client_modules'::regclass 
        AND confrelid = 'public.modules'::regclass
        AND contype = 'f'
        AND conname != 'client_modules_module_id_fkey'
      ) THEN
        -- Drop any incorrectly named FK
        EXECUTE (
          SELECT 'ALTER TABLE public.client_modules DROP CONSTRAINT ' || conname
          FROM pg_constraint 
          WHERE conrelid = 'public.client_modules'::regclass 
          AND confrelid = 'public.modules'::regclass
          AND contype = 'f'
          AND conname != 'client_modules_module_id_fkey'
          LIMIT 1
        );
      END IF;
      
      -- Create the foreign key if it doesn't exist
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'client_modules_module_id_fkey'
        AND conrelid = 'public.client_modules'::regclass
      ) THEN
        ALTER TABLE public.client_modules
          ADD CONSTRAINT client_modules_module_id_fkey
          FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Created foreign key: client_modules.module_id -> modules.id';
      ELSE
        RAISE NOTICE 'Foreign key already exists: client_modules.module_id -> modules.id';
      END IF;
      
      -- Refresh PostgREST schema cache
      PERFORM pg_notify('pgrst', 'reload schema');
      RAISE NOTICE 'PostgREST schema cache refresh requested';
      
    END IF;
  END IF;
END $$;
