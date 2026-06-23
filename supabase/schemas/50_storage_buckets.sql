DO $$
DECLARE
  bucket_ids CONSTANT text[] := ARRAY['audio-files', 'audio-archive'];
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit)
  SELECT bucket_id, bucket_id, FALSE, 50 * 1024 * 1024
  FROM unnest(bucket_ids) AS bucket_id
  ON CONFLICT (id) DO UPDATE
  SET
    name = EXCLUDED.name,
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit;

  EXECUTE 'DROP POLICY IF EXISTS audio_files_read_authenticated_anon ON storage.objects';
  EXECUTE format(
    'CREATE POLICY %I ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = ANY (%L::text[]))',
    'audio_files_read_authenticated_anon',
    bucket_ids
  );
END $$;
