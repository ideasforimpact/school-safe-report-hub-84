BEGIN;

-- 1️⃣ Ensure there are no duplicate client_id rows
-- (Important safeguard before adding UNIQUE constraint)
DELETE FROM public.client_integration a
USING public.client_integration b
WHERE a.client_id = b.client_id
  AND a.created_at < b.created_at;

ALTER TABLE public.client_integration
ADD CONSTRAINT client_integration_client_id_unique UNIQUE (client_id);

COMMIT;
