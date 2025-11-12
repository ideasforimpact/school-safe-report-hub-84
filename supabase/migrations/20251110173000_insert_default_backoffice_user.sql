-- Insert default backoffice user
-- This migration inserts a default backoffice admin user with hashed password

DO $$
DECLARE
  default_email text := 'backofficesafeschool@gmail.com';
  default_password text := 'backoffice@1214';
  hashed_password text;
  user_exists boolean;
BEGIN
  -- Check if backoffice_users table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'backoffice_users'
  ) THEN
    -- Check if the default user already exists
    SELECT EXISTS(
      SELECT 1 FROM public.backoffice_users 
      WHERE email = default_email
    ) INTO user_exists;

    -- Only insert if user doesn't exist
    IF NOT user_exists THEN
      -- Hash the password using the hash_password function
      -- Check if hash_password function exists first
      IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname = 'hash_password'
      ) THEN
        -- Use the hash_password function
        SELECT public.hash_password(default_password) INTO hashed_password;
      ELSE
        -- Fallback: use pgcrypto directly if function doesn't exist yet
        -- This should not happen if migrations run in order, but safety check
        IF EXISTS (
          SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto'
        ) THEN
          SELECT crypt(default_password, gen_salt('bf')) INTO hashed_password;
        ELSE
          RAISE EXCEPTION 'pgcrypto extension not found and hash_password function not available';
        END IF;
      END IF;

      -- Insert the default backoffice user
      INSERT INTO public.backoffice_users (
        id,
        email,
        password,
        is_saas_admin,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        default_email,
        hashed_password,
        true,
        now(),
        now()
      );

      RAISE NOTICE 'Default backoffice user inserted: %', default_email;
    ELSE
      RAISE NOTICE 'Default backoffice user already exists: %', default_email;
    END IF;
  ELSE
    RAISE NOTICE 'backoffice_users table does not exist yet, skipping default user insertion';
  END IF;
END $$;

