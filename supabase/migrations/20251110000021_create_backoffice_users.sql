-- Create backoffice_users table
-- This migration creates the backoffice_users table with all columns and constraints from remote_backup.sql

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'backoffice_users'
  ) THEN
    CREATE TABLE IF NOT EXISTS public.backoffice_users (
      id uuid DEFAULT gen_random_uuid() NOT NULL,
      email text NOT NULL,
      password text NOT NULL,
      is_saas_admin boolean DEFAULT true NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL,
      last_signed_in timestamp with time zone,
      auth_user_id uuid,
      CONSTRAINT backoffice_users_pkey PRIMARY KEY (id),
      CONSTRAINT backoffice_users_email_key UNIQUE (email)
    );

    -- Add foreign key constraint
    -- Production: ON DELETE SET NULL (not CASCADE)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
      -- Drop existing constraint if it has wrong ON DELETE action
      IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'backoffice_users_auth_user_id_fkey'
        AND conrelid = 'public.backoffice_users'::regclass
        AND confdeltype != 'n'  -- 'n' = SET NULL
      ) THEN
        ALTER TABLE public.backoffice_users DROP CONSTRAINT IF EXISTS backoffice_users_auth_user_id_fkey;
      END IF;
      
      -- Create constraint with correct ON DELETE action
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'backoffice_users_auth_user_id_fkey' 
        AND table_schema = 'public' 
        AND table_name = 'backoffice_users'
      ) THEN
        ALTER TABLE public.backoffice_users 
        ADD CONSTRAINT backoffice_users_auth_user_id_fkey 
        FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
      END IF;
    END IF;
  END IF;
END $$;

