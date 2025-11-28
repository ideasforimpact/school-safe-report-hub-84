-- Add comments_attachment column to form_submissions for acknowledgement evidence
-- This migration is idempotent and can be safely rerun

alter table public.form_submissions
add column if not exists comments_attachment jsonb;

comment on column public.form_submissions.comments_attachment is 'Evidence files uploaded during grievance acknowledgement. Format: [{"filename": "...", "url": "bucket/path", "path": "bucket/path", "size": 1234}]';

