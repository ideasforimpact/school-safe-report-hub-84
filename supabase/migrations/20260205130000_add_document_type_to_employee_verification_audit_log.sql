do $$
begin
  -- Add document_type_id column if it does not exist
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'employee_verification_audit_log'
      and column_name = 'document_type_id'
  ) then
    alter table public.employee_verification_audit_log
      add column document_type_id uuid;
  end if;

  -- Add foreign key to employee_document_type if not already present
  if not exists (
    select 1
    from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'employee_verification_audit_log'
      and constraint_name = 'fk_employee_verification_audit_document_type'
  ) then
    alter table public.employee_verification_audit_log
      add constraint fk_employee_verification_audit_document_type
      foreign key (document_type_id)
      references public.employee_document_type(id)
      on delete set null;
  end if;
end $$;

