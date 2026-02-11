do $$
begin
  if not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'employee_verification_audit_log'
  ) then
    create table public.employee_verification_audit_log (
      id uuid primary key default gen_random_uuid(),

      employee_id uuid not null,
      document_id uuid not null,
      provider text not null,

      latest_success_log jsonb,
      latest_error_log jsonb,

      audit_success_log jsonb default '[]'::jsonb,
      audit_error_log jsonb default '[]'::jsonb,

      both_fallback boolean default false,
      latest_status_code integer,

      created_at timestamptz default now(),
      updated_at timestamptz default now()
    );
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'employee_verification_audit_log'
      and column_name = 'both_fallback'
  ) then
    alter table public.employee_verification_audit_log
      add column both_fallback boolean default false;
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'employee_verification_audit_log'
      and column_name = 'latest_status_code'
  ) then
    alter table public.employee_verification_audit_log
      add column latest_status_code integer;
  end if;

  if not exists (
    select 1
    from information_schema.table_constraints
    where constraint_name = 'uq_employee_verification_audit_employee_document'
      and table_name = 'employee_verification_audit_log'
  ) then
    alter table public.employee_verification_audit_log
      add constraint uq_employee_verification_audit_employee_document
      unique (employee_id, document_id);
  end if;

  if not exists (
    select 1
    from information_schema.table_constraints
    where constraint_name = 'fk_employee_verification_audit_employee'
      and table_name = 'employee_verification_audit_log'
  ) then
    alter table public.employee_verification_audit_log
      add constraint fk_employee_verification_audit_employee
      foreign key (employee_id)
      references public.employees(id)
      on delete cascade;
  end if;

  if not exists (
    select 1
    from information_schema.table_constraints
    where constraint_name = 'fk_employee_verification_audit_document'
      and table_name = 'employee_verification_audit_log'
  ) then
    alter table public.employee_verification_audit_log
      add constraint fk_employee_verification_audit_document
      foreign key (document_id)
      references public.employee_documents(id)
      on delete cascade;
  end if;

  alter table public.employee_verification_audit_log
    enable row level security;

end $$;
