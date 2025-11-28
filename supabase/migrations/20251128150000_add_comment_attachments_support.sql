-- Create storage bucket for form submission comment attachments
insert into storage.buckets (id, name, public)
values ('form_submission_comment_attachements', 'form_submission_comment_attachements', true)
on conflict (id) do nothing;

-- Disable effective RLS restrictions for this bucket by allowing public access
DO $$
BEGIN
  -- Ensure storage.objects exists before touching policies
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'storage'
      AND table_name = 'objects'
  ) THEN
    -- Allow public read/write for this specific bucket
    DROP POLICY IF EXISTS "Public access for form_submission_comment_attachements" ON storage.objects;
    CREATE POLICY "Public access for form_submission_comment_attachements"
    ON storage.objects
    FOR ALL
    TO public
    USING (bucket_id = 'form_submission_comment_attachements')
    WITH CHECK (bucket_id = 'form_submission_comment_attachements');
  END IF;
END $$;

-- Add comments_attachment column to form_submissions for acknowledgement evidence
alter table public.form_submissions
add column if not exists comments_attachment jsonb;

comment on column public.form_submissions.comments_attachment is 'Evidence files uploaded during grievance acknowledgement';

-- Create queue for processing acknowledgement comment attachments (conditional on pgmq)
DO $$
BEGIN
  -- Check if pgmq schema exists
  IF EXISTS (
    SELECT 1
    FROM information_schema.schemata
    WHERE schema_name = 'pgmq'
  ) THEN
    -- Try to create the queue if it doesn't already exist
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pgmq.meta
        WHERE queue_name = 'form_submission_comment_attachements'
      ) THEN
        PERFORM pgmq.create('form_submission_comment_attachements');
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        -- If meta table doesn't exist or any other error, try to create queue anyway
        BEGIN
          PERFORM pgmq.create('form_submission_comment_attachements');
        EXCEPTION
          WHEN OTHERS THEN
            -- Queue might already exist, ignore
            NULL;
        END;
    END;
  END IF;
END $$;

-- Function to enqueue acknowledgement update with attachments
create or replace function public.queue_form_submission_comment_attachments(
  p_submission_id uuid,
  p_comments text,
  p_files jsonb
)
returns void
language plpgsql
security definer
as $$
begin
  perform pgmq.send(
    'form_submission_comment_attachements',
    jsonb_build_object(
      'submission_id', p_submission_id,
      'comments', p_comments,
      'files', coalesce(p_files, '[]'::jsonb)
    )
  );
end;
$$;

comment on function public.queue_form_submission_comment_attachments is
'Enqueue grievance acknowledgement comment and evidence files for async processing';


