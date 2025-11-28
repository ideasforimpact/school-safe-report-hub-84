-- Function to enqueue acknowledgement update with attachments
-- This migration is idempotent and can be safely rerun

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
  -- Validate that pgmq is available
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.schemata
    WHERE schema_name = 'pgmq'
  ) THEN
    RAISE EXCEPTION 'pgmq schema does not exist. Please ensure pgmq extension is installed.';
  END IF;

  -- Send message to queue
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
'Enqueue grievance acknowledgement comment and evidence files for async processing. Requires pgmq extension.';

