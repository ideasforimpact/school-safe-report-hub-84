-- Per-client AI feature flags (feature_key e.g. incident_recommended_actions — not API keys)
CREATE TABLE IF NOT EXISTS public.client_ai_features (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  client_id uuid NOT NULL,
  feature_key text NOT NULL,
  enabled boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'client_ai_features_pkey' AND conrelid = 'public.client_ai_features'::regclass
  ) THEN
    ALTER TABLE public.client_ai_features ADD CONSTRAINT client_ai_features_pkey PRIMARY KEY (id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'client_ai_features_client_id_fkey'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'clients'
  ) THEN
    ALTER TABLE public.client_ai_features
      ADD CONSTRAINT client_ai_features_client_id_fkey
      FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'client_ai_features_client_id_feature_key_key'
  ) THEN
    ALTER TABLE public.client_ai_features
      ADD CONSTRAINT client_ai_features_client_id_feature_key_key UNIQUE (client_id, feature_key);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_client_ai_features_client_id ON public.client_ai_features(client_id);
CREATE INDEX IF NOT EXISTS idx_client_ai_features_client_feature ON public.client_ai_features(client_id, feature_key);

COMMENT ON TABLE public.client_ai_features IS 'Enabled/disabled flags per AI feature per client; feature_key is a stable string (e.g. incident_recommended_actions).';
COMMENT ON COLUMN public.client_ai_features.feature_key IS 'Stable feature identifier, not an API key.';

-- Backfill: all existing clients get incident recommended actions enabled
INSERT INTO public.client_ai_features (client_id, feature_key, enabled)
SELECT c.id, 'incident_recommended_actions', true
FROM public.clients c
ON CONFLICT (client_id, feature_key) DO NOTHING;

ALTER TABLE public.client_ai_features ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client_ai_features_select_tenant_or_backoffice" ON public.client_ai_features;
CREATE POLICY "client_ai_features_select_tenant_or_backoffice" ON public.client_ai_features
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      client_id IN (
        SELECT e.client_id FROM public.employees e WHERE e.user_id = auth.uid() LIMIT 1
      )
      OR public.is_current_user_backoffice_admin() = true
    )
  );

-- No INSERT/UPDATE/DELETE for authenticated users: managed via service role (edge functions)
