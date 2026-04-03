-- Allow MOM/Event date field to store date + time
alter table public.committee_events
  alter column event_date type timestamptz
  using (event_date::timestamptz);

