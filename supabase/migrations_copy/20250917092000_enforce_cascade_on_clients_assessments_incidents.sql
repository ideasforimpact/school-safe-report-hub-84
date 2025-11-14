-- Enforce ON DELETE CASCADE for all FKs referencing clients(id), assessments(id), incidents(id)
-- This migration updates only FKs that are NOT already ON DELETE CASCADE

BEGIN;

DO $$
DECLARE
  rec RECORD;
  src_table TEXT;
  src_schema TEXT;
  dst_table TEXT;
  dst_schema TEXT;
  conname TEXT;
  src_cols TEXT;
  dst_cols TEXT;
  ddl TEXT;
BEGIN
  FOR rec IN 
    SELECT 
      con.oid AS con_oid,
      con.conname,
      src_ns.nspname AS src_schema,
      src_rel.relname AS src_table,
      dst_ns.nspname AS dst_schema,
      dst_rel.relname AS dst_table,
      con.confdeltype, -- 'c' cascade, 'a' no action, 'r' restrict, 'n' set null, 'd' set default
      con.conkey AS src_attnums,
      con.confkey AS dst_attnums,
      con.conrelid AS src_rel_oid,
      con.confrelid AS dst_rel_oid
    FROM pg_constraint con
    JOIN pg_class src_rel ON src_rel.oid = con.conrelid
    JOIN pg_namespace src_ns ON src_ns.oid = src_rel.relnamespace
    JOIN pg_class dst_rel ON dst_rel.oid = con.confrelid
    JOIN pg_namespace dst_ns ON dst_ns.oid = dst_rel.relnamespace
    WHERE con.contype = 'f'
      AND dst_ns.nspname = 'public'
      AND dst_rel.relname IN ('clients','assessments','incidents')
      AND con.confdeltype <> 'c' -- not already cascade
  LOOP
    src_schema := rec.src_schema;
    src_table := rec.src_table;
    dst_schema := rec.dst_schema;
    dst_table := rec.dst_table;
    conname := rec.conname;

    -- Build column lists in order
    SELECT string_agg(quote_ident(a.attname), ', ' ORDER BY ord.idx) INTO src_cols
    FROM unnest(rec.src_attnums) WITH ORDINALITY AS ord(attnum, idx)
    JOIN pg_attribute a ON a.attrelid = rec.src_rel_oid AND a.attnum = ord.attnum;

    SELECT string_agg(quote_ident(a.attname), ', ' ORDER BY ord.idx) INTO dst_cols
    FROM unnest(rec.dst_attnums) WITH ORDINALITY AS ord(attnum, idx)
    JOIN pg_attribute a ON a.attrelid = rec.dst_rel_oid AND a.attnum = ord.attnum;

    -- Drop constraint
    ddl := format(
      'ALTER TABLE %s.%s DROP CONSTRAINT %s',
      quote_ident(src_schema), quote_ident(src_table), quote_ident(conname)
    );
    RAISE NOTICE 'Dropping FK: %', ddl;
    EXECUTE ddl;

    -- Recreate with ON DELETE CASCADE
    ddl := format(
      'ALTER TABLE %s.%s ADD CONSTRAINT %s FOREIGN KEY (%s) REFERENCES %s.%s (%s) ON DELETE CASCADE',
      quote_ident(src_schema), quote_ident(src_table), quote_ident(conname), src_cols,
      quote_ident(dst_schema), quote_ident(dst_table), dst_cols
    );
    RAISE NOTICE 'Adding CASCADE FK: %', ddl;
    EXECUTE ddl;
  END LOOP;
END$$;

COMMIT;


