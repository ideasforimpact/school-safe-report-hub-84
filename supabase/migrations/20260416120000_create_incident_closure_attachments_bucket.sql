-- Create storage bucket for incident closure attachments
-- This migration is idempotent and can be safely rerun

insert into storage.buckets (id, name, public)
values ('incident-closure-attachments', 'incident-closure-attachments', true)
on conflict (id) do nothing;

