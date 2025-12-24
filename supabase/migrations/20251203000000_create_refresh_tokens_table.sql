-- Create refresh_tokens table for SafeSchool Auth Service
-- Stores hashed refresh tokens with metadata for token management

CREATE TABLE IF NOT EXISTS public.refresh_tokens (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  device_info jsonb DEFAULT '{}'::jsonb,
  issued_by text
);

-- Primary key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'refresh_tokens_pkey'
  ) THEN
    ALTER TABLE public.refresh_tokens ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);
  END IF;
END $$;

-- Foreign key to employees table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='employees')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='refresh_tokens_user_id_fkey') THEN
    ALTER TABLE public.refresh_tokens
      ADD CONSTRAINT refresh_tokens_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.employees(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON public.refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON public.refresh_tokens (token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON public.refresh_tokens (expires_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_revoked ON public.refresh_tokens (revoked);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_revoked ON public.refresh_tokens (user_id, revoked);

-- Composite index for common query pattern (lookup by hash and revoked status)
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash_revoked ON public.refresh_tokens (token_hash, revoked) 
  WHERE revoked = false;

-- Comments
COMMENT ON TABLE public.refresh_tokens IS 'Stores hashed refresh tokens for SafeSchool Auth Service';
COMMENT ON COLUMN public.refresh_tokens.token_hash IS 'HMAC-SHA256 hash of the refresh token (never store raw tokens)';
COMMENT ON COLUMN public.refresh_tokens.device_info IS 'JSON metadata about the device/client that requested the token';
COMMENT ON COLUMN public.refresh_tokens.issued_by IS 'Endpoint or service that issued this token (e.g., auth-info, auth-refresh)';

