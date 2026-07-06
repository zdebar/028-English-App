import { supabaseInstance } from '@/config/supabase.config';
import { SupabaseError } from '@/types/error.types';

/**
 * Downloads a file from a Supabase storage bucket, bypassing stale cached responses.
 *
 * @param bucketName Supabase storage bucket name.
 * @param dataFile File path inside the bucket; a leading slash is ignored.
 * @returns Downloaded file contents as a Blob.
 * @throws SupabaseError when storage returns an error or no data.
 */
export async function fetchStorage(bucketName: string, dataFile: string): Promise<Blob> {
  const cacheBuster = `?t=${Date.now()}`;
  const filePath = dataFile.replace(/^\//, '') + cacheBuster;

  const { data, error } = await supabaseInstance.storage.from(bucketName).download(filePath);

  if (error || !data) {
    throw new SupabaseError(
      `Error fetching file ${dataFile} from bucket ${bucketName}: ${error?.message ?? 'No data returned'}`,
    );
  }

  return data;
}

/**
 * Lists zip archive metadata from the root of a Supabase storage bucket.
 *
 * @param bucketName Supabase storage bucket name.
 * @returns Map of zip filename to remote updated_at timestamp; non-zip files are ignored.
 * @throws SupabaseError when storage listing fails or returns no data.
 */
export async function fetchStorageBucketMetadata(bucketName: string): Promise<Map<string, string>> {
  const { data, error } = await supabaseInstance.storage.from(bucketName).list('', { limit: 1000 });

  if (error || !data) {
    throw new SupabaseError(
      `Error fetching metadata from bucket ${bucketName}: ${error?.message ?? 'No data returned'}`,
    );
  }

  return new Map(
    data.filter((f) => f.updated_at && f.name.endsWith('.zip')).map((f) => [f.name, f.updated_at]),
  );
}
