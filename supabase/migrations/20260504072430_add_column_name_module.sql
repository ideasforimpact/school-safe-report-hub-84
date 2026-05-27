DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'refresh_tokens'
    AND column_name = 'module'
  ) THEN
    ALTER TABLE refresh_tokens ADD COLUMN module TEXT;
  END IF;
END $$;