-- Audit trail for committee compliance operations
create table if not exists public.committee_audit_log (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  committee_id uuid null references public.committees(id) on delete set null,
  event_id uuid null references public.committee_events(id) on delete set null,
  changed_by uuid null references public.employees(id) on delete set null,
  action_type text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_committee_audit_log_client_created
  on public.committee_audit_log (client_id, created_at desc);

create index if not exists idx_committee_audit_log_committee
  on public.committee_audit_log (committee_id);

create index if not exists idx_committee_audit_log_event
  on public.committee_audit_log (event_id);

alter table public.committee_audit_log enable row level security;

drop policy if exists "committee_audit_log_select_client" on public.committee_audit_log;
create policy "committee_audit_log_select_client"
  on public.committee_audit_log
  for select
  using (
    client_id in (
      select e.client_id
      from public.employees e
      where e.user_id = auth.uid()
        and e.status = true
    )
  );

