-- Add head-office support on clients
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS is_head_office boolean NOT NULL DEFAULT false;

-- Map head office clients to sub-clients
CREATE TABLE IF NOT EXISTS public.client_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  head_office_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  sub_client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT client_mappings_no_self_mapping CHECK (head_office_id <> sub_client_id),
  CONSTRAINT client_mappings_unique_pair UNIQUE (head_office_id, sub_client_id)
);

CREATE INDEX IF NOT EXISTS idx_client_mappings_head_office_id
  ON public.client_mappings(head_office_id);

CREATE INDEX IF NOT EXISTS idx_client_mappings_sub_client_id
  ON public.client_mappings(sub_client_id);
