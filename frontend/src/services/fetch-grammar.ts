import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://<project-ref>.supabase.co";
const supabaseKey = "your-anon-key";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function fetchGrammarData() {
  const storagePath = "grammar/grammar.json"; // Path in Supabase Storage

  try {
    // Step 1: Check if the file exists in storage
    const { data: fileExists, error: fileError } = await supabase.storage
      .from("your-bucket-name")
      .list("grammar", { search: "grammar.json" });

    if (fileError) {
      console.error("Error checking file in storage:", fileError);
      throw new Error("Storage check failed");
    }

    if (fileExists && fileExists.length > 0) {
      // File exists, fetch it from storage
      const { data: file, error: downloadError } = await supabase.storage
        .from("your-bucket-name")
        .download(storagePath);

      if (downloadError) {
        console.error("Error downloading file:", downloadError);
        throw new Error("File download failed");
      }

      // Parse and return the stored JSON object
      const grammarData = await file.text();
      return JSON.parse(grammarData);
    }

    // Step 2: Query the database if the file doesn't exist
    const { data: grammarData, error: dbError } = await supabase
      .from("grammar")
      .select("*");

    if (dbError) {
      console.error("Error querying database:", dbError);
      throw new Error("Database query failed");
    }

    // Step 3: Save the data to Supabase Storage
    const jsonData = JSON.stringify(grammarData);
    const { error: uploadError } = await supabase.storage
      .from("your-bucket-name")
      .upload(storagePath, jsonData, {
        contentType: "application/json",
      });

    if (uploadError) {
      console.error("Error uploading file:", uploadError);
      throw new Error("File upload failed");
    }

    // Step 4: Return the fetched data
    return grammarData;
  } catch (error) {
    console.error("Unexpected error:", error);
    throw error;
  }
}
