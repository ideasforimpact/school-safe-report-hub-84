-- Add client_id column to form_submissions if it doesn't exist
ALTER TABLE public.form_submissions
	ADD COLUMN IF NOT EXISTS client_id UUID;

-- Also add submitter_phone column if it doesn't exist
ALTER TABLE public.form_submissions
	ADD COLUMN IF NOT EXISTS submitter_phone VARCHAR(50);

-- Also add submitter_type column if it doesn't exist
ALTER TABLE public.form_submissions
	ADD COLUMN IF NOT EXISTS submitter_type VARCHAR(50);

-- Also add attachments column if it doesn't exist
ALTER TABLE public.form_submissions
	ADD COLUMN IF NOT EXISTS attachments JSONB;

-- Backfill client_id from related custom_forms
UPDATE public.form_submissions fs
SET client_id = cf.client_id
FROM public.custom_forms cf
WHERE fs.form_id = cf.id
	AND fs.client_id IS NULL;

-- Add FK constraint to clients(id) if not exists
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM information_schema.constraint_column_usage
		WHERE table_schema = 'public'
			AND table_name = 'form_submissions'
			AND constraint_name = 'form_submissions_client_id_fkey'
	) THEN
		ALTER TABLE public.form_submissions
			ADD CONSTRAINT form_submissions_client_id_fkey
			FOREIGN KEY (client_id)
			REFERENCES public.clients(id)
			ON DELETE CASCADE;
	END IF;
END $$;

-- Create index on client_id
CREATE INDEX IF NOT EXISTS idx_form_submissions_client_id ON public.form_submissions(client_id);

-- Create a trigger to auto-populate client_id from custom_forms on insert if not provided
CREATE OR REPLACE FUNCTION public.set_form_submission_client_id()
RETURNS trigger AS $$
BEGIN
	IF NEW.client_id IS NULL THEN
		SELECT client_id INTO NEW.client_id FROM public.custom_forms WHERE id = NEW.form_id;
	END IF;
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure a single trigger instance
DROP TRIGGER IF EXISTS trg_set_form_submission_client_id ON public.form_submissions;
CREATE TRIGGER trg_set_form_submission_client_id
	BEFORE INSERT ON public.form_submissions
	FOR EACH ROW
	EXECUTE FUNCTION public.set_form_submission_client_id(); 