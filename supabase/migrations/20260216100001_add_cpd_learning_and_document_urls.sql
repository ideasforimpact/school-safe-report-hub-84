-- Add cpd_learning (text) after category and document_urls (jsonb) to cpd_entries

ALTER TABLE public.cpd_entries
  ADD COLUMN IF NOT EXISTS cpd_learning text;

ALTER TABLE public.cpd_entries
  ADD COLUMN IF NOT EXISTS document_urls jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.cpd_entries.cpd_learning IS 'What did you learn (optional, 2-2000 chars)';
COMMENT ON COLUMN public.cpd_entries.document_urls IS 'Array of { path, name } for files in cpd_learning_attachments bucket';
