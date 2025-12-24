-- Create client_ip_whitelist table (idempotent)
-- This table stores whitelisted IP addresses for each client/school

CREATE TABLE IF NOT EXISTS public.client_ip_whitelist (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  client_id uuid NOT NULL,
  ip_address text NOT NULL,
  name text, -- Optional: Human-readable name for the IP (e.g., "Main Campus", "Branch Office")
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  is_active boolean DEFAULT true NOT NULL
);

-- Primary key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'client_ip_whitelist_pkey' AND conrelid = 'public.client_ip_whitelist'::regclass
  ) THEN
    ALTER TABLE public.client_ip_whitelist ADD CONSTRAINT client_ip_whitelist_pkey PRIMARY KEY (id);
  END IF;
END $$;

-- Foreign key to clients table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'client_ip_whitelist_client_id_fkey'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema='public' AND table_name='clients'
  ) THEN
    ALTER TABLE public.client_ip_whitelist
      ADD CONSTRAINT client_ip_whitelist_client_id_fkey
      FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Unique constraint: one IP per client (active IPs only)
-- Note: This allows same IP for different clients, but not duplicate IPs for same client
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'client_ip_whitelist_client_ip_unique'
  ) THEN
    ALTER TABLE public.client_ip_whitelist
      ADD CONSTRAINT client_ip_whitelist_client_ip_unique 
      UNIQUE (client_id, ip_address);
  END IF;
END $$;

-- Index for fast lookups by client_id (filtered by is_active)
CREATE INDEX IF NOT EXISTS idx_client_ip_whitelist_client_id 
  ON public.client_ip_whitelist(client_id) 
  WHERE is_active = true;

-- Index for fast lookups by ip_address (filtered by is_active)
CREATE INDEX IF NOT EXISTS idx_client_ip_whitelist_ip_address 
  ON public.client_ip_whitelist(ip_address) 
  WHERE is_active = true;

-- Index for client_id and is_active combination (for common queries)
CREATE INDEX IF NOT EXISTS idx_client_ip_whitelist_client_active 
  ON public.client_ip_whitelist(client_id, is_active) 
  WHERE is_active = true;

-- Comments
DO $$
BEGIN
  BEGIN
    COMMENT ON TABLE public.client_ip_whitelist IS 'Stores whitelisted IP addresses for each client/school. Only requests from these IPs are allowed to access the client portal.';
    COMMENT ON COLUMN public.client_ip_whitelist.ip_address IS 'IPv4 or IPv6 address (e.g., "203.0.113.1" or "2001:db8::1")';
    COMMENT ON COLUMN public.client_ip_whitelist.name IS 'Optional human-readable name for the IP address (e.g., "Main Campus", "Branch Office")';
    COMMENT ON COLUMN public.client_ip_whitelist.is_active IS 'If false, this IP is disabled but not deleted (for audit purposes)';
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;

