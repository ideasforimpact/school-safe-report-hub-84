-- Add youtube_link column to edusafe_resources table
-- This migration is conditional to avoid errors if the table doesn't exist yet

DO $$
BEGIN
  -- Check if the edusafe_resources table exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'edusafe_resources'
  ) THEN
    -- Add column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'edusafe_resources' 
      AND column_name = 'youtube_link'
    ) THEN
      ALTER TABLE "public"."edusafe_resources" 
      ADD COLUMN "youtube_link" text;

-- Add comment to describe the column
      COMMENT ON COLUMN "public"."edusafe_resources"."youtube_link" IS 'YouTube URL for video resources';
    END IF;
  END IF;
END $$;
