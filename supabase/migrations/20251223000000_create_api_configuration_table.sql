-- Create api_configuration table
-- This table stores API keys and secret keys for client integrations
CREATE TABLE IF NOT EXISTS public.api_configuration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL,
    api_key TEXT NOT NULL UNIQUE,
    secret_key TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    CONSTRAINT fk_api_configuration_client_id FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE
);

-- Create index on client_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_api_configuration_client_id ON public.api_configuration(client_id);

-- Create index on api_key for faster lookups
CREATE INDEX IF NOT EXISTS idx_api_configuration_api_key ON public.api_configuration(api_key);

-- Create index on active status
CREATE INDEX IF NOT EXISTS idx_api_configuration_active ON public.api_configuration(active);

-- Add comment to table
COMMENT ON TABLE public.api_configuration IS 'Stores API keys and secret keys for client integrations with external systems';

-- Add comments to columns
COMMENT ON COLUMN public.api_configuration.client_id IS 'Client ID with foreign key reference to clients table';
COMMENT ON COLUMN public.api_configuration.api_key IS 'API key with prefix pk_1214';
COMMENT ON COLUMN public.api_configuration.secret_key IS 'SHA-256 encrypted secret key';
COMMENT ON COLUMN public.api_configuration.active IS 'Whether the API configuration is active';

