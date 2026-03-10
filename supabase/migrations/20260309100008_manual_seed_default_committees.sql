-- Manual default committee seeding (no committee_defaults dependency)

-- Optional cleanup in case legacy table still exists
drop table if exists public.committee_defaults cascade;

-- Replace trigger function with a manual hardcoded list
drop trigger if exists trg_seed_default_committees_for_client on public.clients;
drop function if exists public.seed_default_committees_for_client();

create or replace function public.seed_default_committees_for_client()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.committees (
    client_id,
    name,
    description,
    chairperson_employee_id,
    status,
    created_by,
    updated_by
  )
  select
    new.id as client_id,
    defaults.name,
    null as description,
    null as chairperson_employee_id,
    true as status,
    null as created_by,
    null as updated_by
  from (
    values
      ('School Management Committee'),
      ('POCSO / Child Protection Committee'),
      ('Internal Complaints Committee (POSH)'),
      ('Anti-Bullying / Anti-Ragging Committee'),
      ('School Safety Committee'),
      ('Disaster Management Committee'),
      ('Transport Safety Committee'),
      ('Grievance Redressal Committee'),
      ('Health & Wellness Committee'),
      ('Cyber Safety Committee'),
      ('Discipline Committee'),
      ('Inclusion / Special Needs Committee')
  ) as defaults(name)
  where not exists (
    select 1
    from public.committees cm
    where cm.client_id = new.id
      and lower(cm.name) = lower(defaults.name)
  );

  return new;
end;
$$;

create trigger trg_seed_default_committees_for_client
after insert on public.clients
for each row
execute function public.seed_default_committees_for_client();

-- Backfill existing clients with same manual default list
insert into public.committees (
  client_id,
  name,
  description,
  chairperson_employee_id,
  status,
  created_by,
  updated_by
)
select
  c.id as client_id,
  defaults.name,
  null as description,
  null as chairperson_employee_id,
  true as status,
  null as created_by,
  null as updated_by
from public.clients c
cross join (
  values
    ('School Management Committee'),
    ('POCSO / Child Protection Committee'),
    ('Internal Complaints Committee (POSH)'),
    ('Anti-Bullying / Anti-Ragging Committee'),
    ('School Safety Committee'),
    ('Disaster Management Committee'),
    ('Transport Safety Committee'),
    ('Grievance Redressal Committee'),
    ('Health & Wellness Committee'),
    ('Cyber Safety Committee'),
    ('Discipline Committee'),
    ('Inclusion / Special Needs Committee')
) as defaults(name)
where not exists (
  select 1
  from public.committees cm
  where cm.client_id = c.id
    and lower(cm.name) = lower(defaults.name)
);

