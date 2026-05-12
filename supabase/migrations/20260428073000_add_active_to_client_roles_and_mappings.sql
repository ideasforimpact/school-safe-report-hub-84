-- Add active status flags for RBAC role/mapping filtering.
ALTER TABLE public.client_roles
ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

ALTER TABLE public.client_mappings
ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

-- Defensive backfill in case column existed without NOT NULL/default.
UPDATE public.client_roles
SET active = true
WHERE active IS NULL;

UPDATE public.client_mappings
SET active = true
WHERE active IS NULL;

CREATE INDEX IF NOT EXISTS idx_client_roles_active
  ON public.client_roles(active);

CREATE INDEX IF NOT EXISTS idx_client_mappings_head_office_id_active
  ON public.client_mappings(head_office_id, active);

CREATE INDEX IF NOT EXISTS idx_client_mappings_sub_client_id_active
  ON public.client_mappings(sub_client_id, active);
