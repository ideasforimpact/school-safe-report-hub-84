DO $$
DECLARE
  full_access_role_id uuid;
  read_only_role_id uuid;
BEGIN
  -- 1) client_roles table
  CREATE TABLE IF NOT EXISTS public.client_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    access_level text NOT NULL UNIQUE CHECK (access_level IN ('W/R', 'R')),
    name text NOT NULL UNIQUE CHECK (name IN ('full_access', 'read_only')),
    created_at timestamptz NOT NULL DEFAULT now()
  );

  -- Seed canonical roles (idempotent)
  INSERT INTO public.client_roles (access_level, name)
  VALUES ('W/R', 'full_access')
  ON CONFLICT (access_level) DO UPDATE SET name = EXCLUDED.name;

  INSERT INTO public.client_roles (access_level, name)
  VALUES ('R', 'read_only')
  ON CONFLICT (access_level) DO UPDATE SET name = EXCLUDED.name;

  SELECT id INTO full_access_role_id
  FROM public.client_roles
  WHERE access_level = 'W/R'
  LIMIT 1;

  SELECT id INTO read_only_role_id
  FROM public.client_roles
  WHERE access_level = 'R'
  LIMIT 1;

  -- 2) clients.client_role_id
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'clients'
      AND column_name = 'client_role_id'
  ) THEN
    ALTER TABLE public.clients ADD COLUMN client_role_id uuid;
  END IF;

  ALTER TABLE public.clients
  DROP CONSTRAINT IF EXISTS clients_client_role_id_fkey;

  ALTER TABLE public.clients
  ADD CONSTRAINT clients_client_role_id_fkey
  FOREIGN KEY (client_role_id) REFERENCES public.client_roles(id);

  IF full_access_role_id IS NOT NULL THEN
    UPDATE public.clients
    SET client_role_id = full_access_role_id
    WHERE client_role_id IS NULL;
  END IF;

  -- 3) user_client_context table + target_client_id rename compatibility
  CREATE TABLE IF NOT EXISTS public.user_client_context (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    home_client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    target_client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    role_id uuid NOT NULL REFERENCES public.client_roles(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_client_context'
      AND column_name = 'active_client_id'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_client_context'
      AND column_name = 'target_client_id'
  ) THEN
    ALTER TABLE public.user_client_context
    RENAME COLUMN active_client_id TO target_client_id;
  END IF;

  -- Ensure role_id column exists for older partial table variants
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_client_context'
      AND column_name = 'role_id'
  ) THEN
    ALTER TABLE public.user_client_context ADD COLUMN role_id uuid;
  END IF;

  ALTER TABLE public.user_client_context
  DROP CONSTRAINT IF EXISTS user_client_context_role_id_fkey;

  ALTER TABLE public.user_client_context
  ADD CONSTRAINT user_client_context_role_id_fkey
  FOREIGN KEY (role_id) REFERENCES public.client_roles(id);

  -- Backfill switched context roles to read_only by default
  IF read_only_role_id IS NOT NULL THEN
    UPDATE public.user_client_context
    SET role_id = read_only_role_id
    WHERE role_id IS NULL;

    EXECUTE format(
      'ALTER TABLE public.user_client_context ALTER COLUMN role_id SET DEFAULT %L::uuid',
      read_only_role_id::text
    );
  END IF;

  CREATE INDEX IF NOT EXISTS idx_user_client_context_home_client_id
    ON public.user_client_context(home_client_id);
  CREATE INDEX IF NOT EXISTS idx_user_client_context_target_client_id
    ON public.user_client_context(target_client_id);
END $$;

