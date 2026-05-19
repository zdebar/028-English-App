import { supabaseInstance } from '@/config/supabase.config';
import { SupabaseError } from '@/types/error.types';

/**
 * Fetches a file from Supabase storage bucket.
 *
 * @param bucketName name of the storage bucket
 * @param dataFile name of the file to fetch
 * @returns Blob data or null on missing/error
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
 * Fetches metadata for all files in the root of a Supabase storage bucket.
 * Returns a map of filename → updated_at timestamp.
 *
 * @param bucketName name of the storage bucket
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
