import { supabaseInstance } from "@/config/supabase.config";

export async function fetchStorage(
  bucketName: string,
  dataFile: string
): Promise<Blob | null> {
  const cacheBuster = `?t=${Date.now()}`;
  const filePath = dataFile.replace(/^\//, "") + cacheBuster;

  const { data, error } = await supabaseInstance.storage
    .from(bucketName)
    .download(filePath);

  if (error) {
    console.error("Error fetching data:", error.message);
    return null;
  }

  return data;
}
