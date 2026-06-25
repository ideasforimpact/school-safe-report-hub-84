-- Restore the 3 global template categories (client_type_id = NULL).
-- These are used by the assessment template form without any client-type filtering.
insert into template_categories (id, name, description, client_type_id, created_at, updated_at)
values
  (gen_random_uuid(), 'Risk',       'Risk assessment and management templates',       null, now(), now()),
  (gen_random_uuid(), 'Compliance', 'Compliance and regulatory assessment templates', null, now(), now()),
  (gen_random_uuid(), 'Safety',     'Safety-related assessment templates',            null, now(), now())
on conflict do nothing;
