alter table template_categories
  add column if not exists client_type_id uuid references client_type(id) on delete set null;

create index if not exists template_categories_client_type_id_idx
  on template_categories(client_type_id);
