BEGIN;

DO $$
DECLARE
  tables_to_truncate TEXT;
BEGIN
  SELECT string_agg(format('%I.%I', schemaname, tablename), ', ' ORDER BY tablename)
  INTO tables_to_truncate
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename NOT IN ('users', 'levels', 'notes');

  IF tables_to_truncate IS NOT NULL THEN
    EXECUTE format(
      'TRUNCATE TABLE %s RESTART IDENTITY CASCADE',
      tables_to_truncate
    );
  END IF;
END;
$$;

COMMIT;
