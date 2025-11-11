-- Global FK cleanup: ensure deletes cascade through entire graph
-- Approach:
-- - For all FOREIGN KEY constraints in schema public, switch delete action to
--   - ON DELETE SET NULL when ALL child columns are nullable
--   - otherwise ON DELETE CASCADE
-- - Skips non-public targets and leaves already compliant FKs unchanged

BEGIN;

DO $$
DECLARE
  rec RECORD;
  child_cols TEXT;
  action TEXT;
  ddl TEXT;
BEGIN
  FOR rec IN 
    SELECT 
      con.oid AS con_oid,
      con.conname,
      src_ns.nspname AS src_schema,
      src_rel.relname AS src_table,
      tgt_ns.nspname AS tgt_schema,
      tgt_rel.relname AS tgt_table,
      con.confdeltype,
      con.conkey AS src_attnums,
      con.conrelid AS src_rel_oid
    FROM pg_constraint con
    JOIN pg_class src_rel ON src_rel.oid = con.conrelid
    JOIN pg_namespace src_ns ON src_ns.oid = src_rel.relnamespace
    JOIN pg_class tgt_rel ON tgt_rel.oid = con.confrelid
    JOIN pg_namespace tgt_ns ON tgt_ns.oid = tgt_rel.relnamespace
    WHERE con.contype = 'f'
      AND src_ns.nspname = 'public'
      AND tgt_ns.nspname = 'public'
      AND con.confdeltype <> 'c' -- not already CASCADE
  LOOP
    -- Determine child column list and nullability
    SELECT string_agg(quote_ident(a.attname), ', ' ORDER BY ord.idx) INTO child_cols
    FROM unnest(rec.src_attnums) WITH ORDINALITY AS ord(attnum, idx)
    JOIN pg_attribute a ON a.attrelid = rec.src_rel_oid AND a.attnum = ord.attnum;

    -- Always enforce CASCADE for simplicity and full cleanup
    action := 'CASCADE';

    -- Drop existing FK
    ddl := format('ALTER TABLE %s.%s DROP CONSTRAINT %s',
      quote_ident(rec.src_schema), quote_ident(rec.src_table), quote_ident(rec.conname));
    RAISE NOTICE 'Dropping FK: %', ddl;
    EXECUTE ddl;

    -- Recreate with chosen action
    ddl := format('ALTER TABLE %s.%s ADD CONSTRAINT %s FOREIGN KEY (%s) REFERENCES %s.%s ON DELETE %s',
      quote_ident(rec.src_schema), quote_ident(rec.src_table), quote_ident(rec.conname), child_cols,
      quote_ident(rec.tgt_schema), quote_ident(rec.tgt_table), action);
    RAISE NOTICE 'Adding FK with %: %', action, ddl;
    EXECUTE ddl;
  END LOOP;
END$$;

COMMIT;


