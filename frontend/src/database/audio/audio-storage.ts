import { supabaseInstance } from '@/config/supabase.config';
import { SupabaseError } from '@/types/error.types';

/**
 * Downloads a file from a Supabase storage bucket.
 *
 * @param bucketName Supabase storage bucket name.
 * @param objectPath File path inside the bucket; a leading slash is ignored.
 * @returns Downloaded file contents as a Blob.
 * @throws SupabaseError when storage returns an error or no data.
 */
export async function downloadStorageObject(bucketName: string, objectPath: string): Promise<Blob> {
  const filePath = objectPath.replace(/^\//, '');

  const { data, error } = await supabaseInstance.storage.from(bucketName).download(filePath);

  if (error || !data) {
    throw new SupabaseError(
      `Error fetching file ${objectPath} from bucket ${bucketName}: ${error?.message ?? 'No data returned'}`,
      error ?? undefined,
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
export async function fetchZipArchiveMetadata(bucketName: string): Promise<Map<string, string>> {
  const { data, error } = await supabaseInstance.storage.from(bucketName).list('');

  if (error || !data) {
    throw new SupabaseError(
      `Error fetching metadata from bucket ${bucketName}: ${error?.message ?? 'No data returned'}`,
      error ?? undefined,
    );
  }

  return new Map(
    data.filter((file) => file.updated_at && file.name.endsWith('.zip'))
      .map((file) => [file.name, file.updated_at]),
  );
}
