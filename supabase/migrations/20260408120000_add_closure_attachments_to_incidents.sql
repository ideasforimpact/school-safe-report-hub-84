-- Store incident closure file metadata on incidents as JSON (id, name, path, updatedAt)
-- instead of a separate incident_closure_attachments table.

alter table public.incidents
  add column if not exists closure_attachments jsonb not null default '[]'::jsonb;

comment on column public.incidents.closure_attachments is
  'JSON array of objects: { "id": uuid, "name": string, "path": string, "updatedAt": ISO8601 }. Paths are keys in storage bucket incident-closure-attachments.';
