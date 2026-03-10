do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'employee_verification_audit_log'
      and column_name = 'is_verified_by_backoffice'
  ) then
    alter table public.employee_verification_audit_log
      add column is_verified_by_backoffice integer not null default 0;
  end if;
end $$;
