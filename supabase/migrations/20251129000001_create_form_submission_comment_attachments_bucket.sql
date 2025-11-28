-- Create storage bucket for form submission comment attachments
-- This migration is idempotent and can be safely rerun

insert into storage.buckets (id, name, public)
values ('form_submission_comment_attachements', 'form_submission_comment_attachements', true)
on conflict (id) do nothing;

