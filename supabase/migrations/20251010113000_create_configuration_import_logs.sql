-- Create a table to store configuration import logs
create table if not exists public.configuration_import_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  response_status text not null check (response_status in ('success','failed')),
  response_code integer not null,
  log jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Helpful index for querying by client and time
create index if not exists idx_configuration_import_logs_client_time
  on public.configuration_import_logs (client_id, created_at desc);











